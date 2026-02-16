package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/storage"
)

// Sessions holds session-related HTTP handlers.
type Sessions struct {
	store *storage.FileStore
}

// NewSessions creates a Sessions handler group.
func NewSessions(s *storage.FileStore) *Sessions {
	return &Sessions{store: s}
}

// List returns all sessions. GET /api/sessions
func (h *Sessions) List(w http.ResponseWriter, r *http.Request) {
	sessions, err := h.store.ListSessions()
	if err != nil {
		log.Printf("ERROR list sessions: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, sessions)
}

// Get returns a single session. GET /api/sessions/{id}
func (h *Sessions) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s, err := h.store.GetSession(id)
	if err != nil {
		log.Printf("WARN get session %s: %v", id, err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// Create stores a new session. POST /api/sessions
func (h *Sessions) Create(w http.ResponseWriter, r *http.Request) {
	var s models.Session
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	if s.ID == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	if err := h.store.SaveSession(s); err != nil {
		log.Printf("ERROR save session: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, s)
}

// Update replaces an existing session. PUT /api/sessions/{id}
func (h *Sessions) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var s models.Session
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	s.ID = id
	if err := h.store.SaveSession(s); err != nil {
		log.Printf("ERROR update session %s: %v", id, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// Delete removes a session and its games. DELETE /api/sessions/{id}
func (h *Sessions) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.DeleteSession(id); err != nil {
		log.Printf("ERROR delete session %s: %v", id, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
