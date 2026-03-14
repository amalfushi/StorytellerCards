# Milestone 34 — Integration Testing for Cross-Device Sync

## Status: ✅ Complete

**Started:** 2026-03-13
**Completed:** 2026-03-14

### Summary

Added automated integration tests at three levels to catch the bug classes that required 15+ fix PRs after M30/M33 — Go model field mismatches, SSE self-echo issues, and cross-device state sync failures.

**What was implemented:**
- **Level 1 — Go Model Roundtrip Tests**: `TestGameRoundtrip`, `TestSessionRoundtrip`, `TestPartialGameRoundtrip`, `TestEmptyCollections` in `API/internal/handlers/roundtrip_test.go`
- **Level 2 — Playwright Game Lifecycle E2E**: Full UI workflow tests (session creation → game setup → night completion) in `UI/e2e/game-lifecycle.spec.ts`
- **Level 3 — Playwright Cross-Device Sync E2E**: Dual browser context SSE sync tests in `UI/e2e/cross-device-sync.spec.ts`
- **Playwright infrastructure**: Config, fixture script, dev server integration, `test:e2e`/`test:e2e:sync`/`test:e2e:all` scripts
- **Root integration script**: `npm run test:integration` runs Go roundtrip + all Playwright E2E
- **Documentation**: Testing guide updated with E2E section, milestone completed

### Progress

| Level | Description | Status | PR |
|-------|-------------|--------|----|
| Level 1 | Go Model Roundtrip Tests | ✅ Complete | [#78](../../pulls/78) |
| Level 2 | Playwright E2E — Game Lifecycle | ✅ Complete | [#79](../../pulls/79), [#81](../../pulls/81), [#84](../../pulls/84) |
| Level 3 | Playwright E2E — Cross-Device Sync | ✅ Complete | [#80](../../pulls/80), [#83](../../pulls/83) |
| Phase 5 | Documentation & Scripts | ✅ Complete | This PR |

---

> **Goal:** Add automated integration tests at three levels to catch the bug classes that required 15+ fix PRs after M30/M33 — Go model field mismatches, SSE self-echo issues, and cross-device state sync failures.

---

## 1. Problem Statement

Cross-device sync (M30 + M33) has accumulated **15+ fix PRs** since initial implementation. Nearly all bugs fell into a small number of recurring categories — and all were caught by manual testing rather than automated tests:

| Bug Class | Frequency | Example |
|-----------|-----------|---------|
| **Go model missing fields** | ~40% of fixes | Tokens, bluffs, selections silently dropped on roundtrip — Go struct lacked JSON tag or field entirely |
| **SSE self-echo overwriting local state** | ~20% of fixes | Device pushes a change, receives its own SSE event, overwrites in-flight local edits |
| **Polling/push race conditions** | ~15% of fixes | Debounced push and poll interval interleave, causing flickering or lost state |
| **CORS and networking issues** | ~15% of fixes | `isPrivateOrigin()` failures, missing CORS headers, LAN IP detection edge cases |
| **UI rendering after sync** | ~10% of fixes | Dialog state, scroll position, or component re-render issues after remote state applied |

### Why Integration Tests

Unit tests cover individual functions well (3998 tests, 78 files), but the sync bugs live at **boundaries**:
- Between the Go JSON serializer and the TypeScript type definitions
- Between SSE event delivery and React state dispatch
- Between two browser contexts sharing the same API

These boundaries need **integration tests** that exercise the full stack — not more unit tests mocking the seams where bugs actually hide.

---

## 2. Architecture: Three Testing Levels

### Level 1: Go Model Roundtrip Tests (~2s)

**Purpose:** Catch the #1 bug class — Go struct fields silently dropping data on JSON roundtrip.

**Approach:**
- Construct a **maximally-populated** game state in Go (every field filled)
- `PUT` to the API, then `GET` back
- Deep-compare every field — any dropped field fails the test immediately

### Level 2: Playwright E2E — Game Lifecycle (~30s)

**Purpose:** Validate the full UI workflow from session creation through Night 2, asserting API state at each step.

### Level 3: Playwright E2E — Cross-Device Sync (~60s)

**Purpose:** Validate that changes on one device appear on the other via SSE sync using two isolated browser contexts.

---

## 3. Task List

### Phase 1: Go Model Roundtrip Tests

- [x] Create `API/internal/handlers/roundtrip_test.go`
- [x] Build `makeMaximalGame()` helper
- [x] Build `makeMaximalSession()` helper
- [x] Write `TestGameRoundtrip` — PUT maximal game, GET back, deep-compare all fields
- [x] Write `TestSessionRoundtrip` — PUT maximal session, GET back, deep-compare all fields
- [x] Write `TestPartialGameRoundtrip`
- [x] Write `TestEmptyCollections`
- [x] Verify all roundtrip tests pass

### Phase 2: Playwright Setup & Configuration

- [x] Add Playwright as a dev dependency in `UI/`
- [x] Install Playwright browsers
- [x] Create `UI/playwright.config.ts`
- [x] Create `UI/e2e/` directory for E2E test files
- [x] Create `UI/e2e/helpers/` directory for shared test utilities
- [x] Create `UI/e2e/helpers/api.ts`
- [x] Create `UI/e2e/helpers/navigation.ts`
- [x] Add `test:e2e` script to `UI/package.json`
- [x] Add `test:e2e:ui` script for interactive Playwright UI mode
- [x] Verify Playwright runs a trivial smoke test against the dev server

### Phase 3: Game Lifecycle E2E Tests (Level 2)

- [x] Create `UI/e2e/game-lifecycle.spec.ts`
- [x] Test: Create session → verify session exists in API
- [x] Test: Create game with script → verify game and script in API
- [x] Test: Add players and assign characters → verify player list in API
- [x] Test: Set demon bluffs → verify bluffs in API state
- [x] Test: Enter Night 1, complete sub-actions → verify night action state in API
- [x] Test: Complete Night 1, advance to Night 2 → verify night history saved in API
- [x] Test: Verify localStorage and API state match at each step
- [x] All lifecycle tests pass

### Phase 4: Cross-Device Sync E2E Tests (Level 3)

- [x] Create `UI/e2e/cross-device-sync.spec.ts`
- [x] Create helper for dual-context setup
- [x] Test: Player added on Context A appears on Context B within 3 seconds
- [x] Test: Token change on Context A reflects on Context B
- [x] Test: Demon bluffs set on Context A appear on Context B
- [x] Test: Night completion on Context A → night history visible on Context B
- [x] Test: Bidirectional sync — Context B makes a change, Context A sees it
- [x] Test: No self-echo — after Context A pushes, Context A's state doesn't flicker or revert
- [x] Test: SSE reconnection — simulate network drop, verify sync resumes
- [x] All sync tests pass

### Phase 5: Documentation & CI Integration

- [x] Add Playwright E2E section to `docs/testing.md`
- [x] Document the three testing levels and when to run each
- [x] Add `test:integration` script to root `package.json`
- [x] Update this milestone doc with `## Status: ✅ Complete`
- [x] Update `docs/progress.md` — add M34 row, update verification stats
- [x] Update `AGENTS.md` — test stats if counts changed

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `API/internal/handlers/roundtrip_test.go` | Go model roundtrip tests |
| `UI/playwright.config.ts` | Playwright configuration |
| `UI/e2e/game-lifecycle.spec.ts` | Level 2 E2E — full game lifecycle |
| `UI/e2e/cross-device-sync.spec.ts` | Level 3 E2E — dual browser SSE sync |
| `UI/e2e/helpers/api.ts` | Direct HTTP helpers for API assertions |
| `UI/e2e/helpers/navigation.ts` | Page object helpers for UI flows |

### Modified Files

| File | Changes |
|------|---------|
| `UI/package.json` | Add `@playwright/test`, `test:e2e` and `test:e2e:ui` scripts |
| `package.json` (root) | Add `test:integration` script |
| `docs/testing.md` | Add Playwright E2E section |

---

## 5. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| `@playwright/test` | Dev dependency (UI) | E2E testing framework — Chromium only |
| Playwright Chromium browser | Dev tool | Installed via `npx playwright install chromium` |

No production dependencies added.
