package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"storyteller-cards-api/internal/cleanup"
	"storyteller-cards-api/internal/handlers"
	"storyteller-cards-api/internal/storage"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	// Resolve data path relative to the executable
	baseDir := "data"

	store := storage.New(baseDir)
	if err := store.EnsureDirectories(); err != nil {
		log.Fatalf("FATAL ensure dirs: %v", err)
	}

	// Start 90-day session cleanup
	cleanup.Start(store)

	// Handlers
	sessions := handlers.NewSessions(store)
	games := handlers.NewGames(store)
	scripts := handlers.NewScripts(store)

	// Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:4173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Routes
	r.Route("/api", func(r chi.Router) {
		// Sessions
		r.Get("/sessions", sessions.List)
		r.Post("/sessions", sessions.Create)
		r.Get("/sessions/{id}", sessions.Get)
		r.Put("/sessions/{id}", sessions.Update)
		r.Delete("/sessions/{id}", sessions.Delete)

		// Games (nested under session)
		r.Post("/sessions/{sessionId}/games", games.Create)
		r.Get("/sessions/{sessionId}/games/{gameId}", games.Get)
		r.Put("/sessions/{sessionId}/games/{gameId}", games.Update)

		// Scripts
		r.Post("/scripts/import", scripts.Import)
		r.Get("/scripts", scripts.List)
		r.Get("/scripts/{id}", scripts.Get)

	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("API server starting on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("FATAL listen: %v", err)
		}
	}()

	<-done
	log.Println("shutting down…")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("ERROR shutdown: %v", err)
	}
	log.Println("server stopped")
}
