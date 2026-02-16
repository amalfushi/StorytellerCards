# Storyteller Cards — API

A lightweight Go REST API for the Blood on the Clocktower Storyteller helper app. Provides JSON file-based persistence as a secondary sync layer — primary storage is `localStorage` on the client.

## Prerequisites

- **Go** 1.22+ (developed with 1.25)

## Getting Started

```bash
cd StorytellerCards/API

# Run the server
go run ./cmd/server

# Build a binary
go build -o storyteller-api ./cmd/server
./storyteller-api
```

The server starts on port **3001** by default. Override with the `PORT` env var:

```bash
PORT=8080 go run ./cmd/server
```

## Project Structure

```
API/
├── cmd/
│   └── server/
│       └── main.go            # Entry point, router setup
├── internal/
│   ├── handlers/              # HTTP handlers
│   │   ├── sessions.go        # Session CRUD
│   │   ├── games.go           # Game CRUD
│   │   ├── scripts.go         # Script import + listing
│   │   ├── characters.go      # Character data proxy
│   │   └── helpers.go         # JSON response helper
│   ├── models/
│   │   └── models.go          # All data types
│   ├── storage/
│   │   └── filestore.go       # JSON file-based storage
│   └── cleanup/
│       └── cleanup.go         # 90-day session cleanup
├── go.mod
├── go.sum
└── README.md
```

## API Endpoints

### Sessions

| Method | Path                    | Description                         |
|--------|-------------------------|-------------------------------------|
| GET    | `/api/sessions`         | List all sessions                   |
| POST   | `/api/sessions`         | Create a new session                |
| GET    | `/api/sessions/{id}`    | Get a single session                |
| PUT    | `/api/sessions/{id}`    | Update a session                    |
| DELETE | `/api/sessions/{id}`    | Delete a session and its games      |

### Games

| Method | Path                                          | Description       |
|--------|-----------------------------------------------|-------------------|
| POST   | `/api/sessions/{sessionId}/games`             | Create a new game |
| GET    | `/api/sessions/{sessionId}/games/{gameId}`    | Get a game        |
| PUT    | `/api/sessions/{sessionId}/games/{gameId}`    | Update a game     |

### Scripts

| Method | Path                    | Description                          |
|--------|-------------------------|--------------------------------------|
| POST   | `/api/scripts/import`   | Import a script                      |
| GET    | `/api/scripts`          | List all scripts                     |
| GET    | `/api/scripts/{id}`     | Get a single script                  |

### Characters

| Method | Path                           | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/characters`              | List all characters            |
| GET    | `/api/characters?ids=id1,id2`  | Get filtered characters        |

### Health

| Method | Path       | Description                 |
|--------|------------|-----------------------------|
| GET    | `/health`  | Health check (returns `ok`) |

## Testing

```bash
# Run all tests
go test ./...

# Verbose output
go test -v ./...

# Run specific package tests
go test ./internal/storage/...
go test ./internal/handlers/...

# With coverage
go test -cover ./...
```

### Test Structure

Tests are co-located with source files using Go's `_test.go` convention:

- `internal/storage/filestore_test.go` — Storage round-trip tests (uses `t.TempDir()`)
- `internal/handlers/sessions_test.go` — Session handler HTTP tests
- `internal/handlers/games_test.go` — Game handler HTTP tests
- `internal/handlers/scripts_test.go` — Script handler HTTP tests

All handler tests use `httptest.NewRecorder()` and `httptest.NewRequest()` with the Chi router for full integration testing.

### Adding Tests

1. Create a `*_test.go` file in the same package
2. Use `func TestXxx(t *testing.T)` with `t.Run()` subtests
3. Use `t.TempDir()` for isolated file system tests

## Storage

### How JSON Files Work

All data is stored as JSON files in a `data/` directory:

```
data/
├── sessions/
│   ├── {session-id}.json          # Session metadata
│   └── {session-id}/
│       └── games/
│           └── {game-id}.json     # Game state
└── scripts/
    └── {script-id}.json           # Imported scripts
```

The `data/` directory is created automatically on startup and should be git-ignored.

### Atomic Writes

All writes use a temp-file + rename pattern to prevent data corruption during crashes.

### 90-Day Cleanup

A background goroutine runs on startup and then every 24 hours. It deletes sessions with a `createdAt` timestamp older than 90 days, along with their associated game files.

## Environment Variables

| Variable | Description          | Default |
|----------|----------------------|---------|
| `PORT`   | Server listen port   | `3001`  |

## CORS

The API allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)

Update the CORS configuration in `cmd/server/main.go` for production domains.

## Character Data

The `/api/characters` endpoint serves from the UI's bundled `characters.json` file at `../UI/src/data/characters.json` (relative to the API working directory). Ensure you run the server from the `StorytellerCards/API/` directory.

## Deployment Notes

- Build a static binary with `go build -o storyteller-api ./cmd/server`
- Set `PORT` env var for your hosting environment
- Update CORS origins for your production domain
- The `data/` directory must be writable by the server process
- Consider a reverse proxy (nginx/Caddy) for TLS termination
