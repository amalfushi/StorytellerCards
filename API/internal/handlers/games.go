package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/sse"
	"storyteller-cards-api/internal/storage"
)

// Games holds game-related HTTP handlers.
type Games struct {
	store *storage.FileStore
	hub   *sse.Hub
}

// NewGames creates a Games handler group.
func NewGames(s *storage.FileStore, hub *sse.Hub) *Games {
	return &Games{store: s, hub: hub}
}

// Get returns a single game. GET /api/sessions/{sessionId}/games/{gameId}
func (h *Games) Get(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	gid := chi.URLParam(r, "gameId")
	g, err := h.store.GetGame(sid, gid)
	if err != nil {
		log.Printf("WARN get game %s/%s: %v", sid, gid, err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, g)
}

// GetVersion returns only the version info for a game. GET /api/sessions/{sessionId}/games/{gameId}/version
func (h *Games) GetVersion(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	gid := chi.URLParam(r, "gameId")
	g, err := h.store.GetGame(sid, gid)
	if err != nil {
		log.Printf("WARN get game version %s/%s: %v", sid, gid, err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, models.VersionInfo{
		Version:   g.Version,
		UpdatedAt: g.UpdatedAt,
	})
}

// Create stores a new game. POST /api/sessions/{sessionId}/games
func (h *Games) Create(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	var g models.Game
	if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	if g.ID == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	g.SessionID = sid
	g.Version = 1
	g.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := h.store.SaveGame(g); err != nil {
		log.Printf("ERROR save game: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, g)
}

// Update replaces an existing game (or creates it if it doesn't exist).
// PUT /api/sessions/{sessionId}/games/{gameId}
func (h *Games) Update(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	gid := chi.URLParam(r, "gameId")
	var g models.Game
	if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	g.ID = gid
	g.SessionID = sid

	// Check if the game already exists
	existing, existErr := h.store.GetGame(sid, gid)

	// Optimistic concurrency: check X-Expected-Version header (only if game exists)
	if evHeader := r.Header.Get("X-Expected-Version"); evHeader != "" && existErr == nil {
		expectedVersion, err := strconv.Atoi(evHeader)
		if err != nil {
			http.Error(w, "bad X-Expected-Version header", http.StatusBadRequest)
			return
		}
		if existing.Version != expectedVersion {
			writeJSON(w, http.StatusConflict, map[string]any{
				"error":           "version conflict",
				"serverVersion":   existing.Version,
				"expectedVersion": expectedVersion,
			})
			return
		}
	}

	// Auto-increment version and set timestamp
	g.Version = g.Version + 1
	g.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := h.store.SaveGame(g); err != nil {
		log.Printf("ERROR update game %s/%s: %v", sid, gid, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	gameKey := sse.GameKey(sid, gid)
	h.hub.Broadcast(gameKey, fmt.Sprintf(`{"version":%d,"updatedAt":"%s"}`, g.Version, g.UpdatedAt))

	status := http.StatusOK
	if existErr != nil {
		status = http.StatusCreated
		log.Printf("INFO created game %s/%s via PUT (upsert)", sid, gid)
	}
	writeJSON(w, status, g)
}

// Delete removes a single game. DELETE /api/sessions/{sessionId}/games/{gameId}
func (h *Games) Delete(w http.ResponseWriter, r *http.Request) {
	sid := chi.URLParam(r, "sessionId")
	gid := chi.URLParam(r, "gameId")
	if err := h.store.DeleteGame(sid, gid); err != nil {
		log.Printf("ERROR delete game %s/%s: %v", sid, gid, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
