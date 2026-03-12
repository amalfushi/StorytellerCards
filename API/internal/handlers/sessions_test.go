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
	r.Get("/api/sessions/{id}/version", sessions.GetVersion)

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

func TestSessionsCreateSetsVersion(t *testing.T) {
	r, _ := setupSessionRouter(t)

	session := models.Session{
		ID:        "ver-sess",
		Name:      "Versioned Session",
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
	if created.Version != 1 {
		t.Errorf("Version = %d, want 1", created.Version)
	}
	if created.UpdatedAt == "" {
		t.Error("UpdatedAt should be set on create")
	}
}

func TestSessionsUpdateIncrementsVersion(t *testing.T) {
	r, _ := setupSessionRouter(t)

	// Create
	session := models.Session{
		ID:        "inc-sess",
		Name:      "Inc Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var created models.Session
	json.NewDecoder(w.Body).Decode(&created)

	t.Run("first update increments version to 2", func(t *testing.T) {
		created.Name = "Updated"
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/inc-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var updated models.Session
		json.NewDecoder(w.Body).Decode(&updated)
		if updated.Version != 2 {
			t.Errorf("Version = %d, want 2", updated.Version)
		}
	})
}

func TestSessionsUpdateConflict(t *testing.T) {
	r, _ := setupSessionRouter(t)

	// Create
	session := models.Session{
		ID:        "conflict-sess",
		Name:      "Conflict Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var created models.Session
	json.NewDecoder(w.Body).Decode(&created)

	t.Run("409 when expected version does not match", func(t *testing.T) {
		created.Name = "Stale Update"
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/conflict-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "99")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusConflict {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusConflict)
		}
	})

	t.Run("succeeds when expected version matches", func(t *testing.T) {
		created.Name = "Fresh Update"
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/conflict-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}
	})

	t.Run("succeeds without X-Expected-Version header", func(t *testing.T) {
		created.Name = "No Version Header"
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/conflict-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}
	})
}

func TestSessionsGetVersion(t *testing.T) {
	r, _ := setupSessionRouter(t)

	// Create
	session := models.Session{
		ID:        "ver-check-sess",
		Name:      "Version Check",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	body, _ := json.Marshal(session)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("returns version info", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/ver-check-sess/version", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var info models.VersionInfo
		if err := json.NewDecoder(w.Body).Decode(&info); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if info.Version != 1 {
			t.Errorf("Version = %d, want 1", info.Version)
		}
		if info.UpdatedAt == "" {
			t.Error("UpdatedAt should not be empty")
		}
	})

	t.Run("returns 404 for nonexistent session", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/nonexistent/version", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
		}
	})
}

func TestSessionsBackwardCompatVersion(t *testing.T) {
	_, store := setupSessionRouter(t)

	// Manually save a session without version (simulates pre-versioning data)
	session := models.Session{
		ID:        "legacy-sess",
		Name:      "Legacy Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	}
	if err := store.SaveSession(session); err != nil {
		t.Fatalf("save: %v", err)
	}

	got, err := store.GetSession("legacy-sess")
	if err != nil {
		t.Fatalf("get: %v", err)
	}

	// Zero value for int means version defaults to 0 for legacy data
	if got.Version != 0 {
		t.Errorf("legacy Version = %d, want 0", got.Version)
	}
}
