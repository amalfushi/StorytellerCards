package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/storage"
)

// Scripts holds script-related HTTP handlers.
type Scripts struct {
	store *storage.FileStore
}

// NewScripts creates a Scripts handler group.
func NewScripts(s *storage.FileStore) *Scripts {
	return &Scripts{store: s}
}

// Import accepts a script and persists it. POST /api/scripts/import
func (h *Scripts) Import(w http.ResponseWriter, r *http.Request) {
	var s models.Script
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}
	if s.ID == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	if err := h.store.SaveScript(s); err != nil {
		log.Printf("ERROR save script: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, s)
}

// List returns all scripts. GET /api/scripts
func (h *Scripts) List(w http.ResponseWriter, r *http.Request) {
	scripts, err := h.store.ListScripts()
	if err != nil {
		log.Printf("ERROR list scripts: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, scripts)
}

// Get returns a single script. GET /api/scripts/{id}
func (h *Scripts) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s, err := h.store.GetScript(id)
	if err != nil {
		log.Printf("WARN get script %s: %v", id, err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, s)
}
