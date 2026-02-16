package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/storage"
)

func setupSessionRouter(t *testing.T) (*chi.Mux, *storage.FileStore) {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	sessions := NewSessions(store)

	r := chi.NewRouter()
	r.Get("/api/sessions", sessions.List)
	r.Post("/api/sessions", sessions.Create)
	r.Get("/api/sessions/{id}", sessions.Get)
	r.Put("/api/sessions/{id}", sessions.Update)
	r.Delete("/api/sessions/{id}", sessions.Delete)

	return r, store
}

func TestSessionsList(t *testing.T) {
	r, _ := setupSessionRouter(t)

	t.Run("returns empty list", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var sessions []models.Session
		if err := json.NewDecoder(w.Body).Decode(&sessions); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if len(sessions) != 0 {
			t.Errorf("expected 0 sessions, got %d", len(sessions))
		}
	})
}

func TestSessionsCreate(t *testing.T) {
	r, _ := setupSessionRouter(t)

	t.Run("creates a session", func(t *testing.T) {
		session := models.Session{
			ID:        "test-sess",
			Name:      "Test Session",
			CreatedAt: "2025-01-01T00:00:00Z",
		}
		body, _ := json.Marshal(session)

		req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusCreated)
		}

		var created models.Session
		if err := json.NewDecoder(w.Body).Decode(&created); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if created.ID != "test-sess" {
			t.Errorf("ID = %q, want %q", created.ID, "test-sess")
		}
	})
}

func TestSessionsGetAfterCreate(t *testing.T) {
	r, _ := setupSessionRouter(t)

	// Create
	session := models.Session{
		ID:        "get-sess",
		Name:      "Get Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d", w.Code, http.StatusCreated)
	}

	t.Run("get returns the created session", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/get-sess", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var got models.Session
		if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if got.Name != "Get Session" {
			t.Errorf("Name = %q, want %q", got.Name, "Get Session")
		}
	})
}

func TestSessionsDelete(t *testing.T) {
	r, _ := setupSessionRouter(t)

	// Create
	session := models.Session{
		ID:        "del-sess",
		Name:      "Delete Me",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("delete removes it", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/api/sessions/del-sess", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusNoContent {
			t.Fatalf("delete status = %d, want %d", w.Code, http.StatusNoContent)
		}

		// Verify it's gone
		req = httptest.NewRequest("GET", "/api/sessions/del-sess", nil)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("get after delete status = %d, want %d", w.Code, http.StatusNotFound)
		}
	})
}

func TestSessionsCreateMissingID(t *testing.T) {
	r, _ := setupSessionRouter(t)

	session := models.Session{Name: "No ID"}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}
