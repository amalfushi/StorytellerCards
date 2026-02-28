# Night Phase System

> This is the **core feature** of Storyteller Cards.

## Overview

During the Night phase of Blood on the Clocktower, the Storyteller must wake each character individually in a specific order and resolve their ability. The Night Phase Flashcards guide the Storyteller through this process with swipeable cards showing exactly what to do for each character.

## Night Order Filtering

The master [`nightOrder.json`](../../UI/src/data/nightOrder.json) contains 168 entries covering ALL BotC characters. For any given game, this is filtered down to only the characters assigned to players in that game.

Filter logic in [`nightOrderFilter.ts`](../../UI/src/utils/nightOrderFilter.ts):
1. Start with the master night order (`firstNight` or `otherNights` depending on `isFirstNight`)
2. Keep all **structural** entries (Dusk, Dawn, Minion Info, Demon Info)
3. Keep only **character** entries whose `id` matches a character assigned to a player in the current game
4. **Planned (M3-3)**: Currently filters to script characters; should filter to *assigned* characters only

## Flashcard Structure

Each [`NightFlashcard`](../../UI/src/components/NightPhase/NightFlashcard.tsx) shows:

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

- **Background color**: Based on character type (see color scheme in [`agents.md`](../agents.md))
- **Dead players**: Very desaturated background (planned M3-3)

## Sub-Action Checklist

[`SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx)

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

[`StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx)

Non-character cards in the night order:
- **Dusk** — beginning of night (being removed per M3-4)
- **Dawn** — end of night (being removed per M3-4)
- **Minion Info** — first night only, show Minions who each other are and who the Demon is
- **Demon Info** — first night only, show Demon who the Minions are and give false info

## Night Choice Selectors

[`NightChoiceSelector.tsx`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) (M3-10, partially complete)
[`NightChoiceHelper.ts`](../../UI/src/components/NightPhase/NightChoiceHelper.ts) (M3-10, partially complete)

For characters whose ability involves choosing (e.g., "choose a player", "choose 2 players", "choose a character"):
- Dropdown populated with appropriate options (living players, all players, characters, alignments)
- Multi-select for "choose N" abilities
- Previous night's selection shown as read-only reference
- Selections saved to `NightProgress.selections` and `NightHistoryEntry.selections`

## Night Progress Tracking

[`NightProgress`](../../UI/src/types/index.ts) tracks the in-flight state:

```typescript
interface NightProgress {
  currentCardIndex: number;           // which card is shown
  subActionStates: Record<string, boolean[]>;  // checkmarks
  notes: Record<string, string>;               // free text per character
  selections: Record<string, string | string[]>; // dropdown choices
  totalCards: number;
}
```

The carousel ([`FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx)) manages swipe navigation and the progress bar ([`NightProgressBar.tsx`](../../UI/src/components/NightPhase/NightProgressBar.tsx)) shows position.

**Planned (M3-7)**: Pagination dots should be larger and clickable to jump directly to a card.

## Complete Night Flow

When the Storyteller finishes all cards and presses "Complete Night":

1. Current `NightProgress` is converted to a `NightHistoryEntry`
2. History entry is pushed to `Game.nightHistory[]`
3. Progress is cleared (checkmarks reset)
4. Phase advances to Day
5. `currentDay` increments, `isFirstNight` is set to `false`

## Night History

- [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) — opens from the AppBar, lists all completed nights
- [`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx) — shows a read-only flashcard carousel for a selected past night

**Planned (M3-11)**: Night history should be editable to fix misclicks — not truly read-only.

## Data Flow Summary

```
nightOrder.json (168 entries)
    ↓ filter by assigned characters
Filtered entries for this game
    ↓ render as flashcards
NightPhaseOverlay → FlashcardCarousel → NightFlashcard[]
    ↓ user interacts (checkmarks, notes, selections)
NightProgress (in-flight state)
    ↓ "Complete Night"
NightHistoryEntry (saved to Game.nightHistory)
    ↓ review later
NightHistoryDrawer → NightHistoryReview
```
