# M40 → Production Integration Plan

This document is the concrete roadmap for the **follow-up milestone** that retires the
M40 playground (`/playground/m40`) and replaces the production seating + game-setup
flow with the model proven there.

> Status: **planning only.** No production files were modified during M40. The playground
> lives entirely under `UI/src/pages/PlaygroundM40Page.tsx` and `UI/src/pages/playground/m40/*`.
> Reference reducer: `UI/src/pages/playground/m40/reducer.ts`. Reference types:
> `UI/src/pages/playground/m40/types.ts`.

---

## 1. What M40 proved

(Updated after Phase 11 round-1 feedback + `MOVE_GAME_SLOT` propagation.)

1. **First-class players at the session level** (`Session.players: Player[]` keyed by
   `playerId: string`) eliminate the name-string matching that `addGameToSession`
   currently relies on to carry seat assignments between games
   (see `SessionContext.tsx:433–498`).
2. **A discriminated `Slot` union with three kinds** — `seat | spacer | storyteller` —
   expresses gaps, half-circles, and the storyteller's orientation marker without
   inflating player counts. Storyteller is enforced as a singleton at reducer level
   (the `ADD_TEMPLATE_STORYTELLER` button is disabled once one exists).
3. **Visible seats are renumbered after each render**, skipping spacer/storyteller
   kinds, so 9 seats + 2 spacers display 1–9. The reducer never persists a seat number;
   numbering is derived from slot order at view time.
4. **Decoupling participants from seats** — a player can be in `participants` without
   a seated slot, and a storyteller can override `playerCount` to plan for travellers —
   unblocks pre-game character assignment and the traveller flow.
5. **Sticky propagation preference + per-action checkbox** keeps the common case (one
   physical room, all games same seating) one-click while still allowing per-game
   overrides. The preference applies to **three** action families today:
   `ASSIGN_GAME_SEAT`, `REMOVE_GAME_SLOT`, and `MOVE_GAME_SLOT`.
6. **DnD inside the template and inside a game** is feasible without a wholesale UI
   rewrite — `useSortable` on slot cards + a single `DndContext` per surface is enough.
   `PointerSensor` with `activationConstraint.distance: 4` keeps EditableText click-to-rename
   from triggering a drag.

---

## 2. Target data model

Copied verbatim from `UI/src/pages/playground/m40/types.ts` — the field shapes the
production model should adopt. Names in production are suggested in **bold** where they
differ from the playground prefix-stripped form.

```ts
type PlayerId = string;   // uuid (was: implicit seat number)
type SlotId   = string;   // uuid
type GameId   = string;   // unchanged

interface Player { id: PlayerId; name: string }

type Slot =
  | { kind: "seat";        id: SlotId; playerId: PlayerId | null }
  | { kind: "spacer";      id: SlotId }
  | { kind: "storyteller"; id: SlotId };

interface SeatingTemplate { slots: Slot[] }

interface PropagationPreference {
  toTemplate: boolean;
  toOtherGames: boolean;
}

interface Game {
  id: GameId;
  // existing: scriptId, currentDay, currentPhase, isFirstNight, nightHistory,
  //           activeFabled, activeLoric, inPlayCharacterIds, demonBluffs,
  //           lunaticBluffs, playerBluffs, customPlayerMessages, version

  // NEW shape:
  slots: Slot[];                                              // template snapshot at creation
  participants: { playerId: PlayerId; isTraveller: boolean }[];
  playerCountOverride: number | null;                          // null ⇒ derive from participants
  characterAssignments: Record<PlayerId, string /* charId */>; // keyed by playerId, not seat

  // existing per-player state migrates to playerId-keyed records:
  alive:               Record<PlayerId, boolean>;
  ghostVoteUsed:       Record<PlayerId, boolean>;
  visibleAlignment:    Record<PlayerId, Alignment>;
  actualAlignment:     Record<PlayerId, Alignment>;
  startingAlignment:   Record<PlayerId, Alignment>;
  activeReminders:     Record<PlayerId, string[]>;
  tokens:              Record<PlayerId, PlayerToken[]>;
  apparentCharacterId: Record<PlayerId, string>;
}

interface Session {
  id: string;
  name: string;
  createdAt: string;
  defaultScriptId: string;
  gameIds: string[];
  version: number;
  updatedAt?: string;

  // NEW:
  players: Player[];                       // replaces defaultPlayers
  template: SeatingTemplate;               // replaces the implicit "seats == players" coupling
  propagationDefault: PropagationPreference;
}
```

### Field-by-field rename from current types (`UI/src/types/index.ts`)

| Current (production) | Target | Notes |
| --- | --- | --- |
| `PlayerSeat.seat: number` (identity) | `Slot.id: SlotId` + `Slot.playerId \| null` | seat number becomes derived from slot order |
| `PlayerSeat.playerName: string` | `Player.name: string` (one level up) | one canonical record per player |
| `PlayerSeat.{characterId, alive, ghostVoteUsed, …}` | `Game.{characterAssignments, alive, …}: Record<PlayerId, T>` | per-player state lifts off the seat row |
| `Game.players: PlayerSeat[]` | `Game.slots: Slot[]` + `Game.participants: …[]` | two distinct concepts |
| `Session.defaultPlayers: PlayerTemplate[]` | `Session.players: Player[]` + `Session.template: SeatingTemplate` | players and seating are now orthogonal |
| (none) | `Session.propagationDefault` | sticky preference for seat/move/remove propagation |
| (none) | `Game.playerCountOverride: number \| null` | storyteller may plan for travellers ahead of seating |

---

## 3. Production touchpoints (concrete)

### 3.1 Frontend types — `UI/src/types/index.ts`

Rewrite three exported interfaces. Specific lines to replace in the current file:

- **Lines 283–305 — `PlayerSeat`**: rename to `LegacyPlayerSeat` if needed for staged
  migration, otherwise delete. Replace with the `Slot` discriminated union.
- **Lines 312–339 — `Game`**: swap `players: PlayerSeat[]` for the `slots` + `participants`
  + `playerCountOverride` + record-shaped per-player fields above. `characterAssignments`
  re-keys from seat → `playerId`.
- **Lines 346–357 — `Session`**: drop `defaultPlayers`; add `players`, `template`,
  `propagationDefault`.

### 3.2 Frontend contexts

#### `UI/src/context/SessionContext.tsx` (currently 562 lines)

**Delete** these actions and their reducer cases:

- `SWAP_SESSION_PLAYERS`
- `SHIFT_SESSION_PLAYERS`
- `INSERT_SESSION_PLAYER_SLOT`
- any action that takes `seat: number` as the identity for a session-level player

(See the full action union, lines 53–79.)

**Add** these actions (mirror playground reducer; same field shapes):

- Player CRUD: `ADD_PLAYER`, `RENAME_PLAYER`, `REMOVE_PLAYER`
- Template edits: `ADD_TEMPLATE_SEAT`, `ADD_TEMPLATE_SPACER`, `ADD_TEMPLATE_STORYTELLER`,
  `REMOVE_TEMPLATE_SLOT`, `MOVE_TEMPLATE_SLOT`, `ASSIGN_TEMPLATE_SEAT`
- Preference: `SET_PROPAGATION_DEFAULT`

**Rewrite** `addGameToSession` (lines 433–498). Current behaviour reads the previous
game's `localStorage` blob and matches players by name + seat. Replacement:

```
addGameToSession(sessionId):
  template = session.template
  slotIdMap = mintFreshIds(template.slots)
  newGame.slots = template.slots.map(s => ({ ...s, id: slotIdMap[s.id] }))
  newGame.participants = template.slots
    .filter(s => s.kind === "seat" && s.playerId)
    .map(s => ({ playerId: s.playerId!, isTraveller: false }))
  newGame.playerCountOverride = null
  newGame.characterAssignments = {}
```

That is exactly the playground `CREATE_GAME` case — copy it into production.

#### `UI/src/context/GameContext.tsx` (currently 1261 lines)

**Delete** these actions:

- `SWAP_PLAYER_SEATS`
- `SHIFT_PLAYER_SEATS`
- `INSERT_EMPTY_SEAT`
- any helper keyed off `players[i].seat` for identity (search: `players.find(p => p.seat ===`)

**Rewrite** these actions to key off `playerId` (or `slotId` where appropriate):

- `addPlayer` / `removePlayer` / `renamePlayer` — operate on the session-level
  `Player[]` via the session context, then add/remove a `participant` entry.
- `setCharacter` / `assignCharacter` — `characterAssignments[playerId] = charId`.
- `setApparentCharacter`, `setAlive`, `setGhostVoteUsed`, `setVisibleAlignment`,
  `setActualAlignment`, `setStartingAlignment`, `addReminder`, `removeReminder`,
  `addToken`, `removeToken` — all become `record[playerId] = …` updates.
- Setup-power seeding (`getSetupPowersForScript`) — currently iterates seats; switch
  to iterating `participants`.

**Add** these actions (mirror playground reducer):

- `ADD_PARTICIPANT`, `REMOVE_PARTICIPANT`, `SET_PARTICIPANT_TRAVELLER`
- `ASSIGN_GAME_SEAT`, `REMOVE_GAME_SLOT`, `MOVE_GAME_SLOT` — **all three accept an
  optional `propagation?: Partial<PropagationPreference>` and default to the session's
  preference.** Side effects ripple to `session.template` and other games per the
  playground reducer's pattern.
- `SET_PLAYER_COUNT_OVERRIDE`

### 3.3 Files to delete

These components are obsolete once propagation-aware slot actions land. Delete with tests
and stories:

- `UI/src/components/common/ReseatTool.tsx`
- `UI/src/components/common/ReseatTool.test.tsx`
- `UI/src/components/common/ReseatTool.stories.tsx`
- `UI/src/components/common/ShiftSeatsDialog.tsx`
- `UI/src/components/common/ShiftSeatsDialog.test.tsx`
- `UI/src/components/common/ShiftSeatsDialog.stories.tsx`

### 3.4 Pages to rebuild

- **`UI/src/pages/SessionSetupPage.tsx` (601 lines)** — references `defaultPlayers` at
  L93 and L143, calls `addGameToSession` at L266. Replace with the M40 playground page
  shape: template circle + player roster + script picker on one screen, responsive
  breakpoint to stack on small viewports.
- **`UI/src/pages/GameViewPage.tsx` (764 lines)** — heaviest consumer of seat-as-identity.
  Systematic migration: every `player.seat` reference becomes `player.id` (where
  `player` is a participant) or `slot.id` (where it's a UI position). Audit
  `GameViewPage`-local helper functions for the same.
- **`UI/src/pages/HomePage.tsx`** — drop the `/playground/m40` link once retired.

### 3.5 Seat-keyed callers that need migration

The codebase has **~70 files** referencing `PlayerSeat`, `defaultPlayers`, or
`seat: number` as identity. The migration is mechanical but large. Directories to walk
systematically:

- `UI/src/components/TownSquare/` — `PlayerToken.tsx`, `PlayerActionsModal.tsx`,
  `TownSquareLayout.tsx`, `TownSquareTab.tsx`, `AddPlayerDialog.tsx`, `TokenManager.tsx`,
  `PlayerQuickActions.tsx`
- `UI/src/components/PlayerList/` — `PlayerRow.tsx`, `PlayerListTab.tsx`,
  `PlayerEditDialog.tsx`
- `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx`
- `UI/src/components/Setup/` — `SetupChecklist.tsx`, `buildChecklistItems.ts`,
  `ApparentCharacterDialog.tsx`
- `UI/src/components/NightPhase/*` — flashcards, drawers, choice selector
- `UI/src/components/NightOrder/*`
- `UI/src/hooks/useNightOrder.ts`
- `UI/src/utils/` — `characterAssignment.ts`, `livingNeighbors.ts`,
  `nightHistoryUtils.ts`, `nightOrderFilter.ts`, `seatingConstraints.ts`

Pattern: anywhere code reads `players[i].seat` as an id, change it to `players[i].id`
(or pass the slot id when the index needs to map back to the seating layout).

### 3.6 Backend (Go API)

Production has a server (`API/`) that persists sessions and games to disk and serves an
SSE sync stream. The model migration is mirrored server-side.

- **`API/internal/models/models.go`** — three structs change:
  - L102–115 `PlayerSeat` → delete and replace with `Slot` (discriminated, plus
    per-player state lifts into game-level maps), **or** keep `PlayerSeat`'s
    per-player fields hanging off the participant rather than the seat. The frontend
    target is participant-centric; align the API the same way.
  - L135–153 `Game.Players []PlayerSeat` → `Game.Slots []Slot` +
    `Game.Participants []Participant` + per-player `map[PlayerID]…` fields.
  - L159–172 `Session.DefaultPlayers []PlayerTemplate` → delete; add
    `Session.Players []Player` + `Session.Template SeatingTemplate` +
    `Session.PropagationDefault PropagationPreference`.
- **`API/internal/storage/`** — JSON file shape changes; the test file
  `filestore_test.go` references the old shape and will fail until updated.
- **`API/internal/handlers/`** — `games_test.go`, `model_roundtrip_test.go`,
  `sync_integration_test.go` all assert the old shape; rewrite alongside the model
  change.
- **`API/data/sessions/*`** — existing on-disk session/game JSON is incompatible. Per
  user direction (Section 5), wipe `API/data/sessions/` as part of the cutover; no
  migration script.

### 3.7 Sync layer

- `UI/src/hooks/useApiSync.ts`
- `UI/src/hooks/useSseSync.ts`

These hooks round-trip the session/game JSON between client and server. They need no
logic change but the embedded types come from `UI/src/types/index.ts`, so they update
implicitly. The **server contract version** in `Session.version` / `Game.version` should
be bumped so an old client connecting to a new server (or vice versa) refuses to load
rather than partially deserialising.

---

## 4. Persistence

- **Client localStorage keys** stay the same (`storyteller-session-*`,
  `storyteller-game-*`, `storyteller-setup-checklist-*`) so existing app code that reads
  them keeps compiling. The **shape** persisted under those keys changes, with no
  migration: bump the persisted-state version key and discard non-matching blobs on
  load.
- **Server JSON files** at `API/data/sessions/{sessionId}/games/{gameId}.json` change
  shape; wipe the directory at cutover.
- User has explicitly confirmed: **no migration; start fresh on the new shape**.

---

## 5. Decisions reaffirmed for the integration milestone

| Question | Decision |
| --- | --- |
| Migrate existing sessions/games? | **No.** Wipe `localStorage` and `API/data/sessions/` at cutover. Start fresh. |
| `localStorage` key names | Keep current names; bump persisted-state version key so old blobs are discarded on load. |
| Seat removal with an assigned player | Auto-park: leave the player in `session.players` but unset their slot. (Playground does this by virtue of slot-level state.) |
| Storyteller marker count | Singleton. The reducer/UI disables `ADD_TEMPLATE_STORYTELLER` when one already exists. |
| Propagation default | Sticky per session; defaults to `{ toTemplate: true, toOtherGames: true }`. Each action exposes the checkbox; checking it updates `Session.propagationDefault`. |
| Travellers vs unseated | Distinct UI labels. A participant with `isTraveller: true` is a traveller; a participant with no slot is "unseated"; the two states can coexist. |
| Backward-compat (old client ↔ new server) | Don't try. Bump the server contract version; refuse to load mismatched blobs. |

---

## 6. Visual-polish items called out during M40

These are **not** carried over from the playground — production needs them addressed:

- **Template circle is too small.** In the M40 playground, when several games + the
  template render on the same screen, the template circle shrinks so much that dnd-kit
  drag handles get visually covered by neighbouring tiles. Production should give
  `TemplateCircle` (or its production equivalent) a guaranteed minimum diameter,
  separate scroll container, or `z-index` lift so drag affordances stay clickable.
- **Spacer rendering** in the playground uses a plain placeholder. Production should
  use a visually distinct token (dotted outline, "—" glyph, etc.) so storytellers
  immediately read it as a gap, not a missing player.
- **Storyteller marker** is a plain arrow in the playground. Production should match
  the rest of the icon vocabulary (filled token with a chair icon, for example).
- **Propagation checkbox copy.** "Update template" and "Update other games" tested fine
  with the developer, but production copy should clarify direction ("Apply to template
  for future games" / "Apply to all existing games").

None of these block the integration; flag them as follow-up work in the integration
milestone's polish phase.

---

## 7. Suggested production milestone breakdown

Phase numbers below are the integration milestone's, not M40's. Each phase is shippable
in isolation behind a feature flag (`flag: NEW_SEATING_MODEL`), with the existing flow
preserved until phase 6.

1. **Types + persistence schema bump.** Land the new `Session`/`Game`/`Slot` shape in
   `UI/src/types/index.ts` and `API/internal/models/models.go`. Bump persisted-state
   version. Compile + tests green; no behavioural change yet because nothing consumes
   the new fields.
2. **Session-level player + template editing.** Add the new actions to
   `SessionContext.tsx` (player CRUD, template edits, `SET_PROPAGATION_DEFAULT`).
   Rebuild `SessionSetupPage.tsx` to render the template circle + player roster +
   script picker (mirror `PlaygroundM40Page` layout). Ship behind the flag.
3. **Game flow rebuild.** Rewrite the game-creation path in
   `SessionContext.addGameToSession` to copy template slots + carry seat assignments.
   Add `ADD_PARTICIPANT` / `REMOVE_PARTICIPANT` / `SET_PARTICIPANT_TRAVELLER` /
   `ASSIGN_GAME_SEAT` / `REMOVE_GAME_SLOT` / `MOVE_GAME_SLOT` /
   `SET_PLAYER_COUNT_OVERRIDE` to `GameContext.tsx`. Wire propagation defaults from
   session preference. Migrate `CharacterAssignmentDialog` to use `participants` and
   `playerCountOverride`.
4. **Seat-keyed caller sweep.** Walk the directories listed in §3.5. For each file:
   change `player.seat` → `player.id` (or slot.id), update tests. This is large but
   mechanical. Suggest splitting across multiple PRs by directory.
5. **DnD parity.** Port the playground's `useSortable` + `DndContext` setup into the
   production `TownSquareLayout` / template view. Reuse `PointerSensor` with
   `activationConstraint.distance: 4` so click-to-rename still works on slot labels.
6. **Cleanup + flag flip.**
   - Delete the obsolete components listed in §3.3.
   - Delete `Session.defaultPlayers` and the legacy `SWAP_/SHIFT_/INSERT_` actions in
     `SessionContext` and `GameContext`.
   - Delete `UI/src/pages/PlaygroundM40Page.tsx` and `UI/src/pages/playground/m40/*`.
   - Remove the `/playground/m40` route + the HomePage link.
   - Wipe `API/data/sessions/`.
   - Flip the feature flag default to on; remove the flag after one release.
   - Apply the §6 visual-polish items.

---

## 8. Reference: M40 reducer surface

Useful as a one-page checklist when wiring the production contexts. All 19 actions
the playground reducer handles (source: `UI/src/pages/playground/m40/reducer.ts`):

**Players** — `ADD_PLAYER`, `RENAME_PLAYER`, `REMOVE_PLAYER`

**Template** — `ADD_TEMPLATE_SEAT`, `ADD_TEMPLATE_SPACER`, `ADD_TEMPLATE_STORYTELLER`,
`REMOVE_TEMPLATE_SLOT`, `MOVE_TEMPLATE_SLOT`, `ASSIGN_TEMPLATE_SEAT`

**Games** — `CREATE_GAME`, `RENAME_GAME`, `REMOVE_GAME`, `SELECT_GAME`

**Participants** — `ADD_PARTICIPANT`, `REMOVE_PARTICIPANT`, `SET_PARTICIPANT_TRAVELLER`

**Seat assignment in a game (propagation-aware)** — `ASSIGN_GAME_SEAT`,
`REMOVE_GAME_SLOT`, `MOVE_GAME_SLOT`

**Character assignment** — `SET_PLAYER_COUNT_OVERRIDE`, `ASSIGN_CHARACTER`

**Preferences** — `SET_PROPAGATION_DEFAULT`

Note: `ADD_TEMPLATE_SEAT`, `ADD_TEMPLATE_SPACER`, and `ADD_TEMPLATE_STORYTELLER`
accept an optional `gameSlotIds: Record<GameId, SlotId>` map; when provided, the
template addition also appends a matching slot to each existing game with the supplied
fresh id. That is the "apply to all games" toggle from vision point #7.
