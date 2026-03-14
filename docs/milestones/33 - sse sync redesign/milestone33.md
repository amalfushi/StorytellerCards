# Milestone 33 — SSE Sync Redesign

> **Goal:** Replace the polling-based cross-device sync (M30) with Server-Sent Events (SSE) and a same-origin API architecture, eliminating CORS configuration, polling lag, and the version-tracking complexity that caused 10+ fix PRs.

---

## 1. Problem Statement

Milestone 30 introduced cross-device sync via version-based polling. While functional, it has proven **extremely fragile in practice** — requiring PRs #45–#50 for post-merge fixes and additional patches beyond that. The fundamental issues are architectural:

| Problem | Root Cause | Symptom |
|---------|-----------|---------|
| **Dual state ownership** | Both localStorage and API claim to be source of truth | Push-before-poll races overwrite remote changes |
| **Polling lag** | 3–10s polling interval means changes are never instant | User sees stale state, makes conflicting edits |
| **Version tracking complexity** | `lastServerVersion`, `lastPushedGameRef`, `isSyncingRef`, `X-Expected-Version` headers | 6+ refs/state variables just to coordinate push/pull; stale closures cause subtle bugs |
| **CORS pain** | UI on `:5173`, API on `:3001` = cross-origin | `isPrivateOrigin()`, `CORS_ORIGINS` env var, preflight requests, LAN IP detection — all fragile |
| **No merge strategy** | 409 Conflict → fetch remote → replace local wholesale | Local unsaved changes silently lost on conflict |
| **Push-before-poll races** | Local change pushes to API, then poll overwrites with stale version | Flickering state, lost edits |
| **Debounce/timing sensitivity** | 1000ms debounce on push + 3000ms poll interval | Narrow timing windows where push and poll interleave destructively |

### Why This Matters Less Than It Seems

This is a **single-Storyteller personal app** — 1–2 devices, human-timeline updates (a few changes per minute at most). The sync system doesn't need to handle concurrent writers or sub-second consistency. It needs to be **simple and reliable**:

- Device A makes a change → Device B sees it within ~1 second
- No configuration required (no CORS, no env vars, no port numbers)
- Offline works fine (localStorage is primary), reconnects seamlessly

---

## 2. Architecture: SSE + Same-Origin

### 2.1 SSE Push Notification Flow

Instead of polling for version numbers, the API **pushes** a lightweight event to all connected clients when state changes:

```
Device A (writes)               API Server                      Device B (reads)
   |                                |                              |
   |-- PUT /api/game (state) ------>|                              |
   |                                |-- SSE: version-changed ----->|  (instant!)
   |                                |<---- GET /api/game ----------|
   |                                |---- {full game state} ------>|
   |                                |                              |
```

**Key design decisions:**

- **Event = notification only** — the SSE event says "something changed", the client fetches the full state via a normal GET. This keeps the SSE channel lightweight and avoids large payloads over the event stream.
- **Skip self-echo** — when Device A pushes a change, it ignores the resulting SSE event (it already has the latest state). Achieved by comparing a client-generated push ID or simply comparing the fetched state against what was just pushed.
- **Fire-and-forget push** — no `X-Expected-Version` header, no 409 handling. The server always accepts the latest PUT. For a single-user app, last-write-wins is the correct strategy.

### 2.2 Same-Origin Architecture

Eliminate CORS entirely by making the UI and API share the same origin:

**Development (Vite dev server):**
```
Browser → localhost:5173/api/* → Vite proxy → localhost:3001/api/*
Browser → localhost:5173/*     → Vite dev server (React HMR)
```

**Production (Go serves everything):**
```
Browser → host:3001/api/*  → Go API handlers
Browser → host:3001/*      → Go static file server (UI/dist/)
```

**API calls use relative paths:**
```typescript
// Before (cross-origin, fragile):
fetch(`http://${window.location.hostname}:3001/api/sessions`)

// After (same-origin, just works):
fetch('/api/sessions')
```

This eliminates:
- All CORS middleware and configuration
- `isPrivateOrigin()` function
- `CORS_ORIGINS` env var
- `getApiBase()` hostname detection logic
- `X-Expected-Version` header (no longer needed in CORS `AllowedHeaders`)
- Preflight OPTIONS requests

### 2.3 SSE Server Design (Go)

```go
// SSE hub manages connected clients per game
type SSEHub struct {
    mu      sync.RWMutex
    clients map[string]map[chan string]struct{} // gameKey → set of channels
}

// Register a client for SSE events on a specific game
func (h *SSEHub) Subscribe(gameKey string) chan string { ... }

// Remove a client when they disconnect
func (h *SSEHub) Unsubscribe(gameKey string, ch chan string) { ... }

// Broadcast "version-changed" to all clients watching a game
func (h *SSEHub) Broadcast(gameKey string) { ... }
```

**SSE endpoint:** `GET /api/sessions/{id}/games/{gid}/events`

**Event format:**
```
event: version-changed
data: {"version": 42, "updatedAt": "2026-03-15T10:30:00Z"}

event: heartbeat
data: ping
```

**Heartbeat:** Every 30 seconds to keep the connection alive and detect dead clients.

### 2.4 SSE Client Design (React)

```typescript
// useSseSync hook — replaces useSyncPolling entirely
function useSseSync(sessionId: string, gameId: string, onRemoteChange: () => void) {
  // Uses native EventSource API (no dependencies)
  // Auto-reconnects on disconnect with exponential backoff
  // Reconnects on tab visibility change (visibilitychange event)
  // Skips self-echo by tracking last-pushed state
}
```

---

## 3. Task List

### Phase 1: Vite Proxy + Same-Origin

- [ ] Add `server.proxy` configuration to `vite.config.ts` — proxy `/api` to `http://localhost:3001`
- [ ] Change `getApiBase()` in `useApiSync.ts` to return empty string (all paths become relative)
- [ ] Remove `VITE_API_URL` env var handling from `useApiSync.ts`
- [ ] Remove CORS middleware from Go API (`main.go`) — delete `cors.Handler`, `isPrivateOrigin()`, `splitAndTrim()`, `CORS_ORIGINS` env var
- [ ] Remove `github.com/go-chi/cors` dependency from `go.mod`
- [ ] Add Go static file serving for production — serve `UI/dist/` on non-API routes
- [ ] Update `useApiSync` tests to reflect relative paths
- [ ] Verify `npm run dev` works with proxy (both UI and API accessible on `:5173`)

### Phase 2: SSE Server (Go)

- [ ] Create `internal/sse/hub.go` — SSE hub with Subscribe/Unsubscribe/Broadcast
- [ ] Create `internal/sse/handler.go` — HTTP handler for SSE endpoint
- [ ] Add `GET /api/sessions/{id}/games/{gid}/events` SSE endpoint to router
- [ ] Integrate hub into game PUT handler — broadcast `version-changed` on every successful game update
- [ ] Integrate hub into session PUT handler — broadcast on session updates
- [ ] Implement 30-second heartbeat ping to keep connections alive
- [ ] Handle client disconnect (context cancellation) with cleanup
- [ ] Write Go tests: client connect/disconnect, broadcast delivery, heartbeat timing, concurrent clients

### Phase 3: SSE Client (React)

- [ ] Create `useSseSync.ts` hook using native `EventSource` API
- [ ] On `version-changed` event: fetch full game state via GET, dispatch `SYNC_GAME`
- [ ] Implement auto-reconnect on disconnect with exponential backoff
- [ ] Reconnect on tab visibility change (`visibilitychange` event)
- [ ] Skip self-echo: ignore SSE events for changes we just pushed (compare against `lastPushedGameRef`)
- [ ] Replace `useSyncPolling` usage in `GameContext.tsx` with `useSseSync`
- [ ] Simplify push logic: fire-and-forget PUT with no version headers
- [ ] Remove `lastServerVersion` state and `lastServerVersionRef` from GameContext
- [ ] Simplify `lastPushedGameRef` usage (keep for self-echo detection only)
- [ ] Keep manual refresh button (`SyncStatusIndicator`) as fallback
- [ ] Update `SyncStatusIndicator` to show SSE connection status
- [ ] Write tests for `useSseSync` hook: connect, reconnect, self-echo skip, visibility change

### Phase 4: Cleanup

- [ ] Delete `useSyncPolling.ts` and `useSyncPolling.test.ts`
- [ ] Remove `X-Expected-Version` header logic from `useApiSync.ts` (`pushSession`, `pushGame`, `pushRequest`)
- [ ] Remove `PushResult.conflict` type and 409 handling from `useApiSync.ts`
- [ ] Remove `pushGame`/`pushSession` direct methods — keep only `syncGame`/`syncSession`
- [ ] Remove `pullSessionVersion`/`pullGameVersion` methods (no more version polling)
- [ ] Remove `/version` route handlers from Go API (or keep for debugging — decide)
- [ ] Remove `versionAwarePushGame()` from GameContext
- [ ] Remove unused version-tracking state (`lastServerVersion`, `isSyncingRef` if no longer needed)
- [ ] Remove `SyncPollingOptions` and `VersionInfo` types if no longer used
- [ ] Clean up unused imports across all modified files
- [ ] Remove `useRetry.ts` if no longer used (was created for polling retry logic)

### Phase 5: Documentation & Polish

- [ ] Update this milestone doc with `## Status: ✅ Complete`
- [ ] Update `docs/progress.md` — add M33 row, update verification stats
- [ ] Update `AGENTS.md` — test stats, coverage thresholds if changed
- [ ] Verify `npm run dev:ui:localonly` mode still works (`VITE_SYNC_DISABLED=true`)
- [ ] Verify LAN access works (phone on same network can access via Go server)
- [ ] Update architecture docs if they reference polling or CORS

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `API/internal/sse/hub.go` | SSE hub — manages connected clients per game, broadcasts events |
| `API/internal/sse/handler.go` | HTTP handler for SSE endpoint |
| `API/internal/sse/hub_test.go` | Go tests for SSE hub |
| `UI/src/hooks/useSseSync.ts` | React hook — SSE client with auto-reconnect and self-echo skip |
| `UI/src/hooks/useSseSync.test.ts` | Tests for useSseSync hook |

### Modified Files

| File | Changes |
|------|---------|
| `UI/vite.config.ts` | Add `server.proxy` for `/api` → `localhost:3001` |
| `UI/src/hooks/useApiSync.ts` | Remove `getApiBase()` hostname logic, remove `X-Expected-Version`, remove `pushGame`/`pushSession`/`pullGameVersion`/`pullSessionVersion`, simplify to relative paths |
| `UI/src/hooks/useApiSync.test.ts` | Update tests for relative paths, remove version-header tests |
| `UI/src/context/GameContext.tsx` | Replace `useSyncPolling` with `useSseSync`, remove `lastServerVersion`/`versionAwarePushGame`/version tracking refs, simplify push to fire-and-forget |
| `UI/src/context/GameContext.test.tsx` | Update sync-related tests |
| `UI/src/types/index.ts` | Remove `SyncPollingOptions`/`VersionInfo` if unused, add SSE-related types if needed |
| `UI/src/components/SyncStatusIndicator.tsx` | Update status display for SSE connection state |
| `API/cmd/server/main.go` | Remove CORS middleware, add SSE route, add static file serving, inject SSE hub into handlers |
| `API/internal/handlers/games.go` | Call `hub.Broadcast()` after successful game PUT |
| `API/internal/handlers/sessions.go` | Call `hub.Broadcast()` after successful session PUT |
| `API/go.mod` | Remove `github.com/go-chi/cors` dependency |

### Deleted Files

| File | Reason |
|------|--------|
| `UI/src/hooks/useSyncPolling.ts` | Replaced by SSE-based push notifications |
| `UI/src/hooks/useSyncPolling.test.ts` | Tests for deleted hook |
| `UI/src/hooks/useRetry.ts` | No longer needed (polling retry logic) — verify not used elsewhere first |
| `UI/src/hooks/useRetry.test.ts` | Tests for deleted hook — verify not used elsewhere first |

---

## 5. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| Native `EventSource` API | Browser built-in | No npm packages needed — supported in all modern browsers |
| `github.com/go-chi/cors` | **Removed** | No longer needed with same-origin architecture |

No new dependencies are introduced. SSE uses the browser's native `EventSource` API and Go's standard `net/http` for streaming responses.

---

## 6. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| SSE connection drops silently | Medium | Auto-reconnect with exponential backoff + visibility change handler |
| Proxy adds latency in dev | Low | Vite proxy is transparent; only affects dev, not production |
| Self-echo causes double-apply | Medium | Track last-pushed state, ignore matching SSE events |
| Go SSE handler leaks goroutines | Medium | Use `context.Done()` from `http.Request` to detect disconnects; clean up channels |
| Static file serving conflicts with API routes | Low | Serve static files only for non-`/api` paths; standard SPA fallback pattern |
| `useRetry` used elsewhere | Low | Search codebase before deleting; keep if other consumers exist |

---

## 7. Acceptance Criteria

- [ ] Changes on one device appear on the other within ~1 second (SSE push, not polling)
- [ ] No CORS configuration needed — same-origin in both dev (Vite proxy) and production (Go static)
- [ ] No polling — SSE-based push notifications only (no `setInterval`, no version endpoint calls)
- [ ] Manual refresh button works as fallback (fetches full state via GET)
- [ ] Offline mode: localStorage continues working, SSE reconnects automatically when network returns
- [ ] `npm run dev:ui:localonly` (`VITE_SYNC_DISABLED=true`) still works with no sync
- [ ] LAN access works: phone on same WiFi can access the app via Go server's IP
- [ ] All existing tests pass + new SSE tests (Go + React)
- [ ] 0 TypeScript errors (`npx tsc --noEmit`)
- [ ] 0 ESLint errors (`npx eslint .`)
- [ ] `useSyncPolling.ts` and related polling code fully removed
- [ ] No `X-Expected-Version` header usage remains
- [ ] No CORS middleware or `isPrivateOrigin()` remains in Go code

---

## 8. Non-Goals (Out of Scope)

- **Session-level SSE** — only game state is synced via SSE for now; session sync remains simple push
- **Conflict resolution UI** — last-write-wins is sufficient for single-user
- **WebSocket upgrade** — SSE is unidirectional (server→client) which is exactly what we need
- **Service worker / background sync** — PWA offline queuing is a separate concern
- **Multi-user support** — this is and will remain a single-Storyteller app
