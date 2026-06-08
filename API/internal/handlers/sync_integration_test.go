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

// setupFullRouter creates a router with both session and game routes including version endpoints.
func setupFullRouter(t *testing.T) (*chi.Mux, *storage.FileStore) {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	sessions := NewSessions(store)
	games := NewGames(store, sse.NewHub())

	r := chi.NewRouter()
	r.Route("/api", func(r chi.Router) {
		r.Get("/sessions", sessions.List)
		r.Post("/sessions", sessions.Create)
		r.Get("/sessions/{id}", sessions.Get)
		r.Put("/sessions/{id}", sessions.Update)
		r.Delete("/sessions/{id}", sessions.Delete)
		r.Get("/sessions/{id}/version", sessions.GetVersion)

		r.Post("/sessions/{sessionId}/games", games.Create)
		r.Get("/sessions/{sessionId}/games/{gameId}", games.Get)
		r.Put("/sessions/{sessionId}/games/{gameId}", games.Update)
		r.Get("/sessions/{sessionId}/games/{gameId}/version", games.GetVersion)
	})

	return r, store
}

// helper to create a session via HTTP
func createSessionHTTP(t *testing.T, router *chi.Mux, s models.Session) models.Session {
	t.Helper()
	body, _ := json.Marshal(s)
	req := httptest.NewRequest("POST", "/api/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create session: status = %d, want %d", w.Code, http.StatusCreated)
	}
	var created models.Session
	json.NewDecoder(w.Body).Decode(&created)
	return created
}

// helper to create a game via HTTP
func createGameHTTP(t *testing.T, router *chi.Mux, sid string, g models.Game) models.Game {
	t.Helper()
	body, _ := json.Marshal(g)
	req := httptest.NewRequest("POST", "/api/sessions/"+sid+"/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create game: status = %d, want %d", w.Code, http.StatusCreated)
	}
	var created models.Game
	json.NewDecoder(w.Body).Decode(&created)
	return created
}

func TestIntegrationMultiClientSession(t *testing.T) {
	router, _ := setupFullRouter(t)

	// Create session
	session := createSessionHTTP(t, router, models.Session{
		ID:        "multi-sess",
		Name:      "Multi-client Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	})

	if session.Version != 1 {
		t.Fatalf("initial version = %d, want 1", session.Version)
	}

	t.Run("client A updates session v1 to v2", func(t *testing.T) {
		session.Name = "Updated by Client A"
		body, _ := json.Marshal(session)
		req := httptest.NewRequest("PUT", "/api/sessions/multi-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var updated models.Session
		json.NewDecoder(w.Body).Decode(&updated)
		if updated.Version != 2 {
			t.Errorf("Version = %d, want 2", updated.Version)
		}
		if updated.Name != "Updated by Client A" {
			t.Errorf("Name = %q, want %q", updated.Name, "Updated by Client A")
		}
		session = updated
	})

	t.Run("client B polls version and sees v2", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/multi-sess/version", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var info models.VersionInfo
		json.NewDecoder(w.Body).Decode(&info)
		if info.Version != 2 {
			t.Errorf("polled version = %d, want 2", info.Version)
		}
	})

	t.Run("client B fetches full session and sees client A's update", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/multi-sess", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var got models.Session
		json.NewDecoder(w.Body).Decode(&got)
		if got.Name != "Updated by Client A" {
			t.Errorf("Name = %q, want %q", got.Name, "Updated by Client A")
		}
	})

	t.Run("client B stale write with v1 gets 409", func(t *testing.T) {
		stale := session
		stale.Name = "Stale update by Client B"
		stale.Version = 1
		body, _ := json.Marshal(stale)
		req := httptest.NewRequest("PUT", "/api/sessions/multi-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusConflict {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusConflict)
		}
	})

	t.Run("client B fetches latest then updates with correct version", func(t *testing.T) {
		// Fetch latest
		req := httptest.NewRequest("GET", "/api/sessions/multi-sess", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var latest models.Session
		json.NewDecoder(w.Body).Decode(&latest)

		// Update with correct version
		latest.Name = "Updated by Client B"
		body, _ := json.Marshal(latest)
		req = httptest.NewRequest("PUT", "/api/sessions/multi-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "2")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
		}

		var updated models.Session
		json.NewDecoder(w.Body).Decode(&updated)
		if updated.Version != 3 {
			t.Errorf("Version = %d, want 3", updated.Version)
		}
	})
}

func TestIntegrationMultiClientGame(t *testing.T) {
	router, _ := setupFullRouter(t)

	// Create session first
	createSessionHTTP(t, router, models.Session{
		ID:        "game-int-sess",
		Name:      "Game Integration Session",
		CreatedAt: "2025-01-01T00:00:00Z",
	})

	// Create game
	game := createGameHTTP(t, router, "game-int-sess", models.Game{
		ID:           "game-int",
		ScriptID:     "tb",
		CurrentDay:   1,
		CurrentPhase: models.Night,
		IsFirstNight: true,
		Slots:        []models.Slot{},
		Participants: []models.Participant{},
		PlayerState:  map[string]models.PlayerGameState{},
		NightHistory: []models.NightHistoryEntry{},
	})

	if game.Version != 1 {
		t.Fatalf("initial version = %d, want 1", game.Version)
	}

	t.Run("sequential updates increment version", func(t *testing.T) {
		// Update 1: v1 → v2
		game.CurrentDay = 2
		body, _ := json.Marshal(game)
		req := httptest.NewRequest("PUT", "/api/sessions/game-int-sess/games/game-int", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update 1 status = %d, want %d", w.Code, http.StatusOK)
		}

		var v2 models.Game
		json.NewDecoder(w.Body).Decode(&v2)
		if v2.Version != 2 {
			t.Errorf("Version = %d, want 2", v2.Version)
		}

		// Update 2: v2 → v3
		v2.CurrentPhase = models.Day
		body, _ = json.Marshal(v2)
		req = httptest.NewRequest("PUT", "/api/sessions/game-int-sess/games/game-int", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "2")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update 2 status = %d, want %d", w.Code, http.StatusOK)
		}

		var v3 models.Game
		json.NewDecoder(w.Body).Decode(&v3)
		if v3.Version != 3 {
			t.Errorf("Version = %d, want 3", v3.Version)
		}
	})

	t.Run("version endpoint tracks latest", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/sessions/game-int-sess/games/game-int/version", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var info models.VersionInfo
		json.NewDecoder(w.Body).Decode(&info)
		if info.Version != 3 {
			t.Errorf("Version = %d, want 3", info.Version)
		}
	})
}

func TestIntegrationEndToEndScenario(t *testing.T) {
	router, _ := setupFullRouter(t)

	t.Run("full lifecycle: create → update → poll → verify convergence", func(t *testing.T) {
		// Device A: Create session
		session := createSessionHTTP(t, router, models.Session{
			ID:        "e2e-sess",
			Name:      "E2E Session",
			CreatedAt: "2025-01-01T00:00:00Z",
		})

		// Device A: Create game
		game := createGameHTTP(t, router, "e2e-sess", models.Game{
			ID:           "e2e-game",
			ScriptID:     "tb",
			CurrentDay:   1,
			CurrentPhase: models.Night,
			IsFirstNight: true,
			Slots:        []models.Slot{},
		Participants: []models.Participant{},
		PlayerState:  map[string]models.PlayerGameState{},
			NightHistory: []models.NightHistoryEntry{},
		})

		// Device A: Update game (advance to day 2)
		game.CurrentDay = 2
		game.CurrentPhase = models.Day
		game.IsFirstNight = false
		body, _ := json.Marshal(game)
		req := httptest.NewRequest("PUT", "/api/sessions/e2e-sess/games/e2e-game", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("update status = %d, want %d", w.Code, http.StatusOK)
		}

		// Device B: Poll version — should see v2
		req = httptest.NewRequest("GET", "/api/sessions/e2e-sess/games/e2e-game/version", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var info models.VersionInfo
		json.NewDecoder(w.Body).Decode(&info)
		if info.Version != 2 {
			t.Errorf("polled version = %d, want 2", info.Version)
		}

		// Device B: Fetch full game — should see Device A's update
		req = httptest.NewRequest("GET", "/api/sessions/e2e-sess/games/e2e-game", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var fetched models.Game
		json.NewDecoder(w.Body).Decode(&fetched)
		if fetched.CurrentDay != 2 {
			t.Errorf("CurrentDay = %d, want 2", fetched.CurrentDay)
		}
		if fetched.CurrentPhase != models.Day {
			t.Errorf("CurrentPhase = %q, want %q", fetched.CurrentPhase, models.Day)
		}

		// Device A also updated session
		session.Name = "Updated E2E"
		body, _ = json.Marshal(session)
		req = httptest.NewRequest("PUT", "/api/sessions/e2e-sess", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Expected-Version", "1")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Device B: Poll session version
		req = httptest.NewRequest("GET", "/api/sessions/e2e-sess/version", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		var sessInfo models.VersionInfo
		json.NewDecoder(w.Body).Decode(&sessInfo)
		if sessInfo.Version != 2 {
			t.Errorf("session polled version = %d, want 2", sessInfo.Version)
		}
	})
}
