# Milestone 41 — Seating Model Integration (Production)

## Status: 🚧 In Progress

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

- [ ] `Session.defaultPlayers` and `PlayerSeat` are gone from `UI/src/types/index.ts`.
- [ ] `Game.slots` + `Game.participants` + `Game.playerCountOverride` are in use.
- [ ] `Session.players` + `Session.template` + `Session.propagationDefault` are in use.
- [ ] Go structs in `API/internal/models/models.go` mirror the TypeScript shape.
- [ ] `addGameToSession` uses the playground's template-snapshot + participant-derive
      logic (no name-string matching).
- [ ] `ReseatTool`, `ShiftSeatsDialog`, and their tests/stories are deleted.
- [ ] `/playground/m40` route + page + reducer are deleted.
- [ ] Seat numbering renders 1..N skipping spacers/storyteller (matches playground).
- [ ] Storyteller token is singleton (UI disables ADD when one exists).
- [ ] Propagation checkbox lives on `ASSIGN_GAME_SEAT`, `REMOVE_GAME_SLOT`,
      `MOVE_GAME_SLOT`; preference is sticky on the session.
- [ ] Character assignment uses `playerCountOverride` when set; otherwise derives
      from `participants.length` (not slot count).
- [ ] `API/data/sessions/` is empty on cutover.
- [ ] `npm run test:all` + `npm run test:e2e:journey` pass.
- [ ] Coverage thresholds hold (per AGENTS.md baseline).

---

## 4. Task Breakdown

See SQL `todos` table for the live list. High-level phases match §2 above.

---

## 5. Documentation Updates Required at Completion

- [ ] `docs/progress.md` — add M41 row, update verification counts.
- [ ] `docs/milestones/40 - seating template rework/milestone40.md` — Status row
      notes M41 has integrated and the playground is removed.
- [ ] `AGENTS.md` — refresh test/coverage stats only if they drift.
