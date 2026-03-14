package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/sse"
	"storyteller-cards-api/internal/storage"
)

func setupGameRouter(t *testing.T) (*chi.Mux, *storage.FileStore) {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	games := NewGames(store, sse.NewHub())

	r := chi.NewRouter()
	r.Post("/api/sessions/{sessionId}/games", games.Create)
	r.Get("/api/sessions/{sessionId}/games/{gameId}", games.Get)
	r.Put("/api/sessions/{sessionId}/games/{gameId}", games.Update)
	r.Get("/api/sessions/{sessionId}/games/{gameId}/version", games.GetVersion)

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

func TestGamesCreateSetsVersion(t *testing.T) {
	r, _ := setupGameRouter(t)

	game := models.Game{
		ID:           "ver-game",
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
	if created.Version != 1 {
		t.Errorf("Version = %d, want 1", created.Version)
	}
	if created.UpdatedAt == "" {
		t.Error("UpdatedAt should be set on create")
	}
}

func TestGamesUpdateIncrementsVersion(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create
	game := models.Game{
		ID:           "inc-game",
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

	var created models.Game
	json.NewDecoder(w.Body).Decode(&created)

	t.Run("first update increments version to 2", func(t *testing.T) {
		created.CurrentDay = 2
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/inc-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var updated models.Game
		json.NewDecoder(w.Body).Decode(&updated)
		if updated.Version != 2 {
			t.Errorf("Version = %d, want 2", updated.Version)
		}
	})
}

func TestGamesUpdateConflict(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create
	game := models.Game{
		ID:           "conflict-game",
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

	var created models.Game
	json.NewDecoder(w.Body).Decode(&created)

	t.Run("409 when expected version does not match", func(t *testing.T) {
		created.CurrentDay = 3
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/conflict-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "99")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusConflict {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusConflict)
		}
	})

	t.Run("succeeds when expected version matches", func(t *testing.T) {
		created.CurrentDay = 3
		body, _ := json.Marshal(created)
		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/conflict-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}
	})
}

func TestGamesGetVersion(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create
	game := models.Game{
		ID:           "ver-check-game",
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

	t.Run("returns version info", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/sess-1/games/ver-check-game/version", nil)
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

	t.Run("returns 404 for nonexistent game", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/sess-1/games/nonexistent/version", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
		}
	})
}

func TestGamesMultiClientVersioning(t *testing.T) {
	r, _ := setupGameRouter(t)

	// Create game (version 1)
	game := models.Game{
		ID:           "multi-client-game",
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

	var v1 models.Game
	json.NewDecoder(w.Body).Decode(&v1)

	t.Run("client A updates from v1 to v2", func(t *testing.T) {
		v1.CurrentDay = 2
		body, _ := json.Marshal(v1)
		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/multi-client-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var v2 models.Game
		json.NewDecoder(w.Body).Decode(&v2)
		if v2.Version != 2 {
			t.Errorf("Version = %d, want 2", v2.Version)
		}
	})

	t.Run("client B stale write from v1 gets 409", func(t *testing.T) {
		v1.CurrentPhase = models.Day
		body, _ := json.Marshal(v1)
		req := httptest.NewRequest("PUT", "/api/sessions/sess-1/games/multi-client-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusConflict {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusConflict)
		}
	})

	t.Run("version endpoint reflects latest version", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/sess-1/games/multi-client-game/version", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		var info models.VersionInfo
		json.NewDecoder(w.Body).Decode(&info)
		if info.Version != 2 {
			t.Errorf("Version = %d, want 2", info.Version)
		}
	})
}
