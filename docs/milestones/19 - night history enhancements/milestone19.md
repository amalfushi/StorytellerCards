# Milestone 19 — Night History Enhancements

> **Goal:** Make night history entries fully editable (notes and choice dropdowns) with a read/edit mode toggle, and add actionable summaries to the night history sidebar for quick review.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Source Items](#2-source-items)
3. [Solution Overview](#3-solution-overview)
4. [Task List](#4-task-list)
5. [Files Affected](#5-files-affected)
6. [Dependencies](#6-dependencies)
7. [Testing Requirements](#7-testing-requirements)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Problem Statement

The night history feature currently saves completed nights for reference, but the saved entries are read-only. This creates several issues:

### 1.1 Non-Editable Notes

If a Storyteller made a typo or forgot to add a note during the night, they cannot correct it afterward. Night history notes should be editable.

### 1.2 Non-Editable Choices

The "choose X" dropdowns (player selections, yes/no signals, etc.) are locked after a night is completed. If the Storyteller recorded the wrong choice, they cannot fix it. These should be editable in history.

### 1.3 No Edit Mode Toggle

The current UI has the word "Editable" displayed but no actual toggle mechanism. There should be a clear button to switch between read-only view and edit mode. In edit mode, the history entry should function identically to the live night flashcard for editing.

### 1.4 No Actionable Summary

The night history sidebar shows night entries but doesn't provide a quick summary of what happened. Storytellers need a glance-level view of key actions (who the Demon killed, what info was given, etc.) without opening each night's full details.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Night history | bullet 2 | "the notes aren't editable in the night history, they should be" |
| Night history | bullet 3 | "the choose xyz dropdowns aren't editable, they should be" |
| Night history | bullet 4 | "perhaps where we have the word 'Editable' we should instead have a button that toggles between edit mode and read only mode" |
| Night history | bullet 5 | "Night history sidebar could be improved by the highest level summary of what actionable things happened" |

### Example Summary (from user feedback)

```
Night 3:
    Imp chose {player} ({playerRole});
    Fortune Teller ({player1}) chose {player2} and {player3} a signal of 2.
    Professor {player} used their ability on {player2}
```

---

## 3. Solution Overview

### 3.1 Edit Mode Toggle

Replace the current "Editable" text with a toggle button:

```
┌────────────────────────────────────────────┐
│  Night 3 History                [📝 Edit]  │  ← Toggle button
│                                            │
│  Read-only view of night actions...        │
└────────────────────────────────────────────┘

              ↓ Click "Edit" ↓

┌────────────────────────────────────────────┐
│  Night 3 History                [👁 View]  │  ← Toggle back
│                                            │
│  Editable view (same as live flashcard)... │
│  [Save Changes]                            │
└────────────────────────────────────────────┘
```

**Read-only mode** (default):
- Notes displayed as static text
- Choice values displayed as labels (e.g., "Alice", "Yes")
- Sub-action checkboxes shown but disabled
- Clean, scannable layout

**Edit mode:**
- Notes become editable text fields
- Choice dropdowns become interactive (same controls as live flashcard)
- All changes apply to the specific night's history entry (not the current night)
- "Save Changes" or auto-save behavior

### 3.2 Editable Notes

In edit mode:
- Notes text fields become editable `<textarea>` or MUI `TextField` (multiline)
- On change, dispatch an update to the specific night's history in game state
- Support per-character notes (each flashcard entry can have its own note)

### 3.3 Editable Choices

In edit mode:
- Choice dropdowns (`NightChoiceSelector`) become interactive
- Player selections, yes/no toggles, character selections all function identically to the live flashcard
- Changes update the specific night's saved choice data

### 3.4 State Management for History Edits

Add a new reducer action to update a specific night's history entry:

```typescript
type GameAction =
  | // ... existing actions
  | { type: 'UPDATE_NIGHT_HISTORY_ENTRY'; nightIndex: number; characterId: string; updates: Partial<NightHistoryCharacterEntry> }
  | { type: 'UPDATE_NIGHT_HISTORY_NOTE'; nightIndex: number; characterId: string; note: string }
  | { type: 'UPDATE_NIGHT_HISTORY_CHOICE'; nightIndex: number; characterId: string; choiceIndex: number; value: unknown };
```

### 3.5 Actionable Summary

Generate a brief summary for each night in the sidebar/list view:

```typescript
interface NightSummaryLine {
  characterName: string;
  playerName?: string;
  action: string;  // e.g., "chose Alice (Imp's kill)"
}

function generateNightSummary(
  nightEntry: NightHistoryEntry,
  players: Player[],
  characters: CharacterDef[],
): NightSummaryLine[] {
  // For each character action with saved choices:
  // - Extract the key action (who was chosen, what signal was given)
  // - Format as a human-readable one-liner
  // - Skip non-actionable entries (no choices, structural entries)
}
```

**Summary display in sidebar:**
```
┌──────────────────────────────────────┐
│  Night History                       │
│                                      │
│  Night 3                      [▸]    │
│    Imp → Alice (killed)              │
│    Fortune Teller → Bob & Carol (No) │
│    Poisoner → Dave (poisoned)        │
│                                      │
│  Night 2                      [▸]    │
│    Imp → Eve (killed)                │
│    Empath → signal: 1                │
│                                      │
│  Night 1                      [▸]    │
│    Poisoner → Frank (poisoned)       │
│    Fortune Teller → Grace & Hank (Yes)|
└──────────────────────────────────────┘
```

### 3.6 Summary Generation Logic

The summary is derived from saved choice data:

1. For each character entry in the night:
   - If it has saved choices (player selections, yes/no, etc.), include it
   - Format: `{CharacterName} ({assignedPlayer}) → {choice summary}`
2. Key patterns:
   - **Demon kill**: "Imp → {target} (killed)"
   - **Player choice**: "Fortune Teller → {player1} & {player2} ({yesNo})"
   - **Poisoner**: "Poisoner → {target} (poisoned)"
   - **Generic**: "{Character} → {choice values}"
3. Skip entries with no choices (e.g., structural Dusk/Dawn, characters with no interactive night action)

---

## 4. Task List

### Phase 1: Edit Mode Toggle

- [ ] Add edit/view mode toggle button to [`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx)
- [ ] Add local state for `isEditMode` (boolean)
- [ ] Replace "Editable" text label with an interactive toggle button (📝 Edit / 👁 View)
- [ ] In read-only mode: display notes and choices as static text/labels
- [ ] In edit mode: render editable controls matching the live flashcard UI

### Phase 2: Editable Notes

- [ ] In edit mode: render notes as editable `TextField` (multiline)
- [ ] Create reducer action `UPDATE_NIGHT_HISTORY_NOTE` in [`GameContext.tsx`](../../UI/src/context/GameContext.tsx)
- [ ] On note change: dispatch update to the specific night's history entry
- [ ] Ensure note changes persist to `localStorage` via game state persistence

### Phase 3: Editable Choices

- [ ] In edit mode: render [`NightChoiceSelector`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) components as interactive (not disabled)
- [ ] Create reducer action `UPDATE_NIGHT_HISTORY_CHOICE` in [`GameContext.tsx`](../../UI/src/context/GameContext.tsx)
- [ ] On choice change: dispatch update to the specific night's entry with the new choice value
- [ ] Ensure choice edits don't affect the current active night's state
- [ ] Ensure choice changes persist to `localStorage`

### Phase 4: Actionable Summary

- [ ] Create `generateNightSummary()` utility function in [`nightHistoryUtils.ts`](../../UI/src/utils/nightHistoryUtils.ts) or a new `nightSummary.ts`
- [ ] Implement summary generation from saved choice data + player list + character definitions
- [ ] Handle key patterns: Demon kills, information signals (yes/no, numbers), poisoning, player selections
- [ ] Display summary lines in [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) sidebar for each night
- [ ] Make summary lines concise (one line per character action)
- [ ] Skip non-actionable entries in the summary

### Phase 5: Tests & Stories

- [ ] Update [`NightHistoryReview.test.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.test.tsx) for edit mode toggle
- [ ] Add tests for note editing functionality
- [ ] Add tests for choice editing functionality
- [ ] Add tests for `generateNightSummary()` utility
- [ ] Update [`NightHistoryDrawer.test.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.test.tsx) for summary display
- [ ] Update [`GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) for new reducer actions
- [ ] Update [`NightHistoryDrawer.stories.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.stories.tsx) to show summary view
- [ ] Add story for edit mode vs. read-only mode

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/NightHistory/NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx) | Edit mode toggle, editable notes & choices |
| [`UI/src/components/NightHistory/NightHistoryReview.test.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.test.tsx) | Updated tests |
| [`UI/src/components/NightHistory/NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) | Actionable summary display |
| [`UI/src/components/NightHistory/NightHistoryDrawer.test.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.test.tsx) | Updated tests |
| [`UI/src/components/NightHistory/NightHistoryDrawer.stories.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.stories.tsx) | Updated stories |
| [`UI/src/utils/nightHistoryUtils.ts`](../../UI/src/utils/nightHistoryUtils.ts) | Add `generateNightSummary()` function |
| [`UI/src/utils/nightHistoryUtils.test.ts`](../../UI/src/utils/nightHistoryUtils.test.ts) | Tests for summary generation |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/context/GameContext.tsx`](../../UI/src/context/GameContext.tsx) | Add history update reducer actions |
| [`UI/src/context/GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) | Tests for new reducer actions |

### NOT Modified

- Live night flashcard components (`NightFlashcard.tsx`, `SubActionChecklist.tsx`) — M14's territory
- Night phase navigation (`FlashcardCarousel.tsx`, `NightPhaseOverlay.tsx`) — M15's territory
- Night order logic (`_nightOrder.ts`, `nightOrderFilter.ts`)
- TownSquare components — M16's territory
- Character data files

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M15 (Day/Night Workflow) | `GameContext.tsx` | Both add reducer actions. M15 adds night tracking state; M19 adds history editing actions. Additive changes — low conflict risk but coordinate on reducer structure. |
| M18 (Traveller/Fabled/Loric) | `GameContext.tsx` | Both add reducer actions. Additive — low conflict risk. |
| M14 (Night Flashcard UX) | Similar UI patterns | M19 reuses UI patterns from flashcards (NightChoiceSelector) but in history components. No file overlap. |
| M13 (Icon Replacement) | `NightHistoryReview.tsx` | M13 replaces placeholder icons; M19 adds edit mode. Different aspects of the same component — coordinate on merge order. |

---

## 6. Dependencies

**None.** This milestone can run in parallel with all other milestones (M13–M18).

The edit mode UI reuses `NightChoiceSelector` from the live flashcard components — it imports and renders the same component but connects it to history state instead of current night state. This is a read-only dependency (no modifications to `NightChoiceSelector`).

Minor coordination needed with M15 and M18 on [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) since all three milestones add reducer actions. The changes are additive.

---

## 7. Testing Requirements

### Unit Tests

**Edit Mode Toggle:**
- [ ] `NightHistoryReview.test.tsx`: Test toggle button switches between edit and view modes
- [ ] `NightHistoryReview.test.tsx`: Test read-only mode shows static text for notes and choices
- [ ] `NightHistoryReview.test.tsx`: Test edit mode shows editable TextField for notes
- [ ] `NightHistoryReview.test.tsx`: Test edit mode shows interactive NightChoiceSelector for choices

**Note Editing:**
- [ ] `NightHistoryReview.test.tsx`: Test editing a note dispatches `UPDATE_NIGHT_HISTORY_NOTE`
- [ ] `NightHistoryReview.test.tsx`: Test note changes are reflected in the rendered text
- [ ] `GameContext.test.tsx`: Test `UPDATE_NIGHT_HISTORY_NOTE` action updates the correct night entry

**Choice Editing:**
- [ ] `NightHistoryReview.test.tsx`: Test editing a choice dispatches `UPDATE_NIGHT_HISTORY_CHOICE`
- [ ] `NightHistoryReview.test.tsx`: Test choice changes don't affect current night state
- [ ] `GameContext.test.tsx`: Test `UPDATE_NIGHT_HISTORY_CHOICE` action updates the correct entry

**Actionable Summary:**
- [ ] `nightHistoryUtils.test.ts`: Test `generateNightSummary()` with Demon kill choice data
- [ ] `nightHistoryUtils.test.ts`: Test summary with Fortune Teller (2 players + yes/no)
- [ ] `nightHistoryUtils.test.ts`: Test summary with Poisoner (1 player choice)
- [ ] `nightHistoryUtils.test.ts`: Test summary skips entries with no choices
- [ ] `nightHistoryUtils.test.ts`: Test summary skips structural entries (Dusk, Dawn)
- [ ] `nightHistoryUtils.test.ts`: Test summary with empty night history
- [ ] `NightHistoryDrawer.test.tsx`: Test summary lines display in the sidebar
- [ ] `NightHistoryDrawer.test.tsx`: Test summary updates when history is edited

### Storybook Stories

- [ ] `NightHistoryDrawer.stories.tsx`: Story with summary view showing multiple nights
- [ ] `NightHistoryDrawer.stories.tsx`: Story with expanded night showing read-only mode
- [ ] `NightHistoryDrawer.stories.tsx`: Story with expanded night showing edit mode
- [ ] Add `play()` interaction test: toggle edit mode, change a note, verify display update

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] Night history entries have a clear Edit/View toggle button (replaces "Editable" text)
- [ ] In read-only mode: notes and choices display as static, non-interactive text
- [ ] In edit mode: notes are editable via text fields
- [ ] In edit mode: choice dropdowns are interactive and function like the live flashcard
- [ ] Editing a history entry updates ONLY that entry (not the current active night)
- [ ] All history edits persist to `localStorage` via game state
- [ ] Night history sidebar shows a concise actionable summary for each night
- [ ] Summary includes key actions: Demon kills, player selections, information signals
- [ ] Summary skips non-actionable entries (structural cards, characters with no choices)
- [ ] Summary updates in real-time if history entries are edited
- [ ] All existing tests pass with updates
- [ ] New tests cover edit toggle, note editing, choice editing, and summary generation
- [ ] Storybook stories demonstrate both read-only and edit modes
- [ ] TypeScript compilation, ESLint, and test suite all pass
