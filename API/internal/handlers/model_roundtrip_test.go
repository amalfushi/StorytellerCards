package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/go-chi/chi/v5"

	"storyteller-cards-api/internal/models"
	"storyteller-cards-api/internal/sse"
	"storyteller-cards-api/internal/storage"
)

// setupRoundtripRouter creates a combined router with session and game routes
// for full HTTP roundtrip testing.
func setupRoundtripRouter(t *testing.T) *chi.Mux {
	t.Helper()
	dir := t.TempDir()
	store := storage.New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	sessions := NewSessions(store)
	games := NewGames(store, sse.NewHub())

	r := chi.NewRouter()
	r.Post("/api/sessions", sessions.Create)
	r.Get("/api/sessions/{id}", sessions.Get)
	r.Put("/api/sessions/{id}", sessions.Update)

	r.Post("/api/sessions/{sessionId}/games", games.Create)
	r.Get("/api/sessions/{sessionId}/games/{gameId}", games.Get)
	r.Put("/api/sessions/{sessionId}/games/{gameId}", games.Update)

	return r
}

// ──────────────────────────────────────────────
// Test 1: Session roundtrip — every field populated
// ──────────────────────────────────────────────

func TestSessionRoundtrip(t *testing.T) {
	r := setupRoundtripRouter(t)

	sent := models.Session{
		ID:              "roundtrip-sess",
		Name:            "Friday Night BotC",
		CreatedAt:       "2025-06-15T19:30:00Z",
		DefaultScriptID: "trouble-brewing",
		DefaultPlayers: []models.PlayerTemplate{
			{Seat: 1, PlayerName: "Alice"},
			{Seat: 2, PlayerName: "Bob"},
			{Seat: 3, PlayerName: "Charlie"},
		},
		GameIDs: []string{"game-1", "game-2", "game-3"},
		Version: 5,
	}

	// PUT creates via upsert; version becomes sent.Version+1 = 6
	body, _ := json.Marshal(sent)
	req := httptest.NewRequest("PUT", "/api/sessions/roundtrip-sess", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("PUT status = %d; body = %s", w.Code, w.Body.String())
	}

	// GET it back
	req = httptest.NewRequest("GET", "/api/sessions/roundtrip-sess", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET status = %d, want %d", w.Code, http.StatusOK)
	}

	var got models.Session
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// ── Field-by-field assertions ──
	assertEq(t, "session.id", got.ID, "roundtrip-sess")
	assertEq(t, "session.name", got.Name, "Friday Night BotC")
	assertEq(t, "session.createdAt", got.CreatedAt, "2025-06-15T19:30:00Z")
	assertEq(t, "session.defaultScriptId", got.DefaultScriptID, "trouble-brewing")
	assertEq(t, "session.version", got.Version, 6) // 5 + 1

	if got.UpdatedAt == "" {
		t.Error("session.updatedAt should be set by server")
	}

	// defaultPlayers
	if len(got.DefaultPlayers) != 3 {
		t.Fatalf("session.defaultPlayers length = %d, want 3", len(got.DefaultPlayers))
	}
	for i, want := range sent.DefaultPlayers {
		p := fmt.Sprintf("session.defaultPlayers[%d]", i)
		assertEq(t, p+".seat", got.DefaultPlayers[i].Seat, want.Seat)
		assertEq(t, p+".playerName", got.DefaultPlayers[i].PlayerName, want.PlayerName)
	}

	// gameIds
	assertStrSlice(t, "session.gameIds", got.GameIDs, sent.GameIDs)
}

// ──────────────────────────────────────────────
// Test 2: Game roundtrip — ALL fields populated
// ──────────────────────────────────────────────

func TestGameRoundtripFullPlayerSeat(t *testing.T) {
	r := setupRoundtripRouter(t)

	sent := models.Game{
		ID:           "roundtrip-game",
		SessionID:    "sess-rt",
		ScriptID:     "boozling",
		CurrentDay:   3,
		CurrentPhase: models.Night,
		IsFirstNight: false,
		Players: []models.PlayerSeat{
			{
				Seat:              1,
				PlayerName:        "Alice",
				CharacterID:       "washerwoman",
				Alive:             true,
				GhostVoteUsed:     false,
				VisibleAlignment:  models.Good,
				ActualAlignment:   models.Good,
				StartingAlignment: models.Good,
				ActiveReminders:   []string{"reminder-1", "reminder-2"},
				IsTraveller:       false,
				Tokens: []models.PlayerToken{
					{
						ID:                "token-1",
						Type:              "drunk",
						Label:             "Drunk",
						SourceCharacterID: "imp",
						Color:             "#d32f2f",
					},
					{
						ID:    "token-2",
						Type:  "poisoned",
						Label: "Poisoned",
					},
				},
				ApparentCharacterID: "drunk",
			},
			{
				Seat:              2,
				PlayerName:        "Bob",
				CharacterID:       "imp",
				Alive:             false,
				GhostVoteUsed:     true,
				VisibleAlignment:  models.Evil,
				ActualAlignment:   models.Evil,
				StartingAlignment: models.Evil,
				ActiveReminders:   []string{},
				IsTraveller:       true,
				Tokens:            []models.PlayerToken{},
			},
		},
		NightHistory: []models.NightHistoryEntry{
			{
				DayNumber:    1,
				IsFirstNight: true,
				CompletedAt:  "2025-06-15T20:00:00Z",
				SubActionStates: map[string][]bool{
					"washerwoman": {true, false, true},
					"imp":         {true, true},
				},
				Notes: map[string]string{
					"washerwoman": "Pointed at seat 3",
					"imp":         "Killed seat 5",
				},
				Selections: map[string]any{
					"washerwoman": "seat-3",
					"imp":         []any{"seat-5", "seat-6"},
				},
				TokenSnapshot: map[string][]models.PlayerToken{
					"washerwoman": {
						{ID: "snap-1", Type: "drunk", Label: "Drunk", SourceCharacterID: "imp", Color: "#d32f2f"},
					},
				},
			},
			{
				DayNumber:    2,
				IsFirstNight: false,
				CompletedAt:  "2025-06-15T21:00:00Z",
				SubActionStates: map[string][]bool{
					"imp": {true},
				},
				Notes: map[string]string{
					"imp": "Killed seat 1",
				},
				Selections: map[string]any{
					"imp": "seat-1",
				},
				TokenSnapshot: map[string][]models.PlayerToken{},
			},
		},
		ActiveFabled:       []string{"stormcatcher", "spiritofivory"},
		ActiveLoric:        []string{"archmage"},
		InPlayCharacterIds: []string{"washerwoman", "imp", "baron", "drunk"},
		DemonBluffs:        []string{"monk", "chef", "empath"},
		LunaticBluffs:      []string{"fortuneteller", "undertaker", "ravenkeeper"},
		PlayerBluffs: map[string][]string{
			"1": {"monk", "chef", "empath"},
			"5": {"fortuneteller", "undertaker"},
		},
		CustomPlayerMessages: map[string]string{
			"imp":   "You are the Imp. Kill wisely.",
			"drunk": "You think you are the Empath.",
		},
		Version: 0,
	}

	body, _ := json.Marshal(sent)
	req := httptest.NewRequest("POST", "/api/sessions/sess-rt/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST status = %d, want %d; body = %s", w.Code, http.StatusCreated, w.Body.String())
	}

	// GET it back
	req = httptest.NewRequest("GET", "/api/sessions/sess-rt/games/roundtrip-game", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET status = %d, want %d", w.Code, http.StatusOK)
	}

	var got models.Game
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// ── Basic fields ──
	assertEq(t, "game.id", got.ID, "roundtrip-game")
	assertEq(t, "game.sessionId", got.SessionID, "sess-rt")
	assertEq(t, "game.scriptId", got.ScriptID, "boozling")
	assertEq(t, "game.currentDay", got.CurrentDay, 3)
	assertEq(t, "game.currentPhase", string(got.CurrentPhase), "Night")
	assertEq(t, "game.isFirstNight", got.IsFirstNight, false)
	assertEq(t, "game.version", got.Version, 1) // Create sets version=1
	if got.UpdatedAt == "" {
		t.Error("game.updatedAt should be set by server")
	}

	// ── Players ──
	if len(got.Players) != 2 {
		t.Fatalf("game.players length = %d, want 2", len(got.Players))
	}

	// Player 0 — full fields
	p0 := got.Players[0]
	assertEq(t, "players[0].seat", p0.Seat, 1)
	assertEq(t, "players[0].playerName", p0.PlayerName, "Alice")
	assertEq(t, "players[0].characterId", p0.CharacterID, "washerwoman")
	assertEq(t, "players[0].alive", p0.Alive, true)
	assertEq(t, "players[0].ghostVoteUsed", p0.GhostVoteUsed, false)
	assertEq(t, "players[0].visibleAlignment", string(p0.VisibleAlignment), "Good")
	assertEq(t, "players[0].actualAlignment", string(p0.ActualAlignment), "Good")
	assertEq(t, "players[0].startingAlignment", string(p0.StartingAlignment), "Good")
	assertStrSlice(t, "players[0].activeReminders", p0.ActiveReminders, []string{"reminder-1", "reminder-2"})
	assertEq(t, "players[0].isTraveller", p0.IsTraveller, false)
	assertEq(t, "players[0].apparentCharacterId", p0.ApparentCharacterID, "drunk")

	// Player 0 tokens
	if len(p0.Tokens) != 2 {
		t.Fatalf("players[0].tokens length = %d, want 2", len(p0.Tokens))
	}
	assertEq(t, "players[0].tokens[0].id", p0.Tokens[0].ID, "token-1")
	assertEq(t, "players[0].tokens[0].type", p0.Tokens[0].Type, "drunk")
	assertEq(t, "players[0].tokens[0].label", p0.Tokens[0].Label, "Drunk")
	assertEq(t, "players[0].tokens[0].sourceCharacterId", p0.Tokens[0].SourceCharacterID, "imp")
	assertEq(t, "players[0].tokens[0].color", p0.Tokens[0].Color, "#d32f2f")
	assertEq(t, "players[0].tokens[1].id", p0.Tokens[1].ID, "token-2")
	assertEq(t, "players[0].tokens[1].type", p0.Tokens[1].Type, "poisoned")
	assertEq(t, "players[0].tokens[1].label", p0.Tokens[1].Label, "Poisoned")
	assertEq(t, "players[0].tokens[1].sourceCharacterId", p0.Tokens[1].SourceCharacterID, "")
	assertEq(t, "players[0].tokens[1].color", p0.Tokens[1].Color, "")

	// Player 1 — dead, ghost vote used, traveller, evil
	p1 := got.Players[1]
	assertEq(t, "players[1].seat", p1.Seat, 2)
	assertEq(t, "players[1].playerName", p1.PlayerName, "Bob")
	assertEq(t, "players[1].characterId", p1.CharacterID, "imp")
	assertEq(t, "players[1].alive", p1.Alive, false)
	assertEq(t, "players[1].ghostVoteUsed", p1.GhostVoteUsed, true)
	assertEq(t, "players[1].visibleAlignment", string(p1.VisibleAlignment), "Evil")
	assertEq(t, "players[1].actualAlignment", string(p1.ActualAlignment), "Evil")
	assertEq(t, "players[1].startingAlignment", string(p1.StartingAlignment), "Evil")
	assertEq(t, "players[1].isTraveller", p1.IsTraveller, true)
	assertEq(t, "players[1].apparentCharacterId", p1.ApparentCharacterID, "")

	// ── Night History ──
	if len(got.NightHistory) != 2 {
		t.Fatalf("game.nightHistory length = %d, want 2", len(got.NightHistory))
	}

	// Night history entry 0 — first night, full data
	nh0 := got.NightHistory[0]
	assertEq(t, "nightHistory[0].dayNumber", nh0.DayNumber, 1)
	assertEq(t, "nightHistory[0].isFirstNight", nh0.IsFirstNight, true)
	assertEq(t, "nightHistory[0].completedAt", nh0.CompletedAt, "2025-06-15T20:00:00Z")

	// subActionStates
	if len(nh0.SubActionStates) != 2 {
		t.Fatalf("nightHistory[0].subActionStates map length = %d, want 2", len(nh0.SubActionStates))
	}
	assertBoolSlice(t, "nightHistory[0].subActionStates['washerwoman']",
		nh0.SubActionStates["washerwoman"], []bool{true, false, true})
	assertBoolSlice(t, "nightHistory[0].subActionStates['imp']",
		nh0.SubActionStates["imp"], []bool{true, true})

	// notes
	assertEq(t, "nightHistory[0].notes['washerwoman']", nh0.Notes["washerwoman"], "Pointed at seat 3")
	assertEq(t, "nightHistory[0].notes['imp']", nh0.Notes["imp"], "Killed seat 5")

	// selections — string value
	if nh0.Selections == nil {
		t.Fatal("nightHistory[0].selections should not be nil")
	}
	washSel, ok := nh0.Selections["washerwoman"]
	if !ok {
		t.Fatal("nightHistory[0].selections['washerwoman'] missing")
	}
	assertEq(t, "nightHistory[0].selections['washerwoman']", fmt.Sprint(washSel), "seat-3")

	// selections — array value
	impSel, ok := nh0.Selections["imp"]
	if !ok {
		t.Fatal("nightHistory[0].selections['imp'] missing")
	}
	impSelArr, ok := impSel.([]any)
	if !ok {
		t.Fatalf("nightHistory[0].selections['imp'] type = %T, want []any", impSel)
	}
	if len(impSelArr) != 2 {
		t.Fatalf("nightHistory[0].selections['imp'] length = %d, want 2", len(impSelArr))
	}
	assertEq(t, "nightHistory[0].selections['imp'][0]", fmt.Sprint(impSelArr[0]), "seat-5")
	assertEq(t, "nightHistory[0].selections['imp'][1]", fmt.Sprint(impSelArr[1]), "seat-6")

	// tokenSnapshot
	if nh0.TokenSnapshot == nil {
		t.Fatal("nightHistory[0].tokenSnapshot should not be nil")
	}
	washSnap, ok := nh0.TokenSnapshot["washerwoman"]
	if !ok {
		t.Fatal("nightHistory[0].tokenSnapshot['washerwoman'] missing")
	}
	if len(washSnap) != 1 {
		t.Fatalf("nightHistory[0].tokenSnapshot['washerwoman'] length = %d, want 1", len(washSnap))
	}
	assertEq(t, "tokenSnapshot['washerwoman'][0].id", washSnap[0].ID, "snap-1")
	assertEq(t, "tokenSnapshot['washerwoman'][0].type", washSnap[0].Type, "drunk")
	assertEq(t, "tokenSnapshot['washerwoman'][0].label", washSnap[0].Label, "Drunk")
	assertEq(t, "tokenSnapshot['washerwoman'][0].sourceCharacterId", washSnap[0].SourceCharacterID, "imp")
	assertEq(t, "tokenSnapshot['washerwoman'][0].color", washSnap[0].Color, "#d32f2f")

	// Night history entry 1 — other night, string selection
	nh1 := got.NightHistory[1]
	assertEq(t, "nightHistory[1].dayNumber", nh1.DayNumber, 2)
	assertEq(t, "nightHistory[1].isFirstNight", nh1.IsFirstNight, false)
	assertEq(t, "nightHistory[1].completedAt", nh1.CompletedAt, "2025-06-15T21:00:00Z")
	assertBoolSlice(t, "nightHistory[1].subActionStates['imp']",
		nh1.SubActionStates["imp"], []bool{true})
	assertEq(t, "nightHistory[1].notes['imp']", nh1.Notes["imp"], "Killed seat 1")
	nh1ImpSel, ok := nh1.Selections["imp"]
	if !ok {
		t.Fatal("nightHistory[1].selections['imp'] missing")
	}
	assertEq(t, "nightHistory[1].selections['imp']", fmt.Sprint(nh1ImpSel), "seat-1")

	// ── Game-level optional arrays ──
	assertStrSlice(t, "game.activeFabled", got.ActiveFabled, []string{"stormcatcher", "spiritofivory"})
	assertStrSlice(t, "game.activeLoric", got.ActiveLoric, []string{"archmage"})
	assertStrSlice(t, "game.inPlayCharacterIds", got.InPlayCharacterIds,
		[]string{"washerwoman", "imp", "baron", "drunk"})
	assertStrSlice(t, "game.demonBluffs", got.DemonBluffs, []string{"monk", "chef", "empath"})
	assertStrSlice(t, "game.lunaticBluffs", got.LunaticBluffs,
		[]string{"fortuneteller", "undertaker", "ravenkeeper"})

	// playerBluffs
	if got.PlayerBluffs == nil {
		t.Fatal("game.playerBluffs should not be nil")
	}
	assertStrSlice(t, "game.playerBluffs['1']", got.PlayerBluffs["1"], []string{"monk", "chef", "empath"})
	assertStrSlice(t, "game.playerBluffs['5']", got.PlayerBluffs["5"], []string{"fortuneteller", "undertaker"})

	// customPlayerMessages
	if got.CustomPlayerMessages == nil {
		t.Fatal("game.customPlayerMessages should not be nil")
	}
	assertEq(t, "game.customPlayerMessages['imp']",
		got.CustomPlayerMessages["imp"], "You are the Imp. Kill wisely.")
	assertEq(t, "game.customPlayerMessages['drunk']",
		got.CustomPlayerMessages["drunk"], "You think you are the Empath.")
}

// ──────────────────────────────────────────────
// Test 3: Game roundtrip — empty optional fields
// ──────────────────────────────────────────────

func TestGameRoundtripEmptyOptionals(t *testing.T) {
	r := setupRoundtripRouter(t)

	sent := models.Game{
		ID:           "empty-opts-game",
		ScriptID:     "trouble-brewing",
		CurrentDay:   1,
		CurrentPhase: models.Day,
		IsFirstNight: true,
		Players: []models.PlayerSeat{
			{
				Seat:              1,
				PlayerName:        "Alice",
				CharacterID:       "washerwoman",
				Alive:             true,
				VisibleAlignment:  models.Good,
				ActualAlignment:   models.Good,
				StartingAlignment: models.Good,
			},
		},
		NightHistory: []models.NightHistoryEntry{},
	}

	body, _ := json.Marshal(sent)
	req := httptest.NewRequest("POST", "/api/sessions/sess-empty/games", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST status = %d, want %d; body = %s", w.Code, http.StatusCreated, w.Body.String())
	}

	// GET it back
	req = httptest.NewRequest("GET", "/api/sessions/sess-empty/games/empty-opts-game", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET status = %d, want %d", w.Code, http.StatusOK)
	}

	var got models.Game
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// Required fields survive
	assertEq(t, "game.id", got.ID, "empty-opts-game")
	assertEq(t, "game.scriptId", got.ScriptID, "trouble-brewing")
	assertEq(t, "game.currentDay", got.CurrentDay, 1)
	assertEq(t, "game.currentPhase", string(got.CurrentPhase), "Day")
	assertEq(t, "game.isFirstNight", got.IsFirstNight, true)

	// Optional slice fields should be nil (omitted from JSON)
	if got.ActiveFabled != nil {
		t.Errorf("game.activeFabled = %v, want nil", got.ActiveFabled)
	}
	if got.ActiveLoric != nil {
		t.Errorf("game.activeLoric = %v, want nil", got.ActiveLoric)
	}
	if got.InPlayCharacterIds != nil {
		t.Errorf("game.inPlayCharacterIds = %v, want nil", got.InPlayCharacterIds)
	}
	if got.DemonBluffs != nil {
		t.Errorf("game.demonBluffs = %v, want nil", got.DemonBluffs)
	}
	if got.LunaticBluffs != nil {
		t.Errorf("game.lunaticBluffs = %v, want nil", got.LunaticBluffs)
	}
	if got.PlayerBluffs != nil {
		t.Errorf("game.playerBluffs = %v, want nil", got.PlayerBluffs)
	}
	if got.CustomPlayerMessages != nil {
		t.Errorf("game.customPlayerMessages = %v, want nil", got.CustomPlayerMessages)
	}

	// Player optional fields should also be absent
	p := got.Players[0]
	if p.Tokens != nil {
		t.Errorf("players[0].tokens = %v, want nil", p.Tokens)
	}
	if p.ApparentCharacterID != "" {
		t.Errorf("players[0].apparentCharacterId = %q, want empty", p.ApparentCharacterID)
	}
}

// ──────────────────────────────────────────────
// Test 4: Raw JSON key verification — ensures JSON
// tag names match what the TS client expects
// ──────────────────────────────────────────────

func TestGameRoundtripJSONKeys(t *testing.T) {
	r := setupRoundtripRouter(t)

	// Send a game with all fields via POST
	rawJSON := `{
		"id": "json-keys-game",
		"sessionId": "sess-keys",
		"scriptId": "boozling",
		"currentDay": 2,
		"currentPhase": "Night",
		"isFirstNight": false,
		"players": [{
			"seat": 1,
			"playerName": "Alice",
			"characterId": "washerwoman",
			"alive": true,
			"ghostVoteUsed": false,
			"visibleAlignment": "Good",
			"actualAlignment": "Good",
			"startingAlignment": "Good",
			"activeReminders": ["r1"],
			"isTraveller": false,
			"tokens": [{"id":"t1","type":"drunk","label":"Drunk","sourceCharacterId":"imp","color":"#f00"}],
			"apparentCharacterId": "drunk"
		}],
		"nightHistory": [{
			"dayNumber": 1,
			"isFirstNight": true,
			"completedAt": "2025-01-01T00:00:00Z",
			"subActionStates": {"washerwoman": [true]},
			"notes": {"washerwoman": "test"},
			"selections": {"washerwoman": "seat-1", "imp": ["a","b"]},
			"tokenSnapshot": {"washerwoman": [{"id":"s1","type":"drunk","label":"D","sourceCharacterId":"imp","color":"#f00"}]}
		}],
		"activeFabled": ["stormcatcher"],
		"activeLoric": ["archmage"],
		"inPlayCharacterIds": ["washerwoman"],
		"demonBluffs": ["monk"],
		"lunaticBluffs": ["chef"],
		"playerBluffs": {"1": ["monk"]},
		"customPlayerMessages": {"imp": "hello"},
		"version": 0
	}`

	req := httptest.NewRequest("POST", "/api/sessions/sess-keys/games",
		bytes.NewReader([]byte(rawJSON)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST status = %d; body = %s", w.Code, w.Body.String())
	}

	// GET and decode into raw map to check key names
	req = httptest.NewRequest("GET", "/api/sessions/sess-keys/games/json-keys-game", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var raw map[string]any
	if err := json.NewDecoder(w.Body).Decode(&raw); err != nil {
		t.Fatalf("decode raw: %v", err)
	}

	// Top-level game keys the TS client expects
	gameKeys := []string{
		"id", "sessionId", "scriptId", "currentDay", "currentPhase",
		"isFirstNight", "players", "nightHistory",
		"activeFabled", "activeLoric", "inPlayCharacterIds",
		"demonBluffs", "lunaticBluffs", "playerBluffs",
		"customPlayerMessages", "version", "updatedAt",
	}
	for _, k := range gameKeys {
		if _, ok := raw[k]; !ok {
			t.Errorf("response JSON missing top-level key %q", k)
		}
	}

	// Player keys
	players, ok := raw["players"].([]any)
	if !ok || len(players) == 0 {
		t.Fatal("players not found or empty")
	}
	player, ok := players[0].(map[string]any)
	if !ok {
		t.Fatal("players[0] not a JSON object")
	}
	playerKeys := []string{
		"seat", "playerName", "characterId", "alive", "ghostVoteUsed",
		"visibleAlignment", "actualAlignment", "startingAlignment",
		"activeReminders", "isTraveller", "tokens", "apparentCharacterId",
	}
	for _, k := range playerKeys {
		if _, ok := player[k]; !ok {
			t.Errorf("response JSON players[0] missing key %q", k)
		}
	}

	// Token keys
	tokens, ok := player["tokens"].([]any)
	if !ok || len(tokens) == 0 {
		t.Fatal("tokens not found or empty")
	}
	token, ok := tokens[0].(map[string]any)
	if !ok {
		t.Fatal("tokens[0] not a JSON object")
	}
	tokenKeys := []string{"id", "type", "label", "sourceCharacterId", "color"}
	for _, k := range tokenKeys {
		if _, ok := token[k]; !ok {
			t.Errorf("response JSON tokens[0] missing key %q", k)
		}
	}

	// Night history keys
	nightHist, ok := raw["nightHistory"].([]any)
	if !ok || len(nightHist) == 0 {
		t.Fatal("nightHistory not found or empty")
	}
	nh, ok := nightHist[0].(map[string]any)
	if !ok {
		t.Fatal("nightHistory[0] not a JSON object")
	}
	nhKeys := []string{
		"dayNumber", "isFirstNight", "completedAt",
		"subActionStates", "notes", "selections", "tokenSnapshot",
	}
	for _, k := range nhKeys {
		if _, ok := nh[k]; !ok {
			t.Errorf("response JSON nightHistory[0] missing key %q", k)
		}
	}

	// Token snapshot nested token keys
	snap, ok := nh["tokenSnapshot"].(map[string]any)
	if !ok {
		t.Fatal("tokenSnapshot not a JSON object")
	}
	washSnap, ok := snap["washerwoman"].([]any)
	if !ok || len(washSnap) == 0 {
		t.Fatal("tokenSnapshot['washerwoman'] not found or empty")
	}
	snapToken, ok := washSnap[0].(map[string]any)
	if !ok {
		t.Fatal("tokenSnapshot token not a JSON object")
	}
	for _, k := range tokenKeys {
		if _, ok := snapToken[k]; !ok {
			t.Errorf("response JSON tokenSnapshot token missing key %q", k)
		}
	}
}

// ──────────────────────────────────────────────
// Helpers — short names to avoid conflict with existing test helpers
// ──────────────────────────────────────────────

func assertEq[T comparable](t *testing.T, field string, got, want T) {
	t.Helper()
	if got != want {
		t.Errorf("%s = %v, want %v", field, got, want)
	}
}

func assertStrSlice(t *testing.T, field string, got, want []string) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Errorf("%s = %v, want %v", field, got, want)
	}
}

func assertBoolSlice(t *testing.T, field string, got, want []bool) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Errorf("%s = %v, want %v", field, got, want)
	}
}
