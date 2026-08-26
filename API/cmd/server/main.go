package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"storyteller-cards-api/internal/auth"
	"storyteller-cards-api/internal/cleanup"
	"storyteller-cards-api/internal/handlers"
	"storyteller-cards-api/internal/sse"
	"storyteller-cards-api/internal/storage"
	"storyteller-cards-api/internal/web"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	baseDir := envOrDefault("DATA_DIR", "data")

	store := storage.New(baseDir)
	if err := store.EnsureDirectories(); err != nil {
		log.Fatalf("FATAL ensure dirs: %v", err)
	}

	// Start 90-day session cleanup
	cleanup.Start(store)

	// Handlers
	sseHub := sse.NewHub()
	sessions := handlers.NewSessions(store)
	games := handlers.NewGames(store, sseHub)
	scripts := handlers.NewScripts(store)
	events := handlers.NewEvents(sseHub)

	// Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(auth.Basic(envOrDefault("BASIC_AUTH_USERNAME", "storyteller"), os.Getenv("BASIC_AUTH_PASSWORD")))

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
		r.Delete("/sessions/{sessionId}/games/{gameId}", games.Delete)
		r.Get("/sessions/{sessionId}/games/{gameId}/version", games.GetVersion)
		r.Get("/sessions/{sessionId}/games/{gameId}/events", events.Stream)

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

	// Serve built UI in production (after API routes)
	distDir := envOrDefault("STATIC_DIR", "../UI/dist")
	if staticHandler, err := web.NewSPAHandler(distDir); err == nil {
		r.Handle("/*", staticHandler)
		log.Printf("Serving UI from %s", distDir)
	} else {
		log.Printf("UI static assets unavailable: %v", err)
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	srv := &http.Server{
		Addr:    host + ":" + port,
		Handler: r,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("API server listening on %s:%s", host, port)
		logLANAddresses(port)
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

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

// logLANAddresses prints the machine's LAN IPs so users know what URL to use from other devices.
func logLANAddresses(port string) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.IsLoopback() || ip.To4() == nil {
				continue
			}
			if ip.IsPrivate() {
				log.Printf("  LAN: http://%s:%s", ip.String(), port)
			}
		}
	}
}
