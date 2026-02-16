package cleanup

import (
	"log"
	"time"

	"storyteller-cards-api/internal/storage"
)

const maxAge = 90 * 24 * time.Hour

// Start runs a 90-day session cleanup on startup and then daily.
func Start(store *storage.FileStore) {
	run(store)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			run(store)
		}
	}()
}

func run(store *storage.FileStore) {
	log.Println("cleanup: scanning for sessions older than 90 days")
	sessions, err := store.ListSessions()
	if err != nil {
		log.Printf("cleanup: error listing sessions: %v", err)
		return
	}

	cutoff := time.Now().Add(-maxAge)
	deleted := 0
	for _, s := range sessions {
		t, err := time.Parse(time.RFC3339, s.CreatedAt)
		if err != nil {
			log.Printf("cleanup: skip session %s (bad date %q): %v", s.ID, s.CreatedAt, err)
			continue
		}
		if t.Before(cutoff) {
			if err := store.DeleteSession(s.ID); err != nil {
				log.Printf("cleanup: error deleting session %s: %v", s.ID, err)
				continue
			}
			deleted++
			log.Printf("cleanup: deleted session %s (created %s)", s.ID, s.CreatedAt)
		}
	}
	log.Printf("cleanup: done — %d session(s) removed", deleted)
}
