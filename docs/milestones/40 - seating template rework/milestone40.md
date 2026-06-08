# Milestone 40 — Seating Template + Player + Game Rework (Playground)

## Status: 🚧 In Progress

> **Scope note:** M40 ships a **disposable playground UI** at `/playground/m40` that
> iterates the data model and storyteller flow in isolation from the production
> `SessionContext` / `GameContext`. Production integration is a deliberate follow-up
> milestone, not part of M40.

---

## 1. Problem Statement

The current Game + Player + Seating + Character-Assignment flow is clunky between games
and has lingering bugs. M37 (Seat Lock + Quick Reseat) and M38/M39 follow-ups improved
the in-game experience but did not address the root cause: **the data model conflates
three different concepts**.

- `Session.defaultPlayers` is a flat list of `{ seat, playerName }` — a seat slot **is**
  a player slot. There is no way to express a gap, a parking lot, or a player who is
  not yet seated.
- `Game.players: PlayerSeat[]` is a snapshot copy of that list. A "player" in Game 1 and
  the same-named "player" in Game 2 are independent strings, so propagating a rename or
  seat change between games requires fragile string-matching heuristics.
- Character assignment role counts are derived from `players.length`, forcing player
  count == seat count. Travellers and pre-game planning don't fit.

Live feedback (continuing from the M37 problem statement): setup is still cumbersome
between back-to-back games, late arrivals require cascading edits, and storytellers
cannot pre-plan a script + character set for a session before the IRL table is settled.

---

## 2. Approach

Build a **disposable playground UI** at `/playground/m40` with:

- A local `useReducer` and its own playground-only types (no coupling to
  `SessionContext`, `GameContext`, or `Session.defaultPlayers`).
- A discoverable button on `HomePage` so the playground is easy to reach for iteration.
- Reuse of existing visual components (`TownSquareLayout`, `PlayerToken`, MUI) so the
  feel matches production.
- No localStorage persistence — the playground is in-memory only and may reset on
  reload. (User is the sole user; no migration concern.)

Once the data model and flow feel right, a separate follow-up milestone integrates the
result into production and deletes the legacy code (`Session.defaultPlayers`,
`ReseatTool`, `ShiftSeatsDialog`).

---

## 3. Decisions (locked)

1. **First-class players** at session level — `players: { id, name }[]`. Seats and games
   reference `playerId`, never name strings.
2. **No localStorage / migration concern** during M40 — sole user, fresh start when
   production integration lands.
3. **Route:** `/playground/m40` with a discoverable button on `HomePage`.
4. **Visual fidelity:** reuse existing visual components (`TownSquareLayout`,
   `PlayerToken`, MUI) so the playground reflects how the real app will feel.
5. **Spacer sizing:** fixed — one spacer = one seat-worth of arc.
6. **Propagation default:** sticky session preference (defaults to *template + all
   games*) with a per-action checkbox that updates the preference.
7. **Worktree convention:** fresh `m40` worktree from `main` per
   [AGENTS.md](../../../AGENTS.md); branch `m40/seating-rework-playground`.

---

## 4. Playground Data Model

```ts
type PlayerId = string;   // uuid
type SlotId   = string;   // uuid
type GameId   = string;   // uuid

interface PgPlayer { id: PlayerId; name: string }

type PgSlot =
  | { kind: "seat";   id: SlotId; playerId: PlayerId | null }
  | { kind: "spacer"; id: SlotId };

interface PgSeatingTemplate { slots: PgSlot[] }

interface PgGame {
  id: GameId;
  name: string;
  slots: PgSlot[];                            // copied from template at creation
  participants: { playerId: PlayerId; isTraveller: boolean }[];
  playerCountOverride: number | null;         // null = derive from participants
  characterAssignments: Record<PlayerId, string /* charId */>;
}

interface PgSession {
  players: PgPlayer[];
  template: PgSeatingTemplate;
  games: PgGame[];
  propagationDefault: { toTemplate: boolean; toOtherGames: boolean };
}
```

Key insight: `participants` (who's in the game) is distinct from seated slots
(`slots[i].playerId`). This is what makes vision points #6, #8, and #9 work cleanly:

- **#6** — Storyteller can assign characters to participants before any seat is filled.
- **#8** — A traveller participant doesn't need a seat (no 1:1 seat-to-player match
  required).
- **#9** — `playerCountOverride` decouples role-count math from seat count, supporting
  pre-planning for travellers.

---

## 5. Task List

- [ ] **Phase 0 — Milestone doc** (this file) before any code.
- [ ] **Phase 1 — Worktree + route scaffold:** `/playground/m40` route added in
      `App.tsx`; HomePage button links to it.
- [ ] **Phase 2 — Playground reducer + types:** local `useReducer` covering the data
      model above; unit tests for reducer actions.
- [ ] **Phase 3 — Seating template editor:** `Add Seat` / `Add Spacer` center buttons,
      render through `TownSquareLayout`, drag-to-reorder slots.
- [ ] **Phase 4 — Player roster panel + parking lot** for unseated players.
- [ ] **Phase 5 — Game list:** create-game copies the template snapshot; select active
      game; rename / delete.
- [ ] **Phase 6 — Seat assignment in a game** with the sticky propagation checkbox
      (template + other games).
- [ ] **Phase 7 — Character assignment with `playerCountOverride`:** Player Count input
      decoupled from seat count; randomize-character only seated participants.
- [ ] **Phase 8 — DnD polish:** drag a player from roster onto a seat; drag spacers to
      reposition.
- [ ] **Phase 9 — Apply-to-all-games toggle** for template seat additions made *after*
      games already exist.
- [ ] **Phase 10 — Integration writeup:** notes for the follow-up milestone that will
      migrate this into production.

---

## 6. Testing

- **Unit tests** for the playground reducer (Vitest) — every action covered, including
  the propagation matrix.
- **Component tests** for the template editor and game seat assignment with stubbed
  reducer state.
- **No new Playwright E2E** during M40 — the playground is intentionally throwaway.
- Production test suites must remain green (`cd UI; npm test` shows the M39 baseline of
  4260 tests across 84 files).

---

## 7. Acceptance Criteria

- Visiting `/playground/m40` (or clicking the HomePage button) opens the playground
  with no impact on existing session/game state.
- Storyteller can build a seating template with seats + spacers, with at least one
  reorder interaction.
- Storyteller can add players to the session roster independently of the seating
  template.
- Creating a new game inside the playground snapshots the current template and
  inherits assigned players where present.
- Storyteller can change a seat assignment from inside a game and have the change
  propagate to template + other games when the sticky checkbox is on (and stay local
  when off).
- Storyteller can assign characters to participants whose seat is `null`.
- `playerCountOverride` decouples the role-count math from seat count, with the input
  defaulting to seat count.
- All M39 production tests still pass.
- No lint suppressions added.

---

## 8. Out of Scope (deferred)

- Production integration of the playground data model — separate follow-up milestone.
- localStorage migration of existing sessions/games.
- Deletion of `defaultPlayers`, `ReseatTool`, `ShiftSeatsDialog`, related actions.
- Visual polish beyond reusing existing components.
- Bulk actions ("clear all assignments", "copy seating from game X") — revisit during
  build if the base flow needs them.
- Mid-game seat changes inside the playground (the production tools already cover this
  case; the playground focuses on setup).
