# Milestone 34 — Integration Testing for Cross-Device Sync

> **Goal:** Add automated integration tests at three levels to catch the bug classes that required 15+ fix PRs after M30/M33 — Go model field mismatches, SSE self-echo issues, and cross-device state sync failures.

## Status: ⏳ In Progress

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

Unit tests cover individual functions well (3977 tests, 77 files), but the sync bugs live at **boundaries**:

- Between the Go JSON serializer and the TypeScript type definitions
- Between SSE event delivery and React state dispatch
- Between two browser contexts sharing the same API

These boundaries need **integration tests** that exercise the full stack — not more unit tests mocking the seams where bugs actually hide.

---

## 2. Architecture: Three Testing Levels

### Level 1: Go Model Roundtrip Tests (~2s)

**Purpose:** Catch the #1 bug class — Go struct fields silently dropping data on JSON roundtrip.

**Approach:**
- Construct a **maximally-populated** game state in Go (every field filled: players with all token types, bluffs, demon bluffs, night history, selections, fabled, travellers, loric characters, sub-actions, choices)
- `PUT` to the API, then `GET` back
- Deep-compare every field — any dropped field fails the test immediately
- Repeat for session state (session-level fields, game list metadata)

**What it catches:**
- Missing `json:"fieldName"` tags on Go structs
- Fields present in TypeScript types but absent from Go models
- Serialization edge cases (empty arrays vs `null`, nested structs, optional fields)

**Runtime:** ~2 seconds (in-process HTTP, no browser)

### Level 2: Playwright E2E — Game Lifecycle (~30s)

**Purpose:** Validate the full UI workflow from session creation through Night 2, asserting API state at each step.

**Approach:**
- Single Playwright browser context
- Walk through the complete game lifecycle:
  1. Create session
  2. Create game, select script
  3. Add players, assign characters
  4. Set demon bluffs
  5. Enter Night 1 — complete all night actions with sub-action checkmarks
  6. Advance to Night 2 — verify Night 1 history saved
- After each major step, make a direct HTTP call to `GET /api/sessions/{id}/games/{gid}` and assert the API state matches expectations
- Validates: UI rendering, dialog interactions, localStorage ↔ API consistency, night flashcard flow

**What it catches:**
- UI bugs that prevent state from reaching the API
- localStorage/API state divergence
- Dialog/modal interaction issues (MUI dialog quirks)
- Night phase progression bugs

**Runtime:** ~30 seconds (single browser, sequential steps)

### Level 3: Playwright E2E — Cross-Device Sync (~60s)

**Purpose:** Validate that changes on one device appear on the other via SSE sync.

**Approach:**
- Two **isolated browser contexts** (separate localStorage, separate cookies) viewing the same game
- Context A makes changes, Context B observes them arriving via SSE within ~2 seconds:
  1. **Player sync** — A adds a player → B sees the player appear
  2. **Token sync** — A adds a token to a player → B sees the token
  3. **Bluff sync** — A sets demon bluffs → B sees bluffs update
  4. **Night completion sync** — A completes Night 1 → B sees night history
  5. **Bidirectional** — B makes a change → A sees it (not just one-way)
- Assert no **self-echo** — when A pushes, A's state doesn't flicker or revert
- Assert **state completeness** — GET the game via API after each sync and verify all fields present

**What it catches:**
- SSE self-echo overwriting local state
- Cross-device data loss (fields present on A but missing on B)
- Race conditions between push and SSE-triggered pull
- SSE reconnection failures

**Runtime:** ~60 seconds (two browser contexts, SSE wait times)

---

## 3. Task List

### Phase 1: Go Model Roundtrip Tests

- [ ] Create `API/internal/handlers/roundtrip_test.go` — test file for model roundtrip tests
- [ ] Build `makeMaximalGame()` helper — constructs a game with every field populated (all character types, tokens, bluffs, night history, selections, sub-actions, choices)
- [ ] Build `makeMaximalSession()` helper — constructs a session with all session-level fields populated
- [ ] Write `TestGameRoundtrip` — PUT maximal game, GET back, deep-compare all fields
- [ ] Write `TestSessionRoundtrip` — PUT maximal session, GET back, deep-compare all fields
- [ ] Write `TestPartialGameRoundtrip` — PUT game with optional fields omitted, GET back, verify no extra fields appear and no panic
- [ ] Write `TestEmptyCollections` — verify empty arrays survive roundtrip as `[]` not `null`
- [ ] Verify all roundtrip tests pass: `cd API && go test ./internal/handlers/ -run Roundtrip -v`

### Phase 2: Playwright Setup & Configuration

- [ ] Add Playwright as a dev dependency in `UI/`: `npm install -D @playwright/test`
- [ ] Install Playwright browsers: `npx playwright install --with-deps chromium`
- [ ] Create `UI/playwright.config.ts` with base URL `http://localhost:5173`, Chromium-only, and web server command
- [ ] Create `UI/e2e/` directory for E2E test files
- [ ] Create `UI/e2e/helpers/` directory for shared test utilities
- [ ] Create `UI/e2e/helpers/api.ts` — direct HTTP helpers for asserting API state (`getGame()`, `getSession()`, `putGame()`)
- [ ] Create `UI/e2e/helpers/navigation.ts` — page object helpers for common UI flows (create session, create game, add player, etc.)
- [ ] Add `test:e2e` script to `UI/package.json`: `"test:e2e": "playwright test"`
- [ ] Add `test:e2e:ui` script for interactive Playwright UI mode
- [ ] Verify Playwright runs a trivial smoke test against the dev server

### Phase 3: Game Lifecycle E2E Tests (Level 2)

- [ ] Create `UI/e2e/game-lifecycle.spec.ts`
- [ ] Test: Create session → verify session exists in API
- [ ] Test: Create game with script → verify game and script in API
- [ ] Test: Add players and assign characters → verify player list in API
- [ ] Test: Set demon bluffs → verify bluffs in API state
- [ ] Test: Enter Night 1, complete sub-actions → verify night action state in API
- [ ] Test: Complete Night 1, advance to Night 2 → verify night history saved in API
- [ ] Test: Verify localStorage and API state match at each step
- [ ] All lifecycle tests pass: `cd UI && npx playwright test game-lifecycle`

### Phase 4: Cross-Device Sync E2E Tests (Level 3)

- [ ] Create `UI/e2e/cross-device-sync.spec.ts`
- [ ] Create helper for dual-context setup: two isolated browser contexts sharing the same game URL
- [ ] Test: Player added on Context A appears on Context B within 3 seconds
- [ ] Test: Token change on Context A reflects on Context B
- [ ] Test: Demon bluffs set on Context A appear on Context B
- [ ] Test: Night completion on Context A → night history visible on Context B
- [ ] Test: Bidirectional sync — Context B makes a change, Context A sees it
- [ ] Test: No self-echo — after Context A pushes, Context A's state doesn't flicker or revert
- [ ] Test: SSE reconnection — simulate network drop, verify sync resumes
- [ ] All sync tests pass: `cd UI && npx playwright test cross-device-sync`

### Phase 5: Documentation & CI Integration

- [ ] Add Playwright E2E section to `docs/testing.md`
- [ ] Document the three testing levels and when to run each
- [ ] Add `test:integration` script to root `package.json` combining Go roundtrip + Playwright E2E
- [ ] Update this milestone doc with `## Status: ✅ Complete`
- [ ] Update `docs/progress.md` — add M34 row, update verification stats
- [ ] Update `AGENTS.md` — test stats if counts changed

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `API/internal/handlers/roundtrip_test.go` | Go model roundtrip tests — maximal PUT/GET/compare for games and sessions |
| `UI/playwright.config.ts` | Playwright configuration — Chromium-only, dev server integration |
| `UI/e2e/game-lifecycle.spec.ts` | Level 2 E2E — full game lifecycle with API state assertions |
| `UI/e2e/cross-device-sync.spec.ts` | Level 3 E2E — dual browser contexts testing SSE sync |
| `UI/e2e/helpers/api.ts` | Direct HTTP helpers for API state assertions in E2E tests |
| `UI/e2e/helpers/navigation.ts` | Page object helpers for common UI navigation flows |

### Modified Files

| File | Changes |
|------|---------|
| `UI/package.json` | Add `@playwright/test` dev dependency, `test:e2e` and `test:e2e:ui` scripts |
| `package.json` (root) | Add `test:integration` script combining Go roundtrip + Playwright E2E |
| `docs/testing.md` | Add Playwright E2E section documenting three testing levels |
| `docs/progress.md` | Add M34 row to milestone table |
| `AGENTS.md` | Update test stats if counts changed |

---

## 5. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| `@playwright/test` | Dev dependency (UI) | E2E testing framework — Chromium browser only (no Firefox/WebKit needed) |
| Playwright Chromium browser | Dev tool | Installed via `npx playwright install chromium` |

No production dependencies added. Playwright is dev-only and does not affect bundle size.

---

## 6. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| **Playwright tests are flaky due to SSE timing** | High | Use Playwright's `expect().toPass({ timeout })` with generous timeouts for SSE-dependent assertions; avoid hardcoded `waitForTimeout()` |
| **Maximal game fixture drifts out of sync with types** | Medium | Generate the fixture from TypeScript types where possible; add a CI-like check that the fixture includes all fields from `types/index.ts` |
| **E2E tests slow down development workflow** | Medium | Keep E2E tests separate from unit tests (`test:e2e` vs `test`); don't run in pre-commit hooks; run in pre-push or manually |
| **Dual browser context resource usage** | Low | Chromium-only (no multi-browser matrix); reuse contexts where possible |
| **Go roundtrip tests don't catch TypeScript-side issues** | Low | Level 2 and Level 3 tests cover the TypeScript side; Go roundtrips specifically target the Go model gap |
| **Playwright browser install fails in some environments** | Low | Document manual install steps; pin Playwright version for reproducibility |

---

## 7. Acceptance Criteria

- [ ] **Go roundtrip tests pass** — `cd API && go test ./internal/handlers/ -run Roundtrip -v` exits 0
- [ ] **Maximal game fixture covers every field** — no field in `types/index.ts` Game/Player/NightAction types is missing from the fixture
- [ ] **Game lifecycle E2E passes** — `cd UI && npx playwright test game-lifecycle` exits 0
- [ ] **Cross-device sync E2E passes** — `cd UI && npx playwright test cross-device-sync` exits 0
- [ ] **No self-echo detected** — sync E2E explicitly asserts that pushing device's state doesn't flicker
- [ ] **SSE reconnection works** — sync E2E includes a reconnection test
- [ ] **Tests run in < 2 minutes total** — Go roundtrip (~2s) + lifecycle (~30s) + sync (~60s)
- [ ] **Existing unit tests still pass** — `cd UI && npm test` exits 0
- [ ] **0 TypeScript errors** — `cd UI && npx tsc --noEmit` exits 0
- [ ] **0 ESLint errors** — `cd UI && npx eslint .` exits 0
- [ ] **Documentation updated** — testing.md, progress.md, AGENTS.md reflect new test infrastructure

---

## 8. Non-Goals (Out of Scope)

- **Visual regression testing** — screenshot comparisons are a separate concern; this milestone focuses on data integrity
- **Performance/load testing** — stress testing SSE with many connections is not needed for a single-user app
- **Cross-browser testing** — Chromium-only is sufficient; the app is mobile-first PWA
- **CI/CD pipeline** — this project uses local git hooks only; no GitHub Actions integration
- **Testing the API in isolation** — Go roundtrip tests use the real HTTP handlers but don't test the Go API as a standalone service
- **Mocking SSE in unit tests** — Level 3 tests use real SSE connections; unit-level SSE mocking is already covered by `useSseSync.test.ts`
