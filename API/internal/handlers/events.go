package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/sse"
)

// Events holds SSE streaming handlers.
type Events struct {
	hub *sse.Hub
}

// NewEvents creates an Events handler group.
func NewEvents(hub *sse.Hub) *Events {
	return &Events{hub: hub}
}

// Stream opens an SSE connection for a specific game.
func (h *Events) Stream(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	gid := chi.URLParam(r, "gameId")
	gameKey := sse.GameKey(sid, gid)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	client := h.hub.Subscribe(gameKey)
	defer h.hub.Unsubscribe(client)

	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	fmt.Fprintf(w, "event: connected\ndata: {\"gameKey\":\"%s\"}\n\n", gameKey)
	flusher.Flush()

	for {
		select {
		case msg, ok := <-client.Ch:
			if !ok {
				return
			}
			fmt.Fprintf(w, "event: version-changed\ndata: %s\n\n", msg)
			flusher.Flush()
		case <-heartbeat.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}
