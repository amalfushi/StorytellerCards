## Status: ✅ Complete

**Completed:** 2026-03-06

### Summary
Milestone 15 streamlined the Day/Night phase transition workflow:
- **Removed** the confirmation dialog when switching to Night mode
- **Replaced** the full-screen `NightPhaseOverlay` with an inline `NightTabPanel` that renders the FlashcardCarousel in the tab content area
- **Added** `SET_NIGHT_CARD_INDEX` reducer action for card position persistence across tab switches
- **Made** PhaseBar a pure presentation + callback component with `activeView`, `nightInProgress`, `onNightClick`, `onDayClick` props
- **Removed** the moon icon from the AppBar
- **Enabled** free Day↔Night switching via PhaseBar (Night→Day no longer blocked)
- **Night completion** only occurs via explicit "Complete Night" button
- All 4 bottom tabs (Town Square, Players, Script, Night Order) remain unchanged

### Key Changes
| File | Change |
|------|--------|
| `UI/src/context/GameContext.tsx` | Added `SET_NIGHT_CARD_INDEX` action + `setNightCardIndex` function |
| `UI/src/components/NightPhase/FlashcardCarousel.tsx` | Added `onCardChange` callback prop |
| `UI/src/components/NightPhase/NightTabPanel.tsx` | **NEW** — inline wrapper for FlashcardCarousel |
| `UI/src/components/PhaseBar/PhaseBar.tsx` | Rewritten as pure presentation + callbacks, dialog removed |
| `UI/src/pages/GameViewPage.tsx` | Added `viewMode` state, removed overlay + moon icon |
| `UI/src/components/NightPhase/NightPhaseOverlay.tsx` | **DELETED** — replaced by NightTabPanel |

### Verification
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Tests: 2419 tests across 55 files — all passing

---

# Milestone 15 — Day/Night Tab Workflow

> **Goal:** Streamline the Day/Night phase transition by using the PhaseBar as a mode switch, rendering the flashcard carousel inline in the tab content area, tracking the user's position across phase switches, and removing redundant UI elements.

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

### Approved Design: PhaseBar as Mode Switch with Inline Flashcard Panel

The PhaseBar Day/Night chips serve as the mode switch. Clicking the **Night chip** immediately starts the night and renders the `FlashcardCarousel` **inline in the tab content area**, replacing whatever bottom tab content was showing. Clicking the **Day chip** switches back to the normal 4 bottom tabs. Night progress is preserved across Day↔Night switches.

**Key principles:**
- All 4 bottom tabs remain unchanged (Town Square, Players, Script, Night Order)
- Night Order tab (index 3) **always** shows the reference list — it never transforms
- PhaseBar Night chip is the **sole entry point** to start/resume a night
- No full-screen overlay — the flashcard carousel renders inline
- No confirmation dialog — Night chip click is immediate
- Day↔Night phase switching is free and unblocked in both directions
- Night completion is **only** via the explicit "Complete Night" button

### 3.1 Phase Behavior Flow

```
User clicks Night chip in PhaseBar
        │
        ▼
  Is nightProgress non-null? (active night?)
        │
    ┌───┴───┐
    Yes     No
    │       │
    ▼       ▼
  Resume    Dispatch START_NIGHT:
  at saved  Show first flashcard
  cardIndex (index 0)
    │       │
    └───┬───┘
        ▼
  Inline Flashcard Panel
  (renders in tab content area, replacing bottom tab content)
  (swipe through cards, index synced to context)
        │
        ▼
  User clicks Day chip in PhaseBar
  → Bottom tabs return, night progress preserved
  → Tab 3 (Night Order) still shows reference list
        │
        ▼
  User clicks Night chip again
  → Returns to saved card position
        │
        ▼
  Night is ONLY complete when user
  presses "Complete Night" button
```

### 3.2 State Changes

Add `SET_NIGHT_CARD_INDEX` action to the game reducer in [`GameContext.tsx`](../../UI/src/context/GameContext.tsx):

```typescript
| { type: 'SET_NIGHT_CARD_INDEX'; payload: { index: number } }
```

This syncs the carousel position back to `nightProgress.currentCardIndex` in GameContext whenever the user navigates cards, ensuring the position persists across Day↔Night phase switches.

The existing `nightProgress` state (including `currentCardIndex`) already persists in `localStorage` via the existing persistence logic.

### 3.3 NightPhaseOverlay Removal

[`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) will be **deleted**. Its logic for handling night progress, notes, and completion will be extracted into the new [`NightTabPanel`](../../UI/src/components/NightPhase/NightTabPanel.tsx) component, which renders the `FlashcardCarousel` inline (not as a `position: fixed` overlay with z-index stacking).

### 3.4 Moon Icon Removal

Remove the moon icon button from the AppBar in [`GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx). The PhaseBar Night chip is now the sole entry point to night mode.

### 3.5 PhaseBar Changes

[`PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx) changes:

| Action | Current Behavior | New Behavior |
|--------|-----------------|--------------|
| Click Night chip | Confirmation dialog → sets phase | **No dialog.** Immediately starts night via `onNightClick` callback |
| Click Day chip (during active night) | Blocked | **Allowed.** Switches view back to Day tabs via `onDayClick` callback. Night progress preserved |

PhaseBar receives `onNightClick` and `onDayClick` callback props from GameViewPage to control the phase/view switching.

### 3.6 Complete Night Button

The "Complete Night" button is the **only** way to finalize a night:
- Available as a button at the end of the flashcard carousel (after the last card)
- When pressed: saves the night to history, resets `currentCardIndex`, sets `nightProgress` to null, increments night count, switches back to Day view
- Viewing all cards does NOT auto-complete the night

### 3.7 Free Day↔Night Switching

Night→Day switching is **unblocked** in PhaseBar. The user can freely toggle between Day and Night views:
- Day view: normal 4 bottom tabs visible and functional
- Night view: flashcard carousel replaces tab content area
- Switching to Day does not lose night progress
- Switching back to Night resumes at the saved card position

---

## 4. Task List

### Phase 1: GameContext — Add `SET_NIGHT_CARD_INDEX` Action

- [ ] Add `SET_NIGHT_CARD_INDEX` reducer action to [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) that updates `nightProgress.currentCardIndex`
- [ ] Add `setNightCardIndex` helper function on `GameContextValue`
- [ ] Add tests for the new reducer action in `GameContext.test.tsx`

### Phase 2: FlashcardCarousel — Add `onCardChange` Callback

- [ ] Add optional `onCardChange?: (index: number) => void` callback prop to [`FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx)
- [ ] Call `onCardChange` whenever the current card index changes (in `goTo` and `goToIndex`)
- [ ] Add tests for the `onCardChange` callback in `FlashcardCarousel.test.tsx`

### Phase 3: NightTabPanel — New Inline Wrapper Component

- [ ] Create [`NightTabPanel.tsx`](../../UI/src/components/NightPhase/NightTabPanel.tsx) — thin wrapper that renders `FlashcardCarousel` inline in the tab content area
- [ ] Extract night-start and completion logic from [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx):
  - `handleUpdateProgress`
  - `handleUpdateNotes`
  - `handleUpdateSelection`
  - `handleComplete`
- [ ] NightTabPanel is a normal flex-child (`flex: 1, overflow: hidden`), NOT a `position: fixed` overlay
- [ ] Apply the dark gradient background styling to the tab content area
- [ ] Pass `setNightCardIndex` as the `onCardChange` callback to FlashcardCarousel
- [ ] Create tests in `NightTabPanel.test.tsx`

### Phase 4: PhaseBar — Remove Dialog, Add Callbacks

- [ ] Remove the night mode confirmation dialog from [`PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx)
- [ ] Unblock Night→Day switching (remove the guard that prevents clicking Day during Night phase)
- [ ] Add `onNightClick` callback prop — called when user clicks Night chip
- [ ] Add `onDayClick` callback prop — called when user clicks Day chip
- [ ] Remove any confirmation dialog state and handlers
- [ ] Update tests in `PhaseBar.test.tsx` — remove dialog tests, add callback tests
- [ ] Update `PhaseBar.stories.tsx` to reflect the new behavior

### Phase 5: GameViewPage — Wire Together

- [ ] Render `NightTabPanel` inline in the tab content area when Night phase is active (replacing whatever bottom tab content was showing)
- [ ] When Night phase is not active, render the normal 4 bottom tabs
- [ ] Remove [`NightPhaseOverlay`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) import and rendering
- [ ] Remove moon icon button from the AppBar
- [ ] Wire PhaseBar `onNightClick` to: dispatch `START_NIGHT` (if no active night) or resume (if night in progress)
- [ ] Wire PhaseBar `onDayClick` to: switch view back to Day tabs (night progress preserved)
- [ ] Update tests in `GameViewPage.test.tsx` for the new inline night behavior

### Phase 6: Delete NightPhaseOverlay

- [ ] Delete [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx)
- [ ] Delete [`NightPhaseOverlay.test.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.test.tsx)
- [ ] Verify no other files import or reference NightPhaseOverlay

### Phase 7: Tests & Storybook Updates

- [ ] Ensure all new components have tests with meaningful coverage
- [ ] Add Storybook stories for `NightTabPanel` if it has visual content worth demonstrating
- [ ] Update any Storybook stories that reference the old overlay behavior
- [ ] Run full test suite and verify all tests pass

### Phase 8: Development Checklist

- [ ] `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
- [ ] `cd UI && npx eslint .` — Linting (0 errors)
- [ ] `cd UI && npm test` — All tests pass

---

## 5. Files Affected

### New Files

| File | Purpose |
|------|---------|
| [`UI/src/components/NightPhase/NightTabPanel.tsx`](../../UI/src/components/NightPhase/NightTabPanel.tsx) | Inline wrapper for FlashcardCarousel — replaces NightPhaseOverlay |
| [`UI/src/components/NightPhase/NightTabPanel.test.tsx`](../../UI/src/components/NightPhase/NightTabPanel.test.tsx) | Tests for NightTabPanel |

### Modified Files

| File | Change |
|------|--------|
| [`UI/src/context/GameContext.tsx`](../../UI/src/context/GameContext.tsx) | Add `SET_NIGHT_CARD_INDEX` action + `setNightCardIndex` helper |
| [`UI/src/context/GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) | Tests for new reducer action |
| [`UI/src/components/NightPhase/FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx) | Add `onCardChange` callback prop |
| [`UI/src/components/NightPhase/FlashcardCarousel.test.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.test.tsx) | Tests for `onCardChange` callback |
| [`UI/src/components/PhaseBar/PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx) | Remove confirmation dialog, unblock Night→Day, add `onNightClick`/`onDayClick` callback props |
| [`UI/src/components/PhaseBar/PhaseBar.test.tsx`](../../UI/src/components/PhaseBar/PhaseBar.test.tsx) | Remove dialog tests, add callback tests |
| [`UI/src/components/PhaseBar/PhaseBar.stories.tsx`](../../UI/src/components/PhaseBar/PhaseBar.stories.tsx) | Update stories for new behavior |
| [`UI/src/pages/GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx) | Render NightTabPanel inline when Night active; remove NightPhaseOverlay import + moon icon; wire PhaseBar callbacks |
| [`UI/src/pages/GameViewPage.test.tsx`](../../UI/src/pages/GameViewPage.test.tsx) | Update tests for inline night tab behavior |

### Deleted Files

| File | Reason |
|------|--------|
| [`UI/src/components/NightPhase/NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) | Replaced by NightTabPanel — no longer needed |
| [`UI/src/components/NightPhase/NightPhaseOverlay.test.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.test.tsx) | Tests replaced by NightTabPanel tests |

### Unchanged Files

| File | Reason |
|------|--------|
| [`UI/src/components/NightOrder/NightOrderTab.tsx`](../../UI/src/components/NightOrder/NightOrderTab.tsx) | Always shows reference list — no changes |
| [`UI/src/components/NightPhase/NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) | Card rendering unchanged |
| [`UI/src/components/NightPhase/NightProgressBar.tsx`](../../UI/src/components/NightPhase/NightProgressBar.tsx) | Progress bar unchanged |
| [`UI/src/components/NightPhase/StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx) | Structural card unchanged |
| [`UI/src/components/NightPhase/SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx) | Sub-action checklist unchanged |
| NightHistoryDrawer, NightHistoryReview | Stay as overlay — review past data, not active gameplay |
| Character data files | Never modified |

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M14 (Night Flashcard UX) | `NightFlashcard.tsx` (minor) | M15 changes carousel navigation; M14 changes card content. Low conflict risk. |
| M19 (Night History) | `GameContext.tsx` | Both milestones modify game context — M15 adds `SET_NIGHT_CARD_INDEX`, M19 adds history editing actions. Additive changes, but should coordinate on reducer structure. |

---

## 6. Dependencies

**None.** This milestone can run in parallel with all other milestones (M13, M14, M16–M19).

Minor coordination needed with M19 on [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) since both milestones add reducer actions. However, the changes are additive and unlikely to conflict.

---

## 7. Testing Requirements

### Unit Tests

- [ ] `GameContext.test.tsx`: Test `SET_NIGHT_CARD_INDEX` action updates `nightProgress.currentCardIndex` correctly
- [ ] `GameContext.test.tsx`: Test `SET_NIGHT_CARD_INDEX` is a no-op when `nightProgress` is null
- [ ] `FlashcardCarousel.test.tsx`: Test `onCardChange` callback fires on card navigation
- [ ] `FlashcardCarousel.test.tsx`: Test carousel works correctly without `onCardChange` (optional prop)
- [ ] `NightTabPanel.test.tsx`: Test renders FlashcardCarousel inline (no fixed positioning or overlay)
- [ ] `NightTabPanel.test.tsx`: Test passes `setNightCardIndex` as `onCardChange` to FlashcardCarousel
- [ ] `NightTabPanel.test.tsx`: Test handles night completion correctly
- [ ] `PhaseBar.test.tsx`: Test Night chip click calls `onNightClick` callback (no dialog)
- [ ] `PhaseBar.test.tsx`: Test Day chip click calls `onDayClick` callback (unblocked during Night)
- [ ] `PhaseBar.test.tsx`: Test no confirmation dialog is rendered
- [ ] `GameViewPage.test.tsx`: Test Night chip click renders inline flashcard panel (no overlay)
- [ ] `GameViewPage.test.tsx`: Test Day chip click returns to normal bottom tabs
- [ ] `GameViewPage.test.tsx`: Test switching Day→Night→Day→Night preserves card position
- [ ] `GameViewPage.test.tsx`: Test night is NOT complete after viewing all cards
- [ ] `GameViewPage.test.tsx`: Test "Complete Night" button finalizes the night
- [ ] `GameViewPage.test.tsx`: Test moon icon is not present in the AppBar
- [ ] `GameViewPage.test.tsx`: Test Night Order tab (index 3) always shows reference list
- [ ] Verify deleted NightPhaseOverlay tests are cleaned up (no orphaned test code)

### Storybook Tests

- [ ] Update `PhaseBar.stories.tsx` to reflect no confirmation dialog and new callback props
- [ ] Add stories for `NightTabPanel` showing the inline flashcard view
- [ ] Ensure any stories referencing NightPhaseOverlay are removed or updated

### Integration Verification

- [ ] Run the app and verify:
  - Clicking Night chip in PhaseBar immediately shows inline flashcards
  - Clicking Day chip returns to normal bottom tabs with night progress preserved
  - Clicking Night chip again returns to the saved flashcard position
  - Night only completes via "Complete Night" button
  - Moon icon is no longer in the AppBar
  - Night Order tab (index 3) always shows the reference list, even during an active night
  - NightHistoryDrawer and NightHistoryReview still work as overlays

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] No confirmation dialog appears when switching to Night mode
- [ ] Clicking the Night chip in PhaseBar immediately displays the flashcard carousel **inline in the tab content area**
- [ ] No full-screen overlay is used for the active night — `NightPhaseOverlay.tsx` is deleted
- [ ] Switching from Night to Day (via PhaseBar Day chip) returns normal bottom tabs with night progress preserved
- [ ] Switching back to Night (via PhaseBar Night chip) resumes at the saved card position
- [ ] Day↔Night switching is free and unblocked in **both directions** via PhaseBar
- [ ] Night is ONLY considered complete when the user explicitly presses "Complete Night"
- [ ] Viewing all flashcards without pressing "Complete Night" does NOT finalize the night
- [ ] The moon icon button is removed from the AppBar
- [ ] The Night Order tab (index 3) **always** shows the reference list, even during an active night
- [ ] All 4 bottom tabs remain unchanged (Town Square, Players, Script, Night Order)
- [ ] NightHistoryDrawer and NightHistoryReview continue to work as overlays (unchanged)
- [ ] Card position is synced to GameContext via `SET_NIGHT_CARD_INDEX` action
- [ ] Starting a new night (after completing the previous one) resets to the first flashcard
- [ ] NightPhaseOverlay tests are removed; NightTabPanel tests cover the replacement logic
- [ ] New tests cover inline rendering, phase switching, position persistence, and completion logic
- [ ] TypeScript compilation, ESLint, and test suite all pass
