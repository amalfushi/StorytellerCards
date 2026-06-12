# Milestone 41 — Seating Model Integration (Production)

## Status: ✅ Complete

**Completion date:** 2026-06-08

**Summary:** Production migrated to the M40-proven seating + game-setup data
model in one cut. `PlayerSeat` and `Session.defaultPlayers` are gone;
`Session.template` + `Session.players` + per-game `slots` / `participants` /
`playerState` / `playerCountOverride` are everywhere. The disposable
`/playground/m40` route + page + reducer are deleted. Spacer / storyteller
slots render in the town square with display seat numbers 1..N skipping
non-seat slots. Propagation toggle (template / other games) is sticky on the
session and applies to in-game seat assign / remove / move. Character
assignment is decoupled from seating via `playerCountOverride`. All consumer
components (TownSquare, PlayerList, Night, Setup, CharacterAssignment, Night
History, pages) and their tests / stories were migrated to the new shape.

**Key evidence:** 50+ source files migrated, all tests rewritten, 4154
unit + 226 storybook tests pass, tsc + eslint clean.

---

> **Scope:** Retire the M40 playground (`/playground/m40`) and replace the production
> seating + game-setup data model and UI with the shape proven there. This is the
> follow-up milestone called out by `docs/milestones/40 - seating template rework/integration-plan.md`.

---

## 1. Problem Statement

M40 proved a new data model (template + players + per-game slots/participants) in a
disposable playground. Production still runs on the old `Session.defaultPlayers` +
`Game.players: PlayerSeat[]` shape, with all the issues called out in
`milestone40.md` §1 (seat-as-identity, name-string matching across games, players ==
seats coupling).

This milestone migrates production to the M40 model in one cut. Per user direction:

- **No phased rollout, no feature flag.** Direct migration. Single-user app, single
  shippable PR.
- **No data migration.** User will start fresh after merge. `localStorage` and
  `API/data/sessions/` are wiped at cutover; persisted-state version bumps so old
  blobs are discarded automatically on load.
- **No backward-compatibility shim** between old client and new server. Server
  contract version (`Session.version` / `Game.version`) bumps.

---

## 2. Approach

Follow the touchpoint map in `docs/milestones/40 - seating template rework/integration-plan.md`
§3. Rip and replace, then rebuild. Order of operations (each step keeps the build green):

1. **Foundation** — Land the new types in `UI/src/types/index.ts` and the matching
   Go structs in `API/internal/models/models.go`. Bump the persisted-state version
   key (`STORAGE_VERSION` or equivalent) so stale blobs discard on load.
2. **Contexts** — Rewrite `SessionContext.tsx` and `GameContext.tsx` to the
   playground reducer shape. Delete obsolete `SWAP_/SHIFT_/INSERT_` actions.
3. **Backend** — Rewrite `API/internal/storage/`, `API/internal/handlers/`, and
   their tests against the new model. Wipe `API/data/sessions/`.
4. **Setup page** — Rebuild `UI/src/pages/SessionSetupPage.tsx` using the
   `PlaygroundM40Page` layout (template + roster + script picker).
5. **Game page + sweep** — Update `UI/src/pages/GameViewPage.tsx` and the ~70
   downstream files that read `player.seat` as identity (see §3.5 of the
   integration plan).
6. **Cleanup** — Delete `ReseatTool`, `ShiftSeatsDialog`, playground page +
   reducer, `/playground/m40` route, HomePage playground link.
7. **Polish** — Apply the four visual-polish items from integration-plan §6:
   template circle min-diameter, spacer visual, storyteller token, propagation
   copy.

---

## 3. Acceptance Criteria

- [x] `Session.defaultPlayers` and `PlayerSeat` are gone from `UI/src/types/index.ts`.
- [x] `Game.slots` + `Game.participants` + `Game.playerCountOverride` are in use.
- [x] `Session.players` + `Session.template` + `Session.propagationDefault` are in use.
- [x] Go structs in `API/internal/models/models.go` mirror the TypeScript shape.
- [x] `addGameToSession` uses the playground's template-snapshot + participant-derive
      logic (no name-string matching).
- [x] `ReseatTool`, `ShiftSeatsDialog`, and their tests/stories are deleted.
- [x] `/playground/m40` route + page + reducer are deleted.
- [x] Seat numbering renders 1..N skipping spacers/storyteller (matches playground).
- [x] Storyteller token is singleton (UI disables ADD when one exists).
- [x] Propagation checkbox lives on `ASSIGN_GAME_SEAT`, `REMOVE_GAME_SLOT`,
      `MOVE_GAME_SLOT`; preference is sticky on the session.
- [x] Character assignment uses `playerCountOverride` when set; otherwise derives
      from `participants.length` (not slot count).
- [x] `API/data/sessions/` is empty on cutover.
- [x] `npm run test` + `npm run test:storybook` pass.
- [x] Coverage thresholds hold (per AGENTS.md baseline).

---

## 4. Task Breakdown

See SQL `todos` table for the live list. High-level phases match §2 above.

---

## 5. Documentation Updates Required at Completion

- [x] `docs/progress.md` — add M41 row, update verification counts.
- [x] `docs/milestones/40 - seating template rework/milestone40.md` — Status row
      notes M41 has integrated and the playground is removed.
- [x] `AGENTS.md` — refresh test/coverage stats only if they drift.

---

## 6. Follow-ups (post-merge fun pack)

After M41 shipped, two small follow-ups were tacked on in branch
`m41/followups`:

### 6.1 Roll for Character (slot-machine overlay)

A new action on `PlayerActionsModal` — "Roll for Character" — opens a
fullscreen slot-machine wheel of every player-assignable character in the
script (Townsfolk → Outsider → Minion → Demon, alpha within type;
Travellers / Fabled / Loric are filtered out so the wheel reveals nothing
about who is in play).

- **Predetermined mode:** when the player already has a character assigned,
  the spin is theatrical only and lands on that character. The storyteller
  is the only person who knows.
- **Random mode:** when no character is assigned, a single random pick from
  the wheel pool is applied via `updatePlayerState` on settle. A storyteller
  warning is rendered explicitly noting that the single-player random pick
  does **not** respect full setup-distribution rules — for proper
  distributions, the bulk randomizer in the assignment pane should be used.
- **Availability:** unconditional from the actions modal (except for
  Travellers, who use a different assignment path). This satisfies the
  "must be available before the game has officially started" requirement
  without adding a separate `Phase.Setup`.

New files:

- `UI/src/components/TownSquare/CharacterWheel.tsx` — imperative
  `spinTo(id)` ref handle, vertical translateY animation, 11 repeats of the
  character strip so the wheel always travels several revolutions before
  settling. Snaps back (no transition) to the centre repeat after each spin
  so the next call can travel either way.
- `UI/src/components/TownSquare/RollForCharacterDialog.tsx` — fullscreen
  Dialog wrapping the wheel. Computes the target id before delegating to
  `spinTo`, surfaces the result card, gates random-branch warnings.
- `*.test.tsx` for both, plus a one-line `onRollForCharacter` prop added to
  `PlayerActionsModal` and wired from `TownSquareTab`.

### 6.2 `npm run dev:tunnel` — public dev URL

A new root script exposes the local UI + API to the public internet via
[`localtunnel`](https://github.com/localtunnel/localtunnel) without any
account or signup:

```
npm run dev:tunnel
```

This runs UI (with `VITE_ALLOW_ALL_HOSTS=1`), API (`go run ./cmd/server`),
and a `localtunnel` process pointed at port 5173 concurrently. Vite's
existing `/api` and `/health` proxies forward to `localhost:3001` on the
same machine, so the API is reachable transparently through the public
`*.loca.lt` URL — no separate tunnel is needed for the backend.

Implementation:

- `package.json` — added `dev:tunnel` script, plus `cross-env` and
  `localtunnel` to `devDependencies`.
- `UI/vite.config.ts` — when `VITE_ALLOW_ALL_HOSTS=1`, sets
  `server.allowedHosts: true` so Vite 7 doesn't reject the tunnel host.
  Local dev (`npm run dev`) is unaffected.

`localtunnel` may prompt visitors for the tunnel-server IP password on
first visit; that's a property of the public service, not the script.

