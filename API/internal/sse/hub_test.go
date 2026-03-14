package sse_test

import (
	"sync"
	"testing"
	"time"

	"storyteller-cards-api/internal/sse"
)

func TestGameKey(t *testing.T) {
	got := sse.GameKey("sess1", "game2")
	if got != "sess1/game2" {
		t.Fatalf("expected sess1/game2, got %s", got)
	}
}

func TestSubscribeUnsubscribe(t *testing.T) {
	h := sse.NewHub()
	key := sse.GameKey("s1", "g1")

	c := h.Subscribe(key)
	if c == nil {
		t.Fatal("expected non-nil client")
	}
	if c.Ch == nil {
		t.Fatal("expected non-nil channel")
	}

	h.Unsubscribe(c)

	// Channel should be closed after unsubscribe
	_, open := <-c.Ch
	if open {
		t.Fatal("expected channel to be closed after unsubscribe")
	}
}

func TestBroadcastReachesSubscribers(t *testing.T) {
	h := sse.NewHub()
	key := sse.GameKey("s1", "g1")

	c1 := h.Subscribe(key)
	c2 := h.Subscribe(key)

	h.Broadcast(key, `{"version":1}`)

	select {
	case msg := <-c1.Ch:
		if msg != `{"version":1}` {
			t.Fatalf("c1: expected {\"version\":1}, got %s", msg)
		}
	case <-time.After(time.Second):
		t.Fatal("c1: timed out waiting for message")
	}

	select {
	case msg := <-c2.Ch:
		if msg != `{"version":1}` {
			t.Fatalf("c2: expected {\"version\":1}, got %s", msg)
		}
	case <-time.After(time.Second):
		t.Fatal("c2: timed out waiting for message")
	}

	h.Unsubscribe(c1)
	h.Unsubscribe(c2)
}

func TestBroadcastIsolation(t *testing.T) {
	h := sse.NewHub()
	keyA := sse.GameKey("s1", "g1")
	keyB := sse.GameKey("s1", "g2")

	cA := h.Subscribe(keyA)
	cB := h.Subscribe(keyB)

	h.Broadcast(keyA, "for-A")

	select {
	case msg := <-cA.Ch:
		if msg != "for-A" {
			t.Fatalf("cA: unexpected message %s", msg)
		}
	case <-time.After(time.Second):
		t.Fatal("cA: timed out")
	}

	// cB should NOT receive the message
	select {
	case msg := <-cB.Ch:
		t.Fatalf("cB should not receive message, got %s", msg)
	case <-time.After(50 * time.Millisecond):
		// expected
	}

	h.Unsubscribe(cA)
	h.Unsubscribe(cB)
}

func TestSlowClientDrop(t *testing.T) {
	h := sse.NewHub()
	key := sse.GameKey("s1", "g1")

	c := h.Subscribe(key)

	// Fill the channel buffer (cap=16)
	for i := 0; i < 16; i++ {
		h.Broadcast(key, "fill")
	}

	// 17th message should be dropped, not block
	done := make(chan struct{})
	go func() {
		h.Broadcast(key, "overflow")
		close(done)
	}()

	select {
	case <-done:
		// Broadcast returned without blocking — pass
	case <-time.After(time.Second):
		t.Fatal("Broadcast blocked on slow client")
	}

	h.Unsubscribe(c)
}

func TestConcurrentSafety(t *testing.T) {
	h := sse.NewHub()
	key := sse.GameKey("s1", "g1")

	var wg sync.WaitGroup

	// Concurrent subscribes
	clients := make([]*sse.Client, 50)
	for i := range clients {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			clients[idx] = h.Subscribe(key)
		}(i)
	}
	wg.Wait()

	// Concurrent broadcasts
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			h.Broadcast(key, "concurrent")
		}()
	}
	wg.Wait()

	// Concurrent unsubscribes
	for _, c := range clients {
		wg.Add(1)
		go func(cl *sse.Client) {
			defer wg.Done()
			h.Unsubscribe(cl)
		}(c)
	}
	wg.Wait()
}

func TestUnsubscribeCleansUpEmptyGameKey(t *testing.T) {
	h := sse.NewHub()
	key := sse.GameKey("s1", "g1")

	c := h.Subscribe(key)
	h.Unsubscribe(c)

	// After unsubscribing the only client, broadcasting should be a no-op
	h.Broadcast(key, "nobody home")
}

func TestBroadcastToEmptyKey(t *testing.T) {
	h := sse.NewHub()
	// Should not panic
	h.Broadcast("nonexistent/key", "data")
}
