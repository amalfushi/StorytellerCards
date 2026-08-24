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
// Session roundtrip — every field populated (new M41 shape)
// ──────────────────────────────────────────────

func TestSessionRoundtrip(t *testing.T) {
	r := setupRoundtripRouter(t)

	sent := models.Session{
		ID:              "roundtrip-sess",
		Name:            "Friday Night BotC",
		CreatedAt:       "2025-06-15T19:30:00Z",
		DefaultScriptID: "trouble-brewing",
		Players: []models.Player{
			{ID: "p-alice", Name: "Alice"},
			{ID: "p-bob", Name: "Bob"},
			{ID: "p-charlie", Name: "Charlie"},
		},
		DefaultParticipantIDs: []string{"p-alice", "p-bob"},
		Template: models.SeatingTemplate{
			Slots: []models.Slot{
				{Kind: models.SlotSeat, ID: "s-1", PlayerID: "p-alice"},
				{Kind: models.SlotSpacer, ID: "s-2"},
				{Kind: models.SlotSeat, ID: "s-3", PlayerID: "p-bob"},
				{Kind: models.SlotStoryteller, ID: "s-4"},
				{Kind: models.SlotSeat, ID: "s-5", PlayerID: "p-charlie"},
			},
		},
		PropagationDefault: models.PropagationPreference{ToTemplate: true, ToOtherGames: false},
		GameIDs:            []string{"game-1", "game-2", "game-3"},
		Version:            5,
	}

	body, _ := json.Marshal(sent)
	req := httptest.NewRequest("PUT", "/api/sessions/roundtrip-sess", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("PUT status = %d; body = %s", w.Code, w.Body.String())
	}

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

	assertEq(t, "session.id", got.ID, "roundtrip-sess")
	assertEq(t, "session.name", got.Name, "Friday Night BotC")
	assertEq(t, "session.createdAt", got.CreatedAt, "2025-06-15T19:30:00Z")
	assertEq(t, "session.defaultScriptId", got.DefaultScriptID, "trouble-brewing")
	assertStrSlice(t, "session.defaultParticipantIds", got.DefaultParticipantIDs, sent.DefaultParticipantIDs)
	assertEq(t, "session.version", got.Version, 6)

	if got.UpdatedAt == "" {
		t.Error("session.updatedAt should be set by server")
	}

	if len(got.Players) != 3 {
		t.Fatalf("session.players length = %d, want 3", len(got.Players))
	}
	for i, want := range sent.Players {
		p := fmt.Sprintf("session.players[%d]", i)
		assertEq(t, p+".id", got.Players[i].ID, want.ID)
		assertEq(t, p+".name", got.Players[i].Name, want.Name)
	}

	if len(got.Template.Slots) != 5 {
		t.Fatalf("session.template.slots length = %d, want 5", len(got.Template.Slots))
	}
	for i, want := range sent.Template.Slots {
		p := fmt.Sprintf("session.template.slots[%d]", i)
		assertEq(t, p+".kind", string(got.Template.Slots[i].Kind), string(want.Kind))
		assertEq(t, p+".id", got.Template.Slots[i].ID, want.ID)
		assertEq(t, p+".playerId", got.Template.Slots[i].PlayerID, want.PlayerID)
	}

	assertEq(t, "session.propagationDefault.toTemplate", got.PropagationDefault.ToTemplate, true)
	assertEq(t, "session.propagationDefault.toOtherGames", got.PropagationDefault.ToOtherGames, false)

	assertStrSlice(t, "session.gameIds", got.GameIDs, sent.GameIDs)
}

// ──────────────────────────────────────────────
// Game roundtrip — ALL fields populated (new M41 shape)
// ──────────────────────────────────────────────

func TestGameRoundtripFull(t *testing.T) {
	r := setupRoundtripRouter(t)

	override := 8
	sent := models.Game{
		ID:           "roundtrip-game",
		SessionID:    "sess-rt",
		ScriptID:     "boozling",
		CurrentDay:   3,
		CurrentPhase: models.Night,
		IsFirstNight: false,
		Slots: []models.Slot{
			{Kind: models.SlotSeat, ID: "g-s1", PlayerID: "p-alice"},
			{Kind: models.SlotSeat, ID: "g-s2", PlayerID: "p-bob"},
			{Kind: models.SlotSpacer, ID: "g-s3"},
		},
		Participants: []models.Participant{
			{PlayerID: "p-alice", IsTraveller: false},
			{PlayerID: "p-bob", IsTraveller: true},
		},
		PlayerState: map[string]models.PlayerGameState{
			"p-alice": {
				CharacterID:       "washerwoman",
				Alive:             true,
				GhostVoteUsed:     false,
				VisibleAlignment:  models.Good,
				ActualAlignment:   models.Good,
				StartingAlignment: models.Good,
				ActiveReminders:   []string{"reminder-1", "reminder-2"},
				Tokens: []models.PlayerToken{
					{ID: "token-1", Type: "drunk", Label: "Drunk", SourceCharacterID: "imp", Color: "#d32f2f"},
					{ID: "token-2", Type: "poisoned", Label: "Poisoned"},
				},
				ApparentCharacterID: "drunk",
			},
			"p-bob": {
				CharacterID:       "imp",
				Alive:             false,
				GhostVoteUsed:     true,
				VisibleAlignment:  models.Evil,
				ActualAlignment:   models.Evil,
				StartingAlignment: models.Evil,
				ActiveReminders:   []string{},
				Tokens:            []models.PlayerToken{},
			},
		},
		PlayerCountOverride: &override,
		SeatingConfirmed:    true,
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
					"washerwoman": "Pointed at p-charlie",
					"imp":         "Killed p-bob",
				},
				Selections: map[string]any{
					"washerwoman": "p-charlie",
					"imp":         []any{"p-bob", "p-alice"},
				},
				TokenSnapshot: map[string][]models.PlayerToken{
					"washerwoman": {
						{ID: "snap-1", Type: "drunk", Label: "Drunk", SourceCharacterID: "imp", Color: "#d32f2f"},
					},
				},
			},
		},
		ActiveFabled:       []string{"stormcatcher", "spiritofivory"},
		ActiveLoric:        []string{"archmage"},
		InPlayCharacterIds: []string{"washerwoman", "imp", "baron", "drunk"},
		DemonBluffs:        []string{"monk", "chef", "empath"},
		LunaticBluffs:      []string{"fortuneteller", "undertaker", "ravenkeeper"},
		PlayerBluffs: map[string][]string{
			"p-alice": {"monk", "chef", "empath"},
			"p-bob":   {"fortuneteller", "undertaker"},
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

	assertEq(t, "game.id", got.ID, "roundtrip-game")
	assertEq(t, "game.sessionId", got.SessionID, "sess-rt")
	assertEq(t, "game.scriptId", got.ScriptID, "boozling")
	assertEq(t, "game.currentDay", got.CurrentDay, 3)
	assertEq(t, "game.currentPhase", string(got.CurrentPhase), "Night")
	assertEq(t, "game.isFirstNight", got.IsFirstNight, false)
	assertEq(t, "game.seatingConfirmed", got.SeatingConfirmed, true)
	assertEq(t, "game.version", got.Version, 1)
	if got.UpdatedAt == "" {
		t.Error("game.updatedAt should be set by server")
	}

	// Slots
	if len(got.Slots) != 3 {
		t.Fatalf("game.slots length = %d, want 3", len(got.Slots))
	}
	assertEq(t, "slots[0].kind", string(got.Slots[0].Kind), "seat")
	assertEq(t, "slots[0].playerId", got.Slots[0].PlayerID, "p-alice")
	assertEq(t, "slots[2].kind", string(got.Slots[2].Kind), "spacer")
	assertEq(t, "slots[2].playerId", got.Slots[2].PlayerID, "")

	// Participants
	if len(got.Participants) != 2 {
		t.Fatalf("game.participants length = %d, want 2", len(got.Participants))
	}
	assertEq(t, "participants[0].playerId", got.Participants[0].PlayerID, "p-alice")
	assertEq(t, "participants[0].isTraveller", got.Participants[0].IsTraveller, false)
	assertEq(t, "participants[1].playerId", got.Participants[1].PlayerID, "p-bob")
	assertEq(t, "participants[1].isTraveller", got.Participants[1].IsTraveller, true)

	// PlayerState
	if len(got.PlayerState) != 2 {
		t.Fatalf("game.playerState length = %d, want 2", len(got.PlayerState))
	}
	psA := got.PlayerState["p-alice"]
	assertEq(t, "playerState[p-alice].characterId", psA.CharacterID, "washerwoman")
	assertEq(t, "playerState[p-alice].alive", psA.Alive, true)
	assertEq(t, "playerState[p-alice].ghostVoteUsed", psA.GhostVoteUsed, false)
	assertEq(t, "playerState[p-alice].visibleAlignment", string(psA.VisibleAlignment), "Good")
	assertStrSlice(t, "playerState[p-alice].activeReminders", psA.ActiveReminders, []string{"reminder-1", "reminder-2"})
	assertEq(t, "playerState[p-alice].apparentCharacterId", psA.ApparentCharacterID, "drunk")
	if len(psA.Tokens) != 2 {
		t.Fatalf("playerState[p-alice].tokens length = %d, want 2", len(psA.Tokens))
	}
	assertEq(t, "playerState[p-alice].tokens[0].id", psA.Tokens[0].ID, "token-1")
	assertEq(t, "playerState[p-alice].tokens[0].sourceCharacterId", psA.Tokens[0].SourceCharacterID, "imp")

	psB := got.PlayerState["p-bob"]
	assertEq(t, "playerState[p-bob].alive", psB.Alive, false)
	assertEq(t, "playerState[p-bob].ghostVoteUsed", psB.GhostVoteUsed, true)

	// PlayerCountOverride
	if got.PlayerCountOverride == nil {
		t.Fatal("game.playerCountOverride should not be nil")
	}
	assertEq(t, "game.playerCountOverride", *got.PlayerCountOverride, 8)

	// Night History
	if len(got.NightHistory) != 1 {
		t.Fatalf("game.nightHistory length = %d, want 1", len(got.NightHistory))
	}
	nh0 := got.NightHistory[0]
	assertEq(t, "nightHistory[0].dayNumber", nh0.DayNumber, 1)
	assertEq(t, "nightHistory[0].isFirstNight", nh0.IsFirstNight, true)
	assertBoolSlice(t, "nightHistory[0].subActionStates['washerwoman']",
		nh0.SubActionStates["washerwoman"], []bool{true, false, true})
	assertEq(t, "nightHistory[0].notes['imp']", nh0.Notes["imp"], "Killed p-bob")

	// Game-level optional arrays
	assertStrSlice(t, "game.activeFabled", got.ActiveFabled, []string{"stormcatcher", "spiritofivory"})
	assertStrSlice(t, "game.demonBluffs", got.DemonBluffs, []string{"monk", "chef", "empath"})
	assertStrSlice(t, "game.playerBluffs['p-alice']", got.PlayerBluffs["p-alice"], []string{"monk", "chef", "empath"})
	assertEq(t, "game.customPlayerMessages['imp']", got.CustomPlayerMessages["imp"], "You are the Imp. Kill wisely.")
}

// ──────────────────────────────────────────────
// Game roundtrip — empty optional fields
// ──────────────────────────────────────────────

func TestGameRoundtripEmptyOptionals(t *testing.T) {
	r := setupRoundtripRouter(t)

	sent := models.Game{
		ID:           "empty-opts-game",
		ScriptID:     "trouble-brewing",
		CurrentDay:   1,
		CurrentPhase: models.Day,
		IsFirstNight: true,
		Slots: []models.Slot{
			{Kind: models.SlotSeat, ID: "es-1", PlayerID: "p-alice"},
		},
		Participants: []models.Participant{
			{PlayerID: "p-alice", IsTraveller: false},
		},
		PlayerState: map[string]models.PlayerGameState{
			"p-alice": {
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

	assertEq(t, "game.id", got.ID, "empty-opts-game")
	assertEq(t, "game.scriptId", got.ScriptID, "trouble-brewing")

	if got.ActiveFabled != nil {
		t.Errorf("game.activeFabled = %v, want nil", got.ActiveFabled)
	}
	if got.PlayerBluffs != nil {
		t.Errorf("game.playerBluffs = %v, want nil", got.PlayerBluffs)
	}
	if got.PlayerCountOverride != nil {
		t.Errorf("game.playerCountOverride = %v, want nil", got.PlayerCountOverride)
	}

	psA := got.PlayerState["p-alice"]
	if psA.Tokens != nil {
		t.Errorf("playerState[p-alice].tokens = %v, want nil", psA.Tokens)
	}
	if psA.ApparentCharacterID != "" {
		t.Errorf("playerState[p-alice].apparentCharacterId = %q, want empty", psA.ApparentCharacterID)
	}
}

// ──────────────────────────────────────────────
// Raw JSON key verification — ensures JSON tag
// names match what the TS client expects
// ──────────────────────────────────────────────

func TestGameRoundtripJSONKeys(t *testing.T) {
	r := setupRoundtripRouter(t)

	rawJSON := `{
		"id": "json-keys-game",
		"sessionId": "sess-keys",
		"scriptId": "boozling",
		"currentDay": 2,
		"currentPhase": "Night",
		"isFirstNight": false,
		"slots": [
			{"kind": "seat", "id": "k-s1", "playerId": "p-alice"},
			{"kind": "spacer", "id": "k-s2"}
		],
		"participants": [
			{"playerId": "p-alice", "isTraveller": false}
		],
		"playerState": {
			"p-alice": {
				"characterId": "washerwoman",
				"alive": true,
				"ghostVoteUsed": false,
				"visibleAlignment": "Good",
				"actualAlignment": "Good",
				"startingAlignment": "Good",
				"activeReminders": ["r1"],
				"tokens": [{"id":"t1","type":"drunk","label":"Drunk","sourceCharacterId":"imp","color":"#f00"}],
				"apparentCharacterId": "drunk"
			}
		},
		"playerCountOverride": 7,
		"nightHistory": [{
			"dayNumber": 1,
			"isFirstNight": true,
			"completedAt": "2025-01-01T00:00:00Z",
			"subActionStates": {"washerwoman": [true]},
			"notes": {"washerwoman": "test"},
			"selections": {"washerwoman": "p-alice"},
			"tokenSnapshot": {"washerwoman": [{"id":"s1","type":"drunk","label":"D","sourceCharacterId":"imp","color":"#f00"}]}
		}],
		"activeFabled": ["stormcatcher"],
		"activeLoric": ["archmage"],
		"inPlayCharacterIds": ["washerwoman"],
		"demonBluffs": ["monk"],
		"lunaticBluffs": ["chef"],
		"playerBluffs": {"p-alice": ["monk"]},
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

	req = httptest.NewRequest("GET", "/api/sessions/sess-keys/games/json-keys-game", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var raw map[string]any
	if err := json.NewDecoder(w.Body).Decode(&raw); err != nil {
		t.Fatalf("decode raw: %v", err)
	}

	gameKeys := []string{
		"id", "sessionId", "scriptId", "currentDay", "currentPhase",
		"isFirstNight", "slots", "participants", "playerState",
		"playerCountOverride", "seatingConfirmed", "nightHistory",
		"activeFabled", "activeLoric", "inPlayCharacterIds",
		"demonBluffs", "lunaticBluffs", "playerBluffs",
		"customPlayerMessages", "version", "updatedAt",
	}
	for _, k := range gameKeys {
		if _, ok := raw[k]; !ok {
			t.Errorf("response JSON missing top-level key %q", k)
		}
	}

	// Slot keys
	slots, ok := raw["slots"].([]any)
	if !ok || len(slots) == 0 {
		t.Fatal("slots not found or empty")
	}
	slot0, ok := slots[0].(map[string]any)
	if !ok {
		t.Fatal("slots[0] not a JSON object")
	}
	for _, k := range []string{"kind", "id", "playerId"} {
		if _, ok := slot0[k]; !ok {
			t.Errorf("response JSON slots[0] missing key %q", k)
		}
	}

	// Participant keys
	parts, ok := raw["participants"].([]any)
	if !ok || len(parts) == 0 {
		t.Fatal("participants not found or empty")
	}
	part0, ok := parts[0].(map[string]any)
	if !ok {
		t.Fatal("participants[0] not a JSON object")
	}
	for _, k := range []string{"playerId", "isTraveller"} {
		if _, ok := part0[k]; !ok {
			t.Errorf("response JSON participants[0] missing key %q", k)
		}
	}

	// PlayerState keys
	psMap, ok := raw["playerState"].(map[string]any)
	if !ok {
		t.Fatal("playerState not a JSON object")
	}
	psAlice, ok := psMap["p-alice"].(map[string]any)
	if !ok {
		t.Fatal("playerState['p-alice'] not a JSON object")
	}
	psKeys := []string{
		"characterId", "alive", "ghostVoteUsed",
		"visibleAlignment", "actualAlignment", "startingAlignment",
		"activeReminders", "tokens", "apparentCharacterId",
	}
	for _, k := range psKeys {
		if _, ok := psAlice[k]; !ok {
			t.Errorf("response JSON playerState['p-alice'] missing key %q", k)
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
