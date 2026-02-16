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

func setupScriptRouter(t *testing.T) (*chi.Mux, *storage.FileStore) {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	scripts := NewScripts(store)

	r := chi.NewRouter()
	r.Post("/api/scripts/import", scripts.Import)
	r.Get("/api/scripts", scripts.List)
	r.Get("/api/scripts/{id}", scripts.Get)

	return r, store
}

func TestScriptsImport(t *testing.T) {
	r, _ := setupScriptRouter(t)

	t.Run("imports a script", func(t *testing.T) {
		script := models.Script{
			ID:           "boozling",
			Name:         "Boozling",
			Author:       "Lau",
			CharacterIDs: []string{"noble", "pixie", "chef"},
		}
		body, _ := json.Marshal(script)

		req := httptest.NewRequest("POST", "/api/scripts/import", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusCreated)
		}

		var created models.Script
		if err := json.NewDecoder(w.Body).Decode(&created); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if created.ID != "boozling" {
			t.Errorf("ID = %q, want %q", created.ID, "boozling")
		}
		if len(created.CharacterIDs) != 3 {
			t.Errorf("expected 3 character IDs, got %d", len(created.CharacterIDs))
		}
	})
}

func TestScriptsListAfterImport(t *testing.T) {
	r, _ := setupScriptRouter(t)

	// Import a script
	script := models.Script{
		ID:           "boozling",
		Name:         "Boozling",
		Author:       "Lau",
		CharacterIDs: []string{"noble", "pixie"},
	}
	body, _ := json.Marshal(script)
	req := httptest.NewRequest("POST", "/api/scripts/import", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("list returns imported scripts", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/scripts", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var scripts []models.Script
		if err := json.NewDecoder(w.Body).Decode(&scripts); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if len(scripts) != 1 {
			t.Errorf("expected 1 script, got %d", len(scripts))
		}
		if scripts[0].Name != "Boozling" {
			t.Errorf("Name = %q, want %q", scripts[0].Name, "Boozling")
		}
	})
}

func TestScriptsGetAfterImport(t *testing.T) {
	r, _ := setupScriptRouter(t)

	// Import
	script := models.Script{
		ID:           "tb",
		Name:         "Trouble Brewing",
		Author:       "TPI",
		CharacterIDs: []string{"washerwoman", "imp"},
	}
	body, _ := json.Marshal(script)
	req := httptest.NewRequest("POST", "/api/scripts/import", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("get returns the imported script", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/scripts/tb", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var got models.Script
		if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if got.Name != "Trouble Brewing" {
			t.Errorf("Name = %q, want %q", got.Name, "Trouble Brewing")
		}
	})
}

func TestScriptsImportMissingID(t *testing.T) {
	r, _ := setupScriptRouter(t)

	script := models.Script{Name: "No ID", Author: "Test"}
	body, _ := json.Marshal(script)
	req := httptest.NewRequest("POST", "/api/scripts/import", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestScriptsListEmpty(t *testing.T) {
	r, _ := setupScriptRouter(t)

	req := httptest.NewRequest("GET", "/api/scripts", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var scripts []models.Script
	if err := json.NewDecoder(w.Body).Decode(&scripts); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(scripts) != 0 {
		t.Errorf("expected 0 scripts, got %d", len(scripts))
	}
}
