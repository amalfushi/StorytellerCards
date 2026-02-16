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

func setupGameRouter(t *testing.T) (*chi.Mux, *storage.FileStore) {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	games := NewGames(store)

	r := chi.NewRouter()
	r.Post("/api/sessions/{sessionId}/games", games.Create)
	r.Get("/api/sessions/{sessionId}/games/{gameId}", games.Get)
	r.Put("/api/sessions/{sessionId}/games/{gameId}", games.Update)

	return r, store
}

func TestGamesCreate(t *testing.T) {
	r, _ := setupGameRouter(t)

	t.Run("creates a game", func(t *testing.T) {
		game := models.Game{
			ID:           "game-1",
			ScriptID:     "boozling",
			CurrentDay:   1,
			CurrentPhase: models.Night,
			IsFirstNight: true,
			Players:      []models.PlayerSeat{},
			NightHistory: []models.NightHistoryEntry{},
		}
		body, _ := json.Marshal(game)

		req := httptest.NewRequest("POST", "/api/sessions/sess-1/games", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusCreated)
		}

		var created models.Game
		if err := json.NewDecoder(w.Body).Decode(&created); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if created.ID != "game-1" {
			t.Errorf("ID = %q, want %q", created.ID, "game-1")
		}
		if created.SessionID != "sess-1" {
			t.Errorf("SessionID = %q, want %q", created.SessionID, "sess-1")
		}
	})
}

func TestGamesGetAfterCreate(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create a game first
	game := models.Game{
		ID:           "game-get",
		ScriptID:     "boozling",
		CurrentDay:   1,
		CurrentPhase: models.Night,
		IsFirstNight: true,
		Players:      []models.PlayerSeat{},
		NightHistory: []models.NightHistoryEntry{},
	}
	body, _ := json.Marshal(game)
	req := httptest.NewRequest("POST", "/api/sessions/sess-1/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("get returns the created game", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/sess-1/games/game-get", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var got models.Game
		if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if got.ID != "game-get" {
			t.Errorf("ID = %q, want %q", got.ID, "game-get")
		}
	})
}

func TestGamesUpdate(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create
	game := models.Game{
		ID:           "game-upd",
		ScriptID:     "boozling",
		CurrentDay:   1,
		CurrentPhase: models.Night,
		IsFirstNight: true,
		Players:      []models.PlayerSeat{},
		NightHistory: []models.NightHistoryEntry{},
	}
	body, _ := json.Marshal(game)
	req := httptest.NewRequest("POST", "/api/sessions/sess-1/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Run("update changes the game", func(t *testing.T) {
		game.CurrentDay = 2
		game.CurrentPhase = models.Day
		game.IsFirstNight = false
		body, _ := json.Marshal(game)

		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/game-upd", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update status = %d, want %d", w.Code, http.StatusOK)
		}

		// Verify the update
		req = httptest.NewRequest("GET", "/api/sessions/sess-1/games/game-upd", nil)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)

		var got models.Game
		if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if got.CurrentDay != 2 {
			t.Errorf("CurrentDay = %d, want %d", got.CurrentDay, 2)
		}
		if got.CurrentPhase != models.Day {
			t.Errorf("CurrentPhase = %q, want %q", got.CurrentPhase, models.Day)
		}
	})
}

func TestGamesCreateMissingID(t *testing.T) {
	r, _ := setupGameRouter(t)

	game := models.Game{ScriptID: "boozling"}
	body, _ := json.Marshal(game)
	req := httptest.NewRequest("POST", "/api/sessions/sess-1/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}
