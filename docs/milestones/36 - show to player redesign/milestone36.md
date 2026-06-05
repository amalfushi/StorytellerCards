# Milestone 36 — Show-to-Player Workflow Redesign

## Status: ✅ Complete

Completed: 2026-06-01

### What shipped

- Added per-player multi-slot show-to-player messages and a pinned/recent template library.
- Rebuilt `PlayerShowDrawer` with stacked active messages, compose, edit, clone, delete, pin/unpin, re-show, and one-tap template recall.
- Added migration from existing per-character custom messages when the character is currently seated; no separate legacy schema beyond `customPlayerMessages` exists in `PlayerShowDrawer.tsx`.
- Added Town Square active-message count badges, seeded script templates, sorting heuristics, unit coverage, and a Storybook interaction story.

## Post-merge fixes (M38)

Town Square no longer renders the active show-message count badge on player tiles. The underlying per-player message slots and template data remain intact; only the noisy visual badge was removed.

## Post-merge fixes (M39)

Madness-related show-to-player token screens now use shared character icon rendering and consistent help-text placement. The Pixie MAD screen defaults to the character currently marked with the Pixie Mad reminder, and Cult Leader uses a Good/Evil alignment dropdown instead of a character picker.

### Summary

Replace the current single-message-per-character "show to players" drawer with a per-player slot system that supports multiple concurrent messages, template recall, and quick reuse — driven by live-game feedback.

---

> **Goal:** Make showing arbitrary night-time messages to players as fast as showing tokens, so the storyteller doesn't slow the table down retyping the same prompt every night.

---

## 1. Problem Statement

Feedback from the live "Whose Cult Is It Anyway?" game:

> The arbitrary 'show to players' messages were surprisingly helpful during the night... but were also slow and clunky like the pre-game setup. I remember needing to retype the same message often. For example, the Amnesiac's power was choose a person, then the amnesiac and that person were moved to a separate room for a 'sleep over' where they could talk about whatever they wanted during the night. However, showing a 'quietly stand up and go to the basement' to non-amnesiac players had to be retyped often. I also recall wanting to be able to have multiple arbitrary show-to-player messages per player. I needed to show the same player 2-3 different messages every night.

### Concrete gaps in the current implementation (`PlayerShowDrawer.tsx`)

| Gap                     | Today                                                                | Needed                                                                |
| ----------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Storage key             | One persisted custom message **per character**                       | Per **player**, with multiple concurrent slots                        |
| Multi-message per night | Only one message per player per night                                | N messages per player per night                                       |
| Template recall         | None — every message is from-scratch                                 | Per-script template library + global "recent" history; one-tap recall |
| Re-show                 | Drawer auto-saves on blur; previously-used messages are not surfaced | Tapping a previous template re-shows without retyping                 |
| Edit/clone              | Hidden behind blur save                                              | Explicit edit / clone / pin / delete                                  |

---

## 2. Architecture (preliminary — finalize at M36 planning time)

### 2.1 Data model

Move the message store off the character and onto the game. Append-only additions to `UI/src/types/index.ts`:

```ts
export type ShowToPlayerMessage = {
  id: string;
  seat: number;            // target player seat
  text: string;
  templateId?: string;     // if recalled from a template
  createdAt: string;       // ISO
  lastShownAt?: string;    // ISO — for sorting recents
  pinned?: boolean;        // user-pinned for quick recall
};

export type ShowToPlayerTemplate = {
  id: string;
  text: string;
  scope: 'script' | 'global';
  scriptId?: string;       // if scope === 'script'
  usageCount: number;
  lastUsedAt: string;
};

// Game additions (append-only):
showMessages?: ShowToPlayerMessage[];
showTemplates?: ShowToPlayerTemplate[];
```

### 2.2 UX surface

- Open `PlayerShowDrawer` for any player from any phase. The drawer shows:
  - The active messages for that player (multiple, stacked)
  - "Recent templates" section (most recent + most used in current script)
  - "Pinned templates" section
  - Compose box at the bottom
- Each message has actions: re-show, edit, clone, delete, pin-as-template, remove-from-pinned.
- A small badge on each player's seat in the TownSquare shows the count of active messages.

### 2.3 Quick-recall heuristics

- Template suggestions ranked by: (1) usage count this game, (2) usage count this script across all games, (3) global recency.
- Auto-clone the last shown message when opening the drawer if there is no active message for this player — single tap to re-show.

---

## 3. Task List (preliminary — refined at M36 planning)

- [x] Data model: append `showMessages`, `showTemplates` to game state in `types/index.ts` and reducer actions in `GameContext.tsx` (append-only per AGENTS.md conflict avoidance)
- [x] Migration: convert existing per-character custom messages into seeded per-player slots on first load
- [x] `PlayerShowDrawer` rewrite: multi-slot list, template recall, compose box
- [x] Template management UI: pin, unpin, edit, delete
- [x] TownSquare seat badge for active-message count
- [x] Quick-recall heuristics (this-game / this-script / global recency)
- [x] Tests (unit + Storybook play() interactions per AGENTS.md testing policy)
- [x] Documentation: this `milestone36.md` updated, `docs/progress.md` row, `AGENTS.md` stats if test count changes

---

## 4. Files Affected (preliminary)

### New files

| File                                                        | Purpose                                        |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `UI/src/data/showToPlayerTemplates.ts`                      | Seeded common-template list per script         |
| `UI/src/data/showToPlayerTemplates.test.ts`                 | Seed and quick-recall ranking coverage         |
| `UI/src/components/NightPhase/PlayerShowDrawer.stories.tsx` | Multi-slot workflow Storybook play interaction |

### Modified files

| File                                                     | Change                                             |
| -------------------------------------------------------- | -------------------------------------------------- |
| `UI/src/types/index.ts`                                  | Append message + template types and `Game` fields  |
| `UI/src/context/GameContext.tsx`                         | New reducer actions (append-only at end of switch) |
| `UI/src/components/NightPhase/PlayerShowDrawer.tsx`      | Multi-slot rewrite                                 |
| `UI/src/components/NightPhase/PlayerShowDrawer.test.tsx` | Multi-slot drawer interaction coverage             |
| `UI/src/components/TownSquare/TownSquareTab.tsx`         | Active-message count badge                         |
| `docs/progress.md`                                       | Append M36 row                                     |
| `AGENTS.md`                                              | Test-count refresh if changed                      |

---

## 5. Out of Scope

- Generic chat / messaging between players
- Voice or media attachments
- Cross-game / cross-device template sync — depends on existing game-state sync (M30 / M33)

---

## 6. Acceptance Criteria (preliminary)

- [x] A storyteller can show 3 different messages to the same player in the same night without retyping
- [x] A message used last game on the same script is one tap away
- [x] A pinned template is one tap away in every game
- [x] All existing per-character messages remain accessible after the migration
- [x] Full test suite passes; no new lint suppressions per AGENTS.md
