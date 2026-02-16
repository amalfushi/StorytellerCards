package storage

import (
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
		DefaultPlayers:  []models.PlayerTemplate{{Seat: 1, PlayerName: "Alice"}},
		GameIDs:         []string{},
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
		if len(got.DefaultPlayers) != 1 || got.DefaultPlayers[0].PlayerName != "Alice" {
			t.Errorf("DefaultPlayers mismatch: %+v", got.DefaultPlayers)
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
		Players: []models.PlayerSeat{
			{Seat: 1, PlayerName: "Alice", CharacterID: "noble", Alive: true},
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
		if len(got.Players) != 1 || got.Players[0].PlayerName != "Alice" {
			t.Errorf("Players mismatch: %+v", got.Players)
		}
	})
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
}
