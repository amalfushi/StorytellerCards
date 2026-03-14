package handlers_test

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/handlers"
	"storyteller-cards-api/internal/sse"
)

func TestEventsStreamHeaders(t *testing.T) {
	hub := sse.NewHub()
	ev := handlers.NewEvents(hub)

	r := chi.NewRouter()
	r.Get("/api/sessions/{sessionId}/games/{gameId}/events", ev.Stream)

	req := httptest.NewRequest("GET", "/api/sessions/s1/games/g1/events", nil)
	ctx, cancel := context.WithCancel(req.Context())
	cancel() // pre-cancel so handler exits after writing initial event
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if ct := rr.Header().Get("Content-Type"); ct != "text/event-stream" {
		t.Errorf("Content-Type = %q, want text/event-stream", ct)
	}
	if cc := rr.Header().Get("Cache-Control"); cc != "no-cache" {
		t.Errorf("Cache-Control = %q, want no-cache", cc)
	}
	if conn := rr.Header().Get("Connection"); conn != "keep-alive" {
		t.Errorf("Connection = %q, want keep-alive", conn)
	}
}

func TestEventsStreamConnectedEvent(t *testing.T) {
	hub := sse.NewHub()
	ev := handlers.NewEvents(hub)

	r := chi.NewRouter()
	r.Get("/api/sessions/{sessionId}/games/{gameId}/events", ev.Stream)

	req := httptest.NewRequest("GET", "/api/sessions/s1/games/g1/events", nil)
	ctx, cancel := context.WithCancel(req.Context())
	cancel()
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	body := rr.Body.String()
	if !strings.Contains(body, "event: connected") {
		t.Errorf("body missing 'event: connected', got:\n%s", body)
	}
	if !strings.Contains(body, `"gameKey":"s1/g1"`) {
		t.Errorf("body missing gameKey, got:\n%s", body)
	}
}
