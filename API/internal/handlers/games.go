package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/storage"
)

// Games holds game-related HTTP handlers.
type Games struct {
	store *storage.FileStore
}

// NewGames creates a Games handler group.
func NewGames(s *storage.FileStore) *Games {
	return &Games{store: s}
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
	if err := h.store.SaveGame(g); err != nil {
		log.Printf("ERROR save game: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, g)
}

// Update replaces an existing game. PUT /api/sessions/{sessionId}/games/{gameId}
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
	if err := h.store.SaveGame(g); err != nil {
		log.Printf("ERROR update game %s/%s: %v", sid, gid, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, g)
}
