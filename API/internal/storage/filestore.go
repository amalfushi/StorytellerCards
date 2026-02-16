package storage

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"storyteller-cards-api/internal/models"
)

// FileStore provides JSON file-based persistence.
type FileStore struct {
	baseDir string
}

// New creates a FileStore rooted at baseDir.
func New(baseDir string) *FileStore {
	return &FileStore{baseDir: baseDir}
}

// EnsureDirectories creates the required data directories.
func (fs *FileStore) EnsureDirectories() error {
	dirs := []string{
		filepath.Join(fs.baseDir, "sessions"),
		filepath.Join(fs.baseDir, "scripts"),
	}
	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return fmt.Errorf("mkdir %s: %w", d, err)
		}
	}
	return nil
}

// ──────────────────────────────────────────────
// Atomic write helper
// ──────────────────────────────────────────────

func atomicWrite(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("mkdir %s: %w", dir, err)
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return fmt.Errorf("write tmp %s: %w", tmp, err)
	}
	if err := os.Rename(tmp, path); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("rename %s → %s: %w", tmp, path, err)
	}
	return nil
}

// ──────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────

func (fs *FileStore) sessionPath(id string) string {
	return filepath.Join(fs.baseDir, "sessions", id+".json")
}

func (fs *FileStore) sessionGamesDir(sessionID string) string {
	return filepath.Join(fs.baseDir, "sessions", sessionID, "games")
}

// ListSessions returns all sessions.
func (fs *FileStore) ListSessions() ([]models.Session, error) {
	dir := filepath.Join(fs.baseDir, "sessions")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.Session{}, nil
		}
		return nil, err
	}

	var sessions []models.Session
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		s, err := fs.readSession(filepath.Join(dir, e.Name()))
		if err != nil {
			log.Printf("WARN: skip bad session file %s: %v", e.Name(), err)
			continue
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (fs *FileStore) readSession(path string) (models.Session, error) {
	var s models.Session
	data, err := os.ReadFile(path)
	if err != nil {
		return s, err
	}
	err = json.Unmarshal(data, &s)
	return s, err
}

// GetSession returns a single session by ID.
func (fs *FileStore) GetSession(id string) (models.Session, error) {
	return fs.readSession(fs.sessionPath(id))
}

// SaveSession persists a session to disk.
func (fs *FileStore) SaveSession(s models.Session) error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return atomicWrite(fs.sessionPath(s.ID), data)
}

// DeleteSession removes a session file and its games directory.
func (fs *FileStore) DeleteSession(id string) error {
	// Remove session JSON
	p := fs.sessionPath(id)
	if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
		return err
	}
	// Remove games directory
	gamesDir := fs.sessionGamesDir(id)
	if err := os.RemoveAll(gamesDir); err != nil && !os.IsNotExist(err) {
		return err
	}
	// Remove session subdirectory (may be empty now)
	sessionDir := filepath.Join(fs.baseDir, "sessions", id)
	os.Remove(sessionDir) // ignore error — may not exist or not empty
	return nil
}

// ──────────────────────────────────────────────
// Games
// ──────────────────────────────────────────────

func (fs *FileStore) gamePath(sessionID, gameID string) string {
	return filepath.Join(fs.sessionGamesDir(sessionID), gameID+".json")
}

// GetGame loads a game from disk.
func (fs *FileStore) GetGame(sessionID, gameID string) (models.Game, error) {
	var g models.Game
	data, err := os.ReadFile(fs.gamePath(sessionID, gameID))
	if err != nil {
		return g, err
	}
	err = json.Unmarshal(data, &g)
	return g, err
}

// SaveGame persists a game to disk.
func (fs *FileStore) SaveGame(g models.Game) error {
	data, err := json.MarshalIndent(g, "", "  ")
	if err != nil {
		return err
	}
	return atomicWrite(fs.gamePath(g.SessionID, g.ID), data)
}

// ListGames returns all games for a session.
func (fs *FileStore) ListGames(sessionID string) ([]models.Game, error) {
	dir := fs.sessionGamesDir(sessionID)
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.Game{}, nil
		}
		return nil, err
	}

	var games []models.Game
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		var g models.Game
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			log.Printf("WARN: skip bad game file %s: %v", e.Name(), err)
			continue
		}
		if err := json.Unmarshal(data, &g); err != nil {
			log.Printf("WARN: skip bad game json %s: %v", e.Name(), err)
			continue
		}
		games = append(games, g)
	}
	return games, nil
}

// ──────────────────────────────────────────────
// Scripts
// ──────────────────────────────────────────────

func (fs *FileStore) scriptPath(id string) string {
	return filepath.Join(fs.baseDir, "scripts", id+".json")
}

// GetScript loads a script by ID.
func (fs *FileStore) GetScript(id string) (models.Script, error) {
	var s models.Script
	data, err := os.ReadFile(fs.scriptPath(id))
	if err != nil {
		return s, err
	}
	err = json.Unmarshal(data, &s)
	return s, err
}

// SaveScript persists a script to disk.
func (fs *FileStore) SaveScript(s models.Script) error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return atomicWrite(fs.scriptPath(s.ID), data)
}

// ListScripts returns all scripts.
func (fs *FileStore) ListScripts() ([]models.Script, error) {
	dir := filepath.Join(fs.baseDir, "scripts")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.Script{}, nil
		}
		return nil, err
	}

	var scripts []models.Script
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		var s models.Script
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			log.Printf("WARN: skip bad script file %s: %v", e.Name(), err)
			continue
		}
		if err := json.Unmarshal(data, &s); err != nil {
			log.Printf("WARN: skip bad script json %s: %v", e.Name(), err)
			continue
		}
		scripts = append(scripts, s)
	}
	return scripts, nil
}
