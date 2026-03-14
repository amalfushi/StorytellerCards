package sse

import (
	"log"
	"sync"
)

// Client represents a single SSE subscriber.
type Client struct {
	Ch      chan string
	gameKey string
}

// Hub manages SSE clients grouped by game key.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool
}

// NewHub creates an empty Hub.
func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*Client]bool)}
}

// GameKey builds the map key for a session/game pair.
func GameKey(sessionID, gameID string) string {
	return sessionID + "/" + gameID
}

// Subscribe registers a new client for the given game key.
func (h *Hub) Subscribe(gameKey string) *Client {
	h.mu.Lock()
	defer h.mu.Unlock()
	c := &Client{Ch: make(chan string, 16), gameKey: gameKey}
	if h.clients[gameKey] == nil {
		h.clients[gameKey] = make(map[*Client]bool)
	}
	h.clients[gameKey][c] = true
	log.Printf("SSE: client connected to %s (%d total)", gameKey, len(h.clients[gameKey]))
	return c
}

// Unsubscribe removes a client and closes its channel.
func (h *Hub) Unsubscribe(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clients, ok := h.clients[c.gameKey]; ok {
		delete(clients, c)
		if len(clients) == 0 {
			delete(h.clients, c.gameKey)
		}
	}
	close(c.Ch)
}

// Broadcast sends data to every client subscribed to the game key.
func (h *Hub) Broadcast(gameKey string, data string) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients[gameKey] {
		select {
		case c.Ch <- data:
		default:
			log.Printf("SSE: dropping message to slow client on %s", gameKey)
		}
	}
}
