package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
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

	// CORS: allow localhost and any private-network IP (RFC 1918).
	// Override via CORS_ORIGINS env var (comma-separated) for explicit control.
	var corsOpts cors.Options
	if envOrigins := os.Getenv("CORS_ORIGINS"); envOrigins != "" {
		corsOpts = cors.Options{
			AllowedOrigins: splitAndTrim(envOrigins),
		}
	} else {
		corsOpts = cors.Options{
			AllowOriginFunc: isPrivateOrigin,
		}
	}
	corsOpts.AllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsOpts.AllowedHeaders = []string{"Content-Type", "X-Expected-Version"}
	corsOpts.AllowCredentials = false
	corsOpts.MaxAge = 300

	// Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(corsOpts))

	// Routes
	r.Route("/api", func(r chi.Router) {
		// Sessions
		r.Get("/sessions", sessions.List)
		r.Post("/sessions", sessions.Create)
		r.Get("/sessions/{id}", sessions.Get)
		r.Put("/sessions/{id}", sessions.Update)
		r.Delete("/sessions/{id}", sessions.Delete)
		r.Get("/sessions/{id}/version", sessions.GetVersion)

		// Games (nested under session)
		r.Post("/sessions/{sessionId}/games", games.Create)
		r.Get("/sessions/{sessionId}/games/{gameId}", games.Get)
		r.Put("/sessions/{sessionId}/games/{gameId}", games.Update)
		r.Get("/sessions/{sessionId}/games/{gameId}/version", games.GetVersion)

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

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

// isPrivateOrigin returns true if the origin is localhost or a private (RFC 1918) IP.
// This allows any device on the local network while rejecting public internet origins.
func isPrivateOrigin(_ *http.Request, origin string) bool {
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	host := u.Hostname()
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsPrivate()
}
