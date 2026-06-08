# M40 → Production Integration Plan

Notes for the **follow-up milestone** that will retire the M40 playground (`/playground/m40`)
and replace the production seating + game-setup flow with the model proven there.

> Status: **planning only.** No production files were modified during M40. The playground
> lives entirely under `UI/src/pages/PlaygroundM40Page.tsx` and
> `UI/src/pages/playground/m40/*`.

## What M40 proved

1. **First-class players at the session level** (`Session.players: [{ id, name }]`)
   eliminate string-matching fragility when propagating renames and seat moves between
   games.
2. **A discriminated `PgSlot` union (`seat | spacer`)** is enough to express gaps and
   half-circles without affecting player counts or character-assignment logic.
3. **Decoupling participants from seats** (a player can be in `participants` without a
   seated slot, and the storyteller can override `playerCount` to plan for travellers)
   unblocks the workflows that the current model can't express.
4. **Sticky propagation preference + per-action checkbox** keeps the common case (one
   physical room, all games same seating) one-click while still allowing one-off
   per-game seat assignments.
5. **DnD player→seat** drag is small enough to live in the existing `TownSquareLayout`
   without a wholesale UI rebuild — provided the page wraps a `DndContext` and seats
   become `useDroppable` targets.

## Affected production surfaces

The integration milestone needs to touch:

- **Types** (`UI/src/types/index.ts`)
  - Add `Session.players: Player[]`.
  - Change `Session.defaultPlayers` → `Session.template: SeatingTemplate { slots: Slot[] }`
    (discriminated union).
  - Replace `Game.players: PlayerSeat[]` with `Game.slots: Slot[]` (template snapshot)
    + `Game.participants: { playerId, isTraveller }[]` +
    `Game.playerCountOverride: number | null`.
  - `Game.characterAssignments` keys become `playerId`, not seat index.
- **Context / reducers**
  - `SessionContext` gains player CRUD + template editing actions, mirroring the
    playground reducer.
  - `GameContext` gains participant CRUD, `ASSIGN_GAME_SEAT` with propagation,
    `SET_PLAYER_COUNT_OVERRIDE`.
  - `propagationDefault` lives on the session.
- **UI**
  - Setup page: collapse seating template + player roster + script upload into one
    screen (responsive breakpoint for small viewports).
  - Game-setup flow: replace existing seat/character coupling with the playground
    pattern (seat assignment optional, character assignment uses participants).
  - `ReseatTool` / `ShiftSeatsDialog` are obsolete — delete after migration.
  - HomePage: drop the `/playground/m40` button when retiring.
- **Storage**
  - Per user, no migration is needed: start from a fresh session. Add a one-time
    "start fresh" prompt or simply bump the persisted-state version key so old state
    is discarded on load.

## Risks / open questions to settle before starting

- **Seat removal with assigned player** — playground leaves the assignment dangling
  because `REMOVE_TEMPLATE_SLOT` just filters by id. Integration should pick a
  policy: auto-park (move player to roster as unseated) is the lean choice and matches
  vision point #8; a confirm dialog adds friction. Suggest auto-park with an undoable
  snackbar.
- **Travellers vs unseated** — both are valid states. UI should label them distinctly
  ("Unseated" vs "Traveller") so storytellers don't confuse pre-game planning with the
  traveller flow.
- **Mid-game seat changes** — the current `ReseatTool` / `ShiftSeatsDialog` are
  obsolete; deleting them is a separate cleanup pass after the new flow lands.
- **Bulk actions** — "clear all assignments", "copy seating from game X" are nice but
  defer until the base flow is proven in production.
- **EditableText inside draggable** — playground uses
  `PointerSensor` with `activationConstraint: { distance: 4 }` so a click under 4px does
  not start a drag. Verify this still allows in-place rename inside the production list
  components (which may use different click handlers).

## Suggested milestone breakdown

1. **Types + persistence schema bump** — land the new shape behind a feature flag,
   migrate or wipe persisted state, leave UI on old surfaces.
2. **Session-level player + template editing** — rebuild Setup page, ship behind the
   flag.
3. **Game flow rebuild** — participants, seat assignment with propagation, character
   assignment with `playerCountOverride`.
4. **DnD parity** — port the playground's drag-player-onto-seat interaction.
5. **Cleanup** — delete `defaultPlayers`, `ReseatTool`, `ShiftSeatsDialog`,
   `/playground/m40`, M40 docs reference; flip the feature flag default.

## What's **not** carried over

- The playground intentionally skipped slot-reorder DnD (`MOVE_TEMPLATE_SLOT` exists in
  the reducer but no drag surface uses it). Production should add it when porting; the
  reducer action is ready.
- No visual polish was attempted; production keeps the existing MUI / `TownSquareLayout`
  styling.
