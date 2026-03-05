# Milestone 15 — Day/Night Tab Workflow

> **Goal:** Streamline the Day/Night phase transition by making the Night tab directly enter flashcard mode, tracking the user's position across tab switches, and removing redundant UI elements.

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

The current Day/Night transition workflow has unnecessary friction:

### 1.1 Unnecessary Confirmation Dialog

When switching to Night mode, a confirmation dialog appears asking the user to confirm. This adds an extra tap on every night transition — a frequent action that doesn't need confirmation since nights can be abandoned at any time.

### 1.2 No Direct Flashcard Entry

Clicking the Night tab currently shows a night overview or landing page rather than immediately showing the flashcards. The Storyteller wants to jump straight into the night actions.

### 1.3 No Position Tracking

If the Storyteller switches from Night back to Day (e.g., to check something) and then returns to Night, they lose their place. The flashcard carousel resets to the beginning instead of returning to where they left off.

### 1.4 Premature Night Completion

The system may consider a night "complete" when all flashcards have been viewed, rather than requiring an explicit action from the user. Nights should only be completed when the Storyteller deliberately presses a "Complete Night" button.

### 1.5 Redundant Moon Icon

The navbar has a moon icon button that enters night mode, which duplicates the function of the Night tab. With the Night tab serving this purpose directly, the moon icon becomes redundant.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Day/Night tabs | #1 | "the dialog to confirm going into night mode is unnecessary" |
| Day/Night tabs | #2 | "clicking on the night tab should go directly into the flashcards" |
| Day/Night tabs | #3 | "clicking on the night tab again should take us back to whichever flashcard we left off at" |
| Day/Night tabs | #4 | "do not consider a night complete until the user has pressed the 'complete night button'" |
| Day/Night tabs | #5 | "we should be able to get rid of the moon icon button in the navbar if the night tab takes its place" |

---

## 3. Solution Overview

### 3.1 Tab Behavior Flow

```
User clicks Night tab
        │
        ▼
  Is there an active night in progress?
        │
    ┌───┴───┐
    Yes     No
    │       │
    ▼       ▼
  Resume    Start new night:
  at last   Show first flashcard
  viewed    (index 0)
  card
    │       │
    └───┬───┘
        ▼
  Flashcard Carousel
  (swipe through cards)
        │
        ▼
  User can switch to Day tab at any time
  (position is preserved in state)
        │
        ▼
  Night is ONLY complete when user
  presses "Complete Night" button
```

### 3.2 State Changes

Add to game state (via `GameContext`):

```typescript
interface NightPhaseState {
  /** Index of the currently viewed flashcard. Persists across tab switches. */
  currentNightCardIndex: number;
  /** Whether a night is currently in progress (cards are being viewed). */
  nightInProgress: boolean;
}
```

These fields should be added to the game reducer and persisted in `localStorage` so they survive page refreshes.

### 3.3 Confirmation Dialog Removal

Remove the `NightPhaseOverlay` confirmation dialog (or its confirmation step). The Night tab click should immediately transition to the flashcard view.

### 3.4 Moon Icon Removal

Remove the moon icon button from the navbar. The Night tab now serves as the sole entry point to night mode.

### 3.5 Complete Night Button

The "Complete Night" button should be the only way to finalize a night:
- Available as a button at the end of the flashcard carousel (after the last card)
- Also available as a persistent action in the night view UI
- When pressed: saves the night to history, resets `currentNightCardIndex`, sets `nightInProgress` to false
- Viewing all cards does NOT auto-complete the night

---

## 4. Task List

### Phase 1: Remove Confirmation Dialog

- [ ] Remove the night mode confirmation dialog from [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) or the tab switching logic in [`GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx)
- [ ] Update the Night tab click handler to immediately enter flashcard mode
- [ ] Remove any associated confirmation dialog state and handlers

### Phase 2: Add Position Tracking State

- [ ] Add `currentNightCardIndex` and `nightInProgress` fields to game state in [`GameContext.tsx`](../../UI/src/context/GameContext.tsx)
- [ ] Add reducer actions: `SET_NIGHT_CARD_INDEX`, `START_NIGHT`, `COMPLETE_NIGHT`
- [ ] Ensure `currentNightCardIndex` persists in `localStorage` via existing persistence logic
- [ ] Update [`FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx) to read/write `currentNightCardIndex` from game state

### Phase 3: Update Tab Switching Logic

- [ ] In [`GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx), update Night tab click to:
  - If `nightInProgress`: resume at `currentNightCardIndex`
  - If not `nightInProgress`: dispatch `START_NIGHT` and show flashcard at index 0
- [ ] When switching from Night to Day tab: preserve `currentNightCardIndex` in state (no reset)
- [ ] When switching back to Night tab: restore carousel position from `currentNightCardIndex`

### Phase 4: Update Night Completion Logic

- [ ] Ensure viewing all flashcards does NOT automatically complete the night
- [ ] Add/verify "Complete Night" button at end of carousel or in night view header
- [ ] "Complete Night" button dispatches `COMPLETE_NIGHT` action which:
  - Saves the current night to history (existing behavior)
  - Resets `currentNightCardIndex` to 0
  - Sets `nightInProgress` to false
  - Increments night count
  - Switches back to Day tab

### Phase 5: Remove Moon Icon from Navbar

- [ ] Identify the moon icon button in the navbar component
- [ ] Remove the moon icon button and its click handler
- [ ] Verify no other components reference the moon icon's functionality
- [ ] Adjust navbar layout if needed after removal

### Phase 6: Update Tests & Stories

- [ ] Remove tests for the deleted confirmation dialog
- [ ] Add tests for direct flashcard entry on Night tab click
- [ ] Add tests for card position persistence across tab switches
- [ ] Add tests for night completion only via "Complete Night" button
- [ ] Update Storybook stories for [`PhaseBar`](../../UI/src/components/PhaseBar/PhaseBar.tsx) if it shows the tab UI
- [ ] Update [`GameViewPage.test.tsx`](../../UI/src/pages/GameViewPage.test.tsx) for new tab behavior

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| [`UI/src/pages/GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx) | Tab switching logic — Night tab directly enters flashcards |
| [`UI/src/pages/GameViewPage.test.tsx`](../../UI/src/pages/GameViewPage.test.tsx) | Updated tests for new tab behavior |
| [`UI/src/components/NightPhase/NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) | Remove confirmation dialog |
| [`UI/src/components/NightPhase/NightPhaseOverlay.test.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.test.tsx) | Remove confirmation dialog tests |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/context/GameContext.tsx`](../../UI/src/context/GameContext.tsx) | Add `currentNightCardIndex`, `nightInProgress` state + reducer actions |
| [`UI/src/context/GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) | Tests for new state fields and reducer actions |
| [`UI/src/components/NightPhase/FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx) | Read/write card index from game state |
| [`UI/src/components/NightPhase/FlashcardCarousel.test.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.test.tsx) | Tests for position tracking |
| [`UI/src/components/PhaseBar/PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx) | Possibly remove moon icon from navbar |
| Navbar component (if separate from PhaseBar) | Remove moon icon button |

### NOT Modified

- Night flashcard content rendering (`NightFlashcard.tsx`, `SubActionChecklist.tsx`) — M14's territory
- Night order logic (`_nightOrder.ts`, `nightOrderFilter.ts`)
- Night history components — M19's territory
- TownSquare components — M16's territory
- Character data files

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M14 (Night Flashcard UX) | `NightFlashcard.tsx` (minor) | M15 changes carousel navigation; M14 changes card content. Low conflict risk. |
| M19 (Night History) | `GameContext.tsx` | Both milestones modify game context — M15 adds night tracking state, M19 adds history editing actions. Additive changes, but should coordinate on reducer structure. |

---

## 6. Dependencies

**None.** This milestone can run in parallel with all other milestones (M13, M14, M16–M19).

Minor coordination needed with M19 on [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) since both milestones add reducer actions. However, the changes are additive and unlikely to conflict.

---

## 7. Testing Requirements

### Unit Tests

- [ ] `GameContext.test.tsx`: Test `SET_NIGHT_CARD_INDEX` action updates state correctly
- [ ] `GameContext.test.tsx`: Test `START_NIGHT` action initializes night state
- [ ] `GameContext.test.tsx`: Test `COMPLETE_NIGHT` action resets night state, saves to history
- [ ] `GameViewPage.test.tsx`: Test Night tab click goes directly to flashcards (no dialog)
- [ ] `GameViewPage.test.tsx`: Test switching Day→Night→Day→Night preserves card position
- [ ] `GameViewPage.test.tsx`: Test night is NOT complete after viewing all cards
- [ ] `GameViewPage.test.tsx`: Test "Complete Night" button finalizes the night
- [ ] `FlashcardCarousel.test.tsx`: Test carousel starts at `currentNightCardIndex` from state
- [ ] `FlashcardCarousel.test.tsx`: Test swiping updates `currentNightCardIndex` in state
- [ ] Verify removed confirmation dialog tests are cleaned up (no orphaned test code)

### Storybook Tests

- [ ] Update `PhaseBar.stories.tsx` to reflect no moon icon (if applicable)
- [ ] Add stories showing tab-based night entry flow

### Integration Verification

- [ ] Run the app and verify:
  - Clicking Night tab immediately shows flashcards
  - Switching to Day and back to Night returns to the same flashcard
  - Night only completes via "Complete Night" button
  - Moon icon is no longer in the navbar

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] No confirmation dialog appears when switching to Night mode
- [ ] Clicking the Night tab immediately displays the flashcard carousel
- [ ] Switching from Night to Day and back preserves the Storyteller's position in the carousel
- [ ] Night is ONLY considered complete when the user explicitly presses "Complete Night"
- [ ] Viewing all flashcards without pressing "Complete Night" does NOT finalize the night
- [ ] The moon icon button is removed from the navbar
- [ ] Night state (`currentNightCardIndex`, `nightInProgress`) persists in `localStorage`
- [ ] Starting a new night (after completing the previous one) resets to the first flashcard
- [ ] All existing non-dialog tests pass; dialog-related tests removed cleanly
- [ ] New tests cover tab behavior, position persistence, and completion logic
- [ ] TypeScript compilation, ESLint, and test suite all pass
