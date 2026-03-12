# Milestone 29 — Cross-Device Sync

## Status: ⏳ Planning

> **Goal:** Enable the Storyteller to use multiple devices concurrently (e.g., laptop + phone) during a game, with all devices staying in sync within a few seconds via version-based polling against the Go API.

---

## 1. Problem Statement

All game state currently lives in `localStorage`, making the app device-locked. The Go API exists with full CRUD endpoints but is **not integrated** — the `useApiSync` hook is defined but never called.

The Storyteller wants to:
- Set up a game on a laptop, then switch to their phone to run the game
- Keep a laptop open for overview while making quick updates on their phone during daytime discussions
- Have both devices stay reasonably in sync (a few seconds delay is acceptable)

This is a **personal-use app** — single Storyteller, 1-2 devices, human-timeline updates. The sync mechanism should be simple, reliable, and require zero additional infrastructure.

---

## 2. Architecture Decision: Version-Based Polling

### Why Polling

| Approach | Verdict | Reasoning |
|----------|---------|-----------|
| **Polling + Versions** | ✅ **Chosen** | Simplest, zero new deps, adequate for 2 devices with human-scale updates |
| **Server-Sent Events (SSE)** | 🟡 Future upgrade | Near-instant push, moderate complexity — documented upgrade path |
| **WebSockets** | ❌ Overkill | Full bidirectional real-time unnecessary for single-user |
| **Message Queue (Redis/NATS)** | ❌ Way overkill | Infrastructure dependency for an app serving 1-2 devices |
| **CRDTs** | ❌ Academic overkill | Conflict-free data types are fascinating but absurdly complex here |

### How It Works

```
Device A (laptop)                    API Server                    Device B (phone)
    |                                    |                              |
    |-- PUT /game (v=5) ---------------->|                              |
    |                                    |-- (stores v=5)               |
    |                                    |                              |
    |                                    |<---- GET /game/version ------|  (poll every 3s)
    |                                    |---- {version: 5} ----------->|
    |                                    |                              |
    |                                    |  (phone sees v=5 > local v=4)|
    |                                    |<---- GET /game (full) -------|
    |                                    |---- {game, version: 5} ----->|
    |                                    |                              |-- updates local state
```

1. Every `Session` and `Game` gets a `version` (int) + `updatedAt` (ISO timestamp)
2. On local change: increment version → save localStorage → PUT to API
3. Other device polls `/version` endpoint every 3s → tiny response (~50 bytes)
4. If server version > local version → fetch full state and apply
5. Manual "Refresh" button available for immediate sync

### Conflict Resolution: Last-Write-Wins + Optimistic Concurrency

Since this is a single-user app (one Storyteller, two devices), true conflicts are extremely rare — the Storyteller is looking at one device at a time.

- PUT requests include `X-Expected-Version` header with the client's current version
- If server version ≠ expected version → **409 Conflict** response
- On 409: client fetches latest state, applies it locally, then retries if needed
- In practice, the user will almost never hit a 409

### What Gets Synced

| Data | Sync Strategy | Poll Frequency |
|------|--------------|----------------|
| **Game state** | Active polling during gameplay | Every 3 seconds |
| **Session state** | Sync on load + push on change | On navigation / change only |
| **Scripts** | Sync on load + push on import | On app load only |

---

## 3. Error Handling & Retries

**Golden rule: localStorage always works. API failures never block gameplay.**

### Push Failures (PUT to API — local changes)

| Scenario | Strategy |
|----------|----------|
| Network error / timeout | Queue the push, retry with exponential backoff (1s → 2s → 4s → 8s, max 30s) |
| 409 Conflict | Fetch latest server state, reconcile (server wins), re-push if local has newer intent |
| 5xx Server Error | Retry up to 3 times with backoff, then queue for next poll cycle |
| 4xx Client Error (not 409) | Log and drop — likely a bug, don't retry bad requests |

**Push queue**: Failed pushes are queued in memory (not localStorage — transient). On next successful API contact, drain the queue in order. If the app is closed before queue drains, no data loss — localStorage has the state and next session will reconcile on load.

### Poll Failures (GET version check — background polling)

| Scenario | Strategy |
|----------|----------|
| Single failure | Skip this cycle, try again at next interval (3s) |
| 3 consecutive failures | Set sync status to `'offline'`, increase poll interval to 10s |
| 5+ consecutive failures | Back off to 30s polling (save battery/resources) |
| Recovery (success after failures) | Reset to normal 3s interval, set status to `'idle'`, trigger immediate full sync |

### Connection Status State Machine

```
                    ┌──────────────────────┐
                    │                      │
     API success    │       idle           │◄──── API responds OK
     ──────────────►│   (green checkmark)  │
                    │                      │
                    └──────────┬───────────┘
                               │
                         API call fails
                               │
                    ┌──────────▼───────────┐
                    │                      │
                    │      syncing         │──── Active push/pull in progress
                    │   (spinning icon)    │
                    │                      │
                    └──────────┬───────────┘
                               │
                      3 consecutive fails
                               │
                    ┌──────────▼───────────┐
                    │                      │
                    │      offline         │──── API unreachable
                    │   (grey/dim icon)    │     (still fully functional via localStorage)
                    │                      │
                    └──────────┬───────────┘
                               │
                         API responds OK
                               │
                         (back to idle)
```

### What the User Sees

- **Idle (✓)**: Everything synced, green checkmark in AppBar
- **Syncing (↻)**: Push/pull in progress, brief spinning icon
- **Offline (○)**: API unreachable, subtle grey icon — app continues working normally
- **Error (⚠)**: Push failed after retries — amber warning, tappable for details

**Key UX principle: never interrupt gameplay.** All sync failures are shown as subtle status indicators, never as modals, alerts, or blocking UI. The Storyteller has a game to run.

---

## 4. Task List

### Phase 1: API Versioning & Concurrency (Go)

- [ ] Add `Version int` and `UpdatedAt string` fields to `Session` and `Game` structs in `models.go`
- [ ] Update all PUT handlers to auto-increment `Version` and set `UpdatedAt` to current UTC time
- [ ] Update all POST (create) handlers to initialize `Version = 1`
- [ ] Add `X-Expected-Version` header check to PUT handlers — return 409 Conflict if stale
- [ ] Add `GET /api/sessions/{id}/version` endpoint returning `{version, updatedAt}` only
- [ ] Add `GET /api/sessions/{id}/games/{gameId}/version` endpoint (same pattern)
- [ ] Register new version-check routes in `main.go`
- [ ] Handle backward compatibility: files without `version` field default to `version = 0`
- [ ] Write Go tests: version increment, 409 on stale write, version endpoint accuracy, backward compat, concurrent writes

### Phase 2: UI Types & Retry Utility (TypeScript)

- [ ] Add `version: number` and `updatedAt: string` to `Session` and `Game` types in `types/index.ts`
- [ ] Add `SyncStatus` type: `'idle' | 'syncing' | 'error' | 'offline'`
- [ ] Add `VersionInfo` type: `{ version: number; updatedAt: string }`
- [ ] Create `useRetry` hook — exponential backoff utility (configurable maxRetries, baseDelay, maxDelay, onGiveUp callback)
- [ ] Write tests for `useRetry` hook

### Phase 3: API Sync Integration (TypeScript)

- [ ] Revamp `useApiSync` hook to be version-aware:
  - `pushGame(game)` → PUT with `X-Expected-Version` header
  - `pushSession(session)` → PUT with `X-Expected-Version` header
  - `pullGameVersion(sessionId, gameId)` → lightweight version check
  - `pullSessionVersion(sessionId)` → lightweight version check
  - `pullGame(sessionId, gameId)` → full game fetch
  - `pullSession(sessionId)` → full session fetch
  - Connection status tracking (online/offline)
  - 409 conflict handling (fetch latest, reconcile)
- [ ] Create `useSyncPolling` hook — polling loop with:
  - Configurable interval (default 3s)
  - Version comparison → full fetch on mismatch
  - Pause when `document.hidden` (tab not visible)
  - Backoff on consecutive failures (3s → 10s → 30s)
  - Recovery detection and reset
  - Cleanup on unmount
- [ ] Integrate sync into `GameContext`:
  - Track `version` in `GameViewState`
  - Increment version on local change
  - Add `SYNC_GAME` action for applying remote state
  - Push to API on state change (debounced)
  - Accept incoming state from polling (if server version > local)
- [ ] Integrate sync into `SessionContext`:
  - Same version tracking pattern
  - Sync on session load, push on session change
  - Add `SYNC_SESSION` action
- [ ] Write tests for revamped `useApiSync`, `useSyncPolling`, and context sync actions

### Phase 4: UI Components

- [ ] Create `SyncStatusIndicator` component — small icon in AppBar showing sync state (✓/↻/○/⚠)
- [ ] Add manual "Refresh" button to AppBar — forces immediate version check + full fetch
- [ ] Write tests for `SyncStatusIndicator`
- [ ] Create Storybook stories for `SyncStatusIndicator` (idle, syncing, offline, error states)

### Phase 5: Integration Testing

- [ ] **Go multi-client tests**: Two simulated clients making sequential writes → version increments correctly
- [ ] **Go concurrency tests**: Stale write detection (client A writes, client B tries stale overwrite → 409)
- [ ] **Go end-to-end scenario**: Create session → create game → update from client A → poll from client B → verify convergence
- [ ] **UI sync scenario tests**: Poll detects version change → triggers full fetch → state updates
- [ ] **UI offline tests**: API unreachable → localStorage continues working → sync resumes on recovery
- [ ] **UI 409 handling tests**: Stale push → fetch latest → reconcile → re-push

### Phase 6: Polish & Edge Cases

- [ ] Initial sync on app load: fetch all sessions from API, merge with localStorage (prefer higher version)
- [ ] First-device setup flow: first device creates session → API; second device opens app → discovers session from API
- [ ] Offline grace: show status indicator, never block gameplay, queue changes for retry on reconnect
- [ ] Configurable sync interval via settings (default 3s)
- [ ] Update milestone29.md with `## Status: ✅ Complete`
- [ ] Update `docs/progress.md`
- [ ] Update `AGENTS.md` test stats

---

## 5. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `UI/src/hooks/useSyncPolling.ts` | Polling loop with visibility pause and backoff |
| `UI/src/hooks/useSyncPolling.test.ts` | Polling behavior tests |
| `UI/src/hooks/useRetry.ts` | Exponential backoff retry utility |
| `UI/src/hooks/useRetry.test.ts` | Retry behavior tests |
| `UI/src/components/SyncStatusIndicator.tsx` | Sync status icon for AppBar |
| `UI/src/components/SyncStatusIndicator.test.tsx` | Component tests |
| `UI/src/components/SyncStatusIndicator.stories.tsx` | Storybook stories |
| `API/internal/handlers/sync_integration_test.go` | Multi-client integration tests |
| `UI/src/hooks/syncIntegration.test.ts` | UI sync scenario tests |

### Modified Files

| File | Change |
|------|--------|
| `API/internal/models/models.go` | Add `Version`, `UpdatedAt` to Session and Game |
| `API/internal/handlers/sessions.go` | Version increment, `X-Expected-Version` check, version endpoint |
| `API/internal/handlers/games.go` | Same as sessions |
| `API/internal/handlers/sessions_test.go` | Version + concurrency tests |
| `API/internal/handlers/games_test.go` | Same |
| `API/cmd/server/main.go` | Register version-check routes |
| `UI/src/types/index.ts` | Add `version`, `updatedAt`, `SyncStatus`, `VersionInfo` |
| `UI/src/hooks/useApiSync.ts` | Major revamp: version-aware push/pull, connection tracking |
| `UI/src/hooks/useApiSync.test.ts` | Updated tests for new behavior |
| `UI/src/context/GameContext.tsx` | Version tracking, `SYNC_GAME` action, API push on change |
| `UI/src/context/GameContext.test.tsx` | Sync-related tests |
| `UI/src/context/SessionContext.tsx` | Version tracking, sync on load/change, `SYNC_SESSION` action |
| `UI/src/context/SessionContext.test.tsx` | Sync-related tests |

---

## 6. Dependencies

- **M28** (Alignment Icon Variants) ✅ — latest completed milestone
- **Existing `useApiSync` hook** — foundation to build on (needs revamp, not rewrite)
- **Existing Go API** — all CRUD endpoints already implemented
- No external dependencies required (zero new npm/Go packages)

---

## 7. Future Upgrade Path: SSE

If polling ever feels inadequate, the upgrade to Server-Sent Events is straightforward and the version-based architecture makes it a clean swap:

1. Add `GET /api/sessions/{id}/games/{gid}/events` SSE endpoint in Go
2. Server holds open connections, pushes `version-changed` events on writes
3. UI replaces polling interval with native `EventSource` listener
4. Same version model, same conflict resolution — just push-notified instead of polled
5. Falls back to polling if SSE connection drops

Estimated effort: ~100 lines of Go + ~50 lines of TypeScript.

---

## 8. Acceptance Criteria

- [ ] Multiple devices can view the same game state via the Go API
- [ ] Changes on one device appear on the other within ~5 seconds
- [ ] Manual "Refresh" button triggers immediate sync
- [ ] Sync status indicator shows current state (idle/syncing/offline/error)
- [ ] API failures never block gameplay — localStorage continues working
- [ ] Stale writes are detected (409) and handled gracefully
- [ ] Failed pushes retry with exponential backoff
- [ ] Polling pauses when tab is not visible (saves resources)
- [ ] Polling backs off on consecutive failures, recovers automatically
- [ ] App loads state from API on startup if available (merge with localStorage)
- [ ] All existing tests continue to pass
- [ ] New tests cover sync behavior, retries, offline handling, and multi-client scenarios
- [ ] 0 TypeScript errors, 0 ESLint errors
