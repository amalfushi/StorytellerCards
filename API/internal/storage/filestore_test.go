package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"storyteller-cards-api/internal/models"
)

func TestSaveAndGetSession(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	session := models.Session{
		ID:              "sess-1",
		Name:            "Friday Night",
		CreatedAt:       "2025-01-01T00:00:00Z",
		DefaultScriptID: "boozling",
		Players:         []models.Player{{ID: "p-alice", Name: "Alice"}},
		Template: models.SeatingTemplate{
			Slots: []models.Slot{{Kind: models.SlotSeat, ID: "s-1", PlayerID: "p-alice"}},
		},
		PropagationDefault: models.PropagationPreference{ToTemplate: true, ToOtherGames: true},
		GameIDs:            []string{},
	}

	t.Run("save then get round-trip", func(t *testing.T) {
		if err := store.SaveSession(session); err != nil {
			t.Fatalf("SaveSession: %v", err)
		}

		got, err := store.GetSession("sess-1")
		if err != nil {
			t.Fatalf("GetSession: %v", err)
		}

		if got.ID != session.ID {
			t.Errorf("ID = %q, want %q", got.ID, session.ID)
		}
		if got.Name != session.Name {
			t.Errorf("Name = %q, want %q", got.Name, session.Name)
		}
		if len(got.Players) != 1 || got.Players[0].Name != "Alice" {
			t.Errorf("Players mismatch: %+v", got.Players)
		}
		if len(got.Template.Slots) != 1 || got.Template.Slots[0].PlayerID != "p-alice" {
			t.Errorf("Template.Slots mismatch: %+v", got.Template.Slots)
		}
	})
}

func TestListSessions(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	t.Run("empty list", func(t *testing.T) {
		sessions, err := store.ListSessions()
		if err != nil {
			t.Fatalf("ListSessions: %v", err)
		}
		if len(sessions) != 0 {
			t.Errorf("expected 0 sessions, got %d", len(sessions))
		}
	})

	t.Run("with data", func(t *testing.T) {
		s1 := models.Session{ID: "s1", Name: "Session 1", CreatedAt: "2025-01-01T00:00:00Z"}
		s2 := models.Session{ID: "s2", Name: "Session 2", CreatedAt: "2025-01-02T00:00:00Z"}

		if err := store.SaveSession(s1); err != nil {
			t.Fatalf("SaveSession s1: %v", err)
		}
		if err := store.SaveSession(s2); err != nil {
			t.Fatalf("SaveSession s2: %v", err)
		}

		sessions, err := store.ListSessions()
		if err != nil {
			t.Fatalf("ListSessions: %v", err)
		}
		if len(sessions) != 2 {
			t.Errorf("expected 2 sessions, got %d", len(sessions))
		}
	})
}

func TestDeleteSession(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	session := models.Session{ID: "del-1", Name: "To Delete", CreatedAt: "2025-01-01T00:00:00Z"}
	if err := store.SaveSession(session); err != nil {
		t.Fatalf("SaveSession: %v", err)
	}

	// Verify it exists
	_, err := store.GetSession("del-1")
	if err != nil {
		t.Fatalf("GetSession before delete: %v", err)
	}

	// Delete
	if err := store.DeleteSession("del-1"); err != nil {
		t.Fatalf("DeleteSession: %v", err)
	}

	// Verify it's gone
	_, err = store.GetSession("del-1")
	if err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func TestDeleteGame(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	game := models.Game{
		ID:           "game-del",
		SessionID:    "sess-1",
		ScriptID:     "boozling",
		CurrentDay:   1,
		CurrentPhase: models.Night,
		IsFirstNight: true,
		Slots:        []models.Slot{},
		Participants: []models.Participant{},
		PlayerState:  map[string]models.PlayerGameState{},
		NightHistory: []models.NightHistoryEntry{},
	}
	if err := store.SaveGame(game); err != nil {
		t.Fatalf("SaveGame: %v", err)
	}

	// Verify it exists
	_, err := store.GetGame("sess-1", "game-del")
	if err != nil {
		t.Fatalf("GetGame before delete: %v", err)
	}

	// Delete
	if err := store.DeleteGame("sess-1", "game-del"); err != nil {
		t.Fatalf("DeleteGame: %v", err)
	}

	// Verify it's gone
	_, err = store.GetGame("sess-1", "game-del")
	if err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func TestDeleteGameNonexistent(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	// Deleting a nonexistent game should not error
	if err := store.DeleteGame("sess-1", "nonexistent"); err != nil {
		t.Errorf("DeleteGame nonexistent: %v", err)
	}
}

func TestSaveAndGetGame(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	game := models.Game{
		ID:           "game-1",
		SessionID:    "sess-1",
		ScriptID:     "boozling",
		CurrentDay:   1,
		CurrentPhase: models.Night,
		IsFirstNight: true,
		Slots: []models.Slot{
			{Kind: models.SlotSeat, ID: "s-1", PlayerID: "p-alice"},
		},
		Participants: []models.Participant{
			{PlayerID: "p-alice", IsTraveller: false},
		},
		PlayerState: map[string]models.PlayerGameState{
			"p-alice": {
				CharacterID:      "noble",
				Alive:            true,
				VisibleAlignment: models.Good,
				ActualAlignment:  models.Good,
				ActiveReminders:  []string{},
			},
		},
		NightHistory: []models.NightHistoryEntry{},
	}

	t.Run("save then get round-trip", func(t *testing.T) {
		if err := store.SaveGame(game); err != nil {
			t.Fatalf("SaveGame: %v", err)
		}

		got, err := store.GetGame("sess-1", "game-1")
		if err != nil {
			t.Fatalf("GetGame: %v", err)
		}

		if got.ID != game.ID {
			t.Errorf("ID = %q, want %q", got.ID, game.ID)
		}
		if got.ScriptID != game.ScriptID {
			t.Errorf("ScriptID = %q, want %q", got.ScriptID, game.ScriptID)
		}
		if len(got.Participants) != 1 || got.Participants[0].PlayerID != "p-alice" {
			t.Errorf("Participants mismatch: %+v", got.Participants)
		}
		if got.PlayerState["p-alice"].CharacterID != "noble" {
			t.Errorf("PlayerState mismatch: %+v", got.PlayerState)
		}
	})
}

func TestSeedScripts(t *testing.T) {
	dataDir := t.TempDir()
	seedDir := t.TempDir()
	store := New(dataDir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	productionDir := filepath.Join(seedDir, "scripts", productionScriptsDir)
	if err := os.MkdirAll(productionDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(productionDir, "bundled.json"), []byte(`{"id":"bundled"}`), 0644); err != nil {
		t.Fatal(err)
	}
	existingPath := filepath.Join(dataDir, "scripts", productionScriptsDir, "existing.json")
	if err := os.WriteFile(existingPath, []byte(`{"id":"existing","name":"User version"}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(productionDir, "existing.json"), []byte(`{"id":"existing","name":"Bundled version"}`), 0644); err != nil {
		t.Fatal(err)
	}

	if err := store.SeedScripts(seedDir); err != nil {
		t.Fatalf("SeedScripts: %v", err)
	}

	bundled, err := os.ReadFile(filepath.Join(dataDir, "scripts", productionScriptsDir, "bundled.json"))
	if err != nil {
		t.Fatal(err)
	}
	if string(bundled) != `{"id":"bundled"}` {
		t.Fatalf("bundled script = %q", bundled)
	}
	existing, err := os.ReadFile(existingPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(existing) != `{"id":"existing","name":"User version"}` {
		t.Fatalf("existing script was overwritten: %q", existing)
	}
}

func TestSaveAndGetScript(t *testing.T) {
	dir := t.TempDir()
	store := New(dir)
	if err := store.EnsureDirectories(); err != nil {
		t.Fatalf("EnsureDirectories: %v", err)
	}

	script := models.Script{
		ID:           "boozling",
		Name:         "Boozling",
		Author:       "Lau",
		CharacterIDs: []string{"noble", "pixie", "chef"},
	}

	t.Run("save then get round-trip", func(t *testing.T) {
		if err := store.SaveScript(script); err != nil {
			t.Fatalf("SaveScript: %v", err)
		}

		got, err := store.GetScript("boozling")
		if err != nil {
			t.Fatalf("GetScript: %v", err)
		}

		if got.ID != script.ID {
			t.Errorf("ID = %q, want %q", got.ID, script.ID)
		}
		if got.Name != script.Name {
			t.Errorf("Name = %q, want %q", got.Name, script.Name)
		}
		if len(got.CharacterIDs) != 3 {
			t.Errorf("expected 3 character IDs, got %d", len(got.CharacterIDs))
		}
	})

	t.Run("list scripts", func(t *testing.T) {
		scripts, err := store.ListScripts()
		if err != nil {
			t.Fatalf("ListScripts: %v", err)
		}
		if len(scripts) != 1 {
			t.Errorf("expected 1 script, got %d", len(scripts))
		}
	})

	t.Run("loads scripts from the test category", func(t *testing.T) {
		testScript := models.Script{
			ID:           "test-only",
			Name:         "Test Only",
			Author:       "Integration Test",
			CharacterIDs: []string{"chef", "imp"},
		}
		data, err := json.Marshal(testScript)
		if err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(dir, "scripts", testScriptsDir, "test-only.json")
		if err := os.WriteFile(path, data, 0644); err != nil {
			t.Fatal(err)
		}

		got, err := store.GetScript("test-only")
		if err != nil {
			t.Fatalf("GetScript: %v", err)
		}
		if got.ID != testScript.ID {
			t.Errorf("ID = %q, want %q", got.ID, testScript.ID)
		}
	})

	t.Run("prefers production and deduplicates legacy scripts", func(t *testing.T) {
		legacyScript := models.Script{
			ID:           "boozling",
			Name:         "Legacy Boozling",
			Author:       "Legacy",
			CharacterIDs: []string{"chef"},
		}
		data, err := json.Marshal(legacyScript)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "scripts", "boozling.json"), data, 0644); err != nil {
			t.Fatal(err)
		}

		got, err := store.GetScript("boozling")
		if err != nil {
			t.Fatalf("GetScript: %v", err)
		}
		if got.Name != script.Name {
			t.Errorf("Name = %q, want production name %q", got.Name, script.Name)
		}

		scripts, err := store.ListScripts()
		if err != nil {
			t.Fatalf("ListScripts: %v", err)
		}
		boozlingCount := 0
		for _, listed := range scripts {
			if listed.ID == "boozling" {
				boozlingCount++
			}
		}
		if boozlingCount != 1 {
			t.Errorf("expected one deduplicated Boozling script, got %d", boozlingCount)
		}
	})

	t.Run("loads a legacy flat script", func(t *testing.T) {
		legacyScript := models.Script{
			ID:           "legacy-only",
			Name:         "Legacy Only",
			Author:       "Legacy",
			CharacterIDs: []string{"chef"},
		}
		data, err := json.Marshal(legacyScript)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "scripts", "legacy-only.json"), data, 0644); err != nil {
			t.Fatal(err)
		}

		got, err := store.GetScript("legacy-only")
		if err != nil {
			t.Fatalf("GetScript: %v", err)
		}
		if got.ID != legacyScript.ID {
			t.Errorf("ID = %q, want %q", got.ID, legacyScript.ID)
		}
	})
}
