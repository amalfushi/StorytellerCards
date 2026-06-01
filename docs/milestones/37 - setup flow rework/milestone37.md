# Milestone 37 — Pre-Game Setup Flow Rework

## Status: ✅ Complete

Completed: 2026-06-01

### What shipped

- Option B — Seat Lock + Quick Reseat — delivered as the M37 implementation.
- Added a reusable two-step `ReseatTool` with setup and in-game entry points.
- Added `ShiftSeatsDialog` for late arrivals, whole-table rotation, and inserting empty seats.
- Added game/session seat swap, shift, and insert actions with character-bound state moving with players.
- Added a default-on "Reuse last seating" toggle when creating another game in a session.
- Added unit coverage and Storybook interaction stories for the new tools.

### Decision

Option B was selected because it is the lowest-risk change that directly targets the reported pain: seats changing at setup time or during play. It preserves the current setup flow, avoids a larger data-model/UI rewrite, and does not preclude Option C later if the visual seating canvas becomes worthwhile.

#### Out of scope (deferred)

- Option A — Seat-Free First, Snap Later.
- Option C — Photo + Drag Seating.

---

### Summary

Rework the pre-game setup flow (player names → seat assignment → character selection → character-to-player assignment) to remove the friction that slows down starting a live game, especially when players don't sit in pre-set seats or seating changes between games.

The chosen approach was Option B — Seat Lock + Quick Reseat.

---

> **Goal:** Get from "everyone is at the table" to "Night 1 begins" with as few storyteller taps as possible, even when the table seating is messy or has changed since the last game.

---

## 1. Problem Statement

Feedback from the live "Whose Cult Is It Anyway?" game:

> The player names → player seat assignment → characters in the current game → character-to-player assignment is still a very clunky flow. It works if you understand how the flow is intended, but even then is still a bit cumbersome / clunky. Small problems like players not sitting in the seats set up beforehand or changes in seating between games really slows down getting the game started.

### Current flow (verified in code)

1. **`SessionSetupPage`** — default-player list per session, drag-sortable, name fields. Players are seats `{ seat, playerName }` baked at session level and copied to each game.
2. **`GameViewPage` → `SetupChecklist`** — game-level guardrails (script selected, characters chosen, etc.).
3. **`CharacterSelection`** — pick the character set for this game from the script.
4. **`CharacterAssignmentDialog`** — assign each character to a player via tap-a-chip / dropdown / shuffle.

### Pain points

- Players physically don't sit in their pre-set seats; reseating mid-setup requires editing the player list, which cascades through the flow.
- Late arrivals or player swaps between games (very common) cascade through the same flow.
- The flow assumes seats are determined *before* characters; reality is the opposite — players grab seats based on what's open when they arrive.

---

## 2. Three options (decide at M37 planning)

### Option A — "Seat-Free First, Snap Later" (incremental)

Drop seat numbers entirely from the early flow. Assign characters to *players* by name, then run a single "go around the table" step where the ST taps each player in physical-clockwise order to confirm seat positions.

**Pros:**
- Smallest code change — reorders the existing flow without restructuring data
- Mirrors the real-world flow: arrive → grab character → take whatever seat

**Cons:**
- "Go around the table" step is a new screen
- ST still has to physically walk around or hand the device around

**Effort:** Small.

### Option B — "Seat Lock + Quick Reseat" (incremental)

Keep the seat-first order, but add a global "Reseat" tool that lets the ST tap two players to swap seats from anywhere — TownSquare, SetupChecklist, NightFlashcard. Also adds a one-tap "shift everyone N seats clockwise" for late arrivals.

**Pros:**
- Targets the actual reported pain (seat changes) without flow restructure
- Works during the game as well as at setup

**Cons:**
- Doesn't address the root cause (the setup flow itself)
- One more global tool to discover and remember

**Effort:** Small.

### Option C — "Photo + Drag Seating" (clean slate)

Replace the player-list form with a circular "Town Square" canvas that the ST can drag player chips onto in any order. ST taps an empty seat, picks a player from a roster (or types a new name), and the visual matches the real table. Characters get assigned the same way once seats are filled.

**Pros:**
- 1:1 with the physical table
- Reseating is just dragging chips
- Late arrivals: drag a new chip into any empty seat
- Naturally extends to "show me the seating from last game" recall

**Cons:**
- Larger lift — new canvas, drag-and-drop, new mental model
- Risk of looking pretty but being slower to operate than the current form

**Effort:** Medium-Large.

### Recommendation (subject to M37 planning discussion)

Start with **Option B** (low risk, high reward, doesn't preclude C later) and revisit C if Option B doesn't fully address the pain.

---

## 3. Task List (placeholder — refined at M37 planning)

- [x] Decision: Option A, B, or C (or a hybrid)
- [x] Design review of the chosen flow
- [x] Data model changes (if any) — append-only on `types/index.ts` and `GameContext.tsx` per AGENTS.md conflict avoidance
- [x] Implementation
- [x] Tests (unit + Storybook play() interactions per AGENTS.md testing policy)
- [x] Migration path for existing sessions/games
- [x] Documentation: this `milestone37.md` updated, `docs/progress.md` row, `AGENTS.md` stats if test count changes

---

## 4. Files Affected (preliminary, depends on chosen option)

| File | Likely change |
|---|---|
| `UI/src/pages/SessionSetupPage.tsx` | Reorder or replace setup flow |
| `UI/src/components/Setup/SetupChecklist.tsx` | Add "reseat" entry or remove seat step depending on option |
| `UI/src/components/TownSquare/TownSquareLayout.tsx` | Inline reseat affordance (Option B/C) |
| `UI/src/context/GameContext.tsx` | New reducer actions for swap/shift (append-only) |
| `UI/src/types/index.ts` | New types if Option C canvas state needed (append-only) |
| `docs/progress.md` | Append M37 row |

---

## 5. Out of Scope

- Online seat-claim / players-claim-their-own-seat (no per-player auth)
- Voice or QR-based player join

---

## 6. Acceptance Criteria (preliminary)

- [x] A late arrival can be added and seated in **under 3 taps**
- [x] A two-player seat swap mid-setup is **one gesture** (drag-and-drop or tap-tap)
- [x] Restarting a game with the same group reuses the last seating with one tap
- [x] No regression in the existing happy path (default players seated in order)
- [x] Full test suite passes; no new lint suppressions per AGENTS.md
