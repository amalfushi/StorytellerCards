# Night Phase System

> This is the **core feature** of Storyteller Cards.

## Overview

During the Night phase of Blood on the Clocktower, the Storyteller must wake each character individually in a specific order and resolve their ability. The Night Phase Flashcards guide the Storyteller through this process with swipeable cards showing exactly what to do for each character.

## Night Order Derivation & Filtering

Night order is **derived** from individual character files rather than a separate master list. Each character's [`firstNight`](../UI/src/types/index.ts) and [`otherNights`](../UI/src/types/index.ts) fields include an `order` number that determines their position in the night sequence.

The [`buildNightOrder()`](../UI/src/data/characters/_nightOrder.ts) function:
1. Collects all characters that have a night action for the given phase
2. Converts each into a `NightOrderEntry` with `order`, `type: 'character'`, `id`, `name`, `helpText`, and `subActions`
3. Merges with **structural** entries (Minion Info, Demon Info) from [`_nightOrder.ts`](../UI/src/data/characters/_nightOrder.ts)
4. Sorts by `order` ascending

For any given game, the derived order is then filtered down to only the characters assigned to players.

Filter logic in [`nightOrderFilter.ts`](../UI/src/utils/nightOrderFilter.ts):
1. Start with the derived night order from `buildNightOrder(allCharacters, isFirstNight)`
2. Keep all **structural** entries (Minion Info, Demon Info)
3. Keep only **character** entries whose `id` matches a character assigned to a player in the current game
4. When the optional `players?: PlayerSeat[]` parameter is provided, filters to only characters assigned to actual players (not all script characters)

The [`useNightOrder.ts`](../UI/src/hooks/useNightOrder.ts) hook calls `buildNightOrder()` and passes the result through the filter with the current players array. 11 tests in [`nightOrderFilter.test.ts`](../UI/src/utils/nightOrderFilter.test.ts) verify the filtering logic including player-based filtering.

## Flashcard Structure

Each [`NightFlashcard`](../UI/src/components/NightPhase/NightFlashcard.tsx) shows:

```
┌──────────────────────────────┐
│  Character Icon              │
│  Character Name              │
│  Player Name (seat #)        │
│  abilityShort                │
├──────────────────────────────┤
│  Sub-Action Checklist        │
│  ☐ Wake the character        │
│  ☐ Show them the token       │
│    ☐ If they nod, do X       │
│  ☐ Put them to sleep         │
├──────────────────────────────┤
│  Night Choice Selector       │
│  (dropdown for choose player)│
├──────────────────────────────┤
│  Notes (free text)           │
└──────────────────────────────┘
```

- **Background color**: Based on character type (see color scheme in [`AGENTS.md`](../AGENTS.md))
- **Dead players**: Desaturated background via targeted CSS applied in [`NightFlashcard.tsx`](../UI/src/components/NightPhase/NightFlashcard.tsx)

## Sub-Action Checklist

[`SubActionChecklist.tsx`](../UI/src/components/NightPhase/SubActionChecklist.tsx)

Each character's night action is broken into individual checkable steps (`NightSubAction`):

```typescript
interface NightSubAction {
  id: string;           // e.g. "noble-fn-1"
  description: string;  // e.g. "Wake the character"
  isConditional: boolean; // true if prefixed with "If…"
}
```

**Indentation rules:**
- Regular actions: left-aligned
- Conditional actions (`isConditional: true`): same indent level as the "If" prefix
- Continuation steps under a conditional: indented further

**Checkmarks reset each night** — they track per-night progress only.

States are stored in `NightProgress.subActionStates` as `Record<string, boolean[]>` (character ID → array of booleans).

## Structural Cards

[`StructuralCard.tsx`](../UI/src/components/NightPhase/StructuralCard.tsx)

Non-character cards in the night order:
- **Minion Info** — first night only, show Minions who each other are and who the Demon is
- **Demon Info** — first night only, show Demon who the Minions are and give false info

Dawn and Dusk structural cards were removed in M3-4 since phases are now a simple Day/Night toggle.

## Night Choice Selectors

[`NightChoiceSelector.tsx`](../UI/src/components/NightPhase/NightChoiceSelector.tsx) renders dropdown UI for character abilities that involve choosing.

### Declarative Night Choices (M6)

Night choices are now **declaratively defined** on each character's `NightAction` via the `choices?: NightChoice[]` field. Each `NightChoice` specifies:

```typescript
interface NightChoice {
  type: NightChoiceType;    // 'player' | 'livingPlayer' | 'deadPlayer' | 'character' | 'alignment' | 'yesno'
  label: string;            // e.g. "Choose 2 players"
  maxSelections: number;    // e.g. 2
}
```

[`NightFlashcard.tsx`](../UI/src/components/NightPhase/NightFlashcard.tsx) reads `choices` directly from the character's `NightAction`. If `choices` is present and non-empty, it uses them directly. If absent (legacy data), it falls back to regex parsing via [`NightChoiceHelper.ts`](../UI/src/components/NightPhase/NightChoiceHelper.ts) `parseHelpTextForChoices()` for backward compatibility.

For characters whose ability involves choosing (e.g., "choose a player", "choose 2 players", "choose a character"):
- Dropdown populated with appropriate options (living players, all players, characters, alignments)
- Multi-select for "choose N" abilities
- Compound choices supported (e.g., Cerenovus: player + character)
- Previous night's selection shown as read-only reference
- Selections saved to `NightProgress.selections` and `NightHistoryEntry.selections`

## Night Progress Tracking

[`NightProgress`](../UI/src/types/index.ts) tracks the in-flight state:

```typescript
interface NightProgress {
  currentCardIndex: number;           // which card is shown
  subActionStates: Record<string, boolean[]>;  // checkmarks
  notes: Record<string, string>;               // free text per character
  selections: Record<string, string | string[]>; // dropdown choices
  totalCards: number;
}
```

The carousel ([`FlashcardCarousel.tsx`](../UI/src/components/NightPhase/FlashcardCarousel.tsx)) manages swipe navigation and the progress bar ([`NightProgressBar.tsx`](../UI/src/components/NightPhase/NightProgressBar.tsx)) shows position.

Pagination dots are enlarged with 8px gap, clickable to jump directly to any card, with proper aria-labels and focus-visible styling. For 10+ entries, a condensed worm pattern is used via the `dotScale()` helper to prevent overflow. Stories: Clickable, CondensedWorm.

## Complete Night Flow

When the Storyteller finishes all cards and presses "Complete Night":

1. Current `NightProgress` is converted to a `NightHistoryEntry`
2. History entry is pushed to `Game.nightHistory[]`
3. Progress is cleared (checkmarks reset)
4. Phase advances to Day
5. `currentDay` increments, `isFirstNight` is set to `false`

## Night History

- [`NightHistoryDrawer.tsx`](../UI/src/components/NightHistory/NightHistoryDrawer.tsx) — opens from the AppBar, lists all completed nights; edit icon on each entry
- [`NightHistoryReview.tsx`](../UI/src/components/NightHistory/NightHistoryReview.tsx) — flashcard carousel for reviewing and editing past nights
- [`nightHistoryUtils.ts`](../UI/src/utils/nightHistoryUtils.ts) — utility functions: `mergeNightHistoryEntry()` for merging edited entries back, `findNightHistoryIndex()` for locating entries by day/night type. 15 tests in [`nightHistoryUtils.test.ts`](../UI/src/utils/nightHistoryUtils.test.ts).

Night history is **editable** — the Storyteller can fix misclicks in past night records.

## Data Flow Summary

```
Character .ts files (43 characters, each with firstNight/otherNights order)
    + _nightOrder.ts structural entries (MinionInfo, DemonInfo)
    ↓ buildNightOrder(allCharacters, isFirstNight)
Full derived night order (NightOrderEntry[])
    ↓ filterNightOrder() — filter by assigned characters
Filtered entries for this game
    ↓ render as flashcards
NightPhaseOverlay → FlashcardCarousel → NightFlashcard[]
    ↓ choices from NightAction.choices (or regex fallback)
    ↓ user interacts (checkmarks, notes, selections)
NightProgress (in-flight state)
    ↓ "Complete Night"
NightHistoryEntry (saved to Game.nightHistory)
    ↓ review later
NightHistoryDrawer → NightHistoryReview
```
