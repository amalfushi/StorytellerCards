# Milestone 25 — Night Flashcard Enhancements

## Status: ✅ Complete

- **Completed:** 2025-07-07
- **Summary:** Implemented all 6 phases of night flashcard enhancements including richer choice dropdowns with player/character context and icons, reminder token placement status and navigation, signal recording (finger signals and thumbs up/down), chip layout reorganization, and notes UX improvements.
- **Key changes:**
  - `NightChoiceSelector.tsx` — Player dropdowns show character names with avatars; character dropdowns show player names
  - `NightFlashcard.tsx` — Complete layout reorganization: type chip upper-left, affecting tokens right of icon, reminder tokens with placement status below separator, signal controls, notes with subtle background and pre-population
  - `FlashcardCarousel.tsx` — Passes new props (characterLookup, previousNotes, onReminderTokenClick)
  - `NightTabPanel.tsx` / `GameViewPage.tsx` — Reminder token click navigates to Day view TownSquare tab
  - `signalDetection.ts` — New utility for detecting finger/thumbs signal patterns in sub-actions
- **Tests:** 3666 tests passing across 66 files, 0 TypeScript errors, 0 ESLint errors

> **Goal:** Improve the night flashcard experience with better reminder token interaction, richer choice dropdowns showing player↔character context, smarter chip layout, improved notes UX, and signal recording.

Based on feedback from [`post23feedback.md`](../post23feedback.md).

---

## Table of Contents

1. [Source Feedback](#1-source-feedback)
2. [Task List](#2-task-list)
3. [Files Affected](#3-files-affected)
4. [Testing Requirements](#4-testing-requirements)
5. [Acceptance Criteria](#5-acceptance-criteria)

---

## 1. Source Feedback

### Reminder Token Placement from Flashcards
- Show where a reminder token already is if it's placed on the TownSquare (e.g., grey it out and show "Player 3 (Washerwoman)" below it)
- Clicking a reminder token in the flashcard should navigate back to the Day view to place that token on a player
- If the token relates to a choice dropdown and a player is already selected, highlight that player in the TownSquare with a drop shadow
- **Bonus**: After entering a choice (e.g., "Ogre chose Player 3"), show an actionable button: "Add [ogre icon] Friend reminder to Player 3" — place the token without leaving the night view

### Choice Dropdowns — Player/Character Context
- Player dropdowns should show: "Player 1 ([icon] Washerwoman)"
- Character dropdowns should show: "[icon] Washerwoman (Player 1)"
- This gives the Storyteller full context without switching views

### Signal Recording
- "Give a finger signal" steps (e.g., Mathematician) should have a number dropdown to record the shown number
- "Give a Thumbs Up or Thumbs Down" steps should have a yes/no toggle to record the signal
- Best effort — not all signals can be neatly categorized, but cover the common patterns

### Chip Layout Reorganization
The night flashcard is getting chip-heavy. Reorganize:
- **Character type chip** → upper-left of the content card
- **Active affecting reminder tokens** (e.g., "Faux Paw" from Lycanthrope on an Innkeeper) → right of the large character icon (similar to linear token layout on TownSquare)
- **Available reminder tokens** for the current character → below the separator line (Player N / Player M), above the night action checklist

### Notes Improvements
- Pre-populate with previous night's notes if they exist (carry forward)
- Allow vertical growth up to ~15% of viewport height if space allows
- More visible: give notes a subtle background (e.g., 10% white opacity) so it's not easy to miss

---

## 2. Task List

### Phase 1: Choice Dropdowns — Player/Character Context
- [x] Player choice dropdowns: render as "Player N ([icon] CharacterName)"
- [x] Character choice dropdowns: render as "[icon] CharacterName (Player N)"
- [x] Use `CharacterIconImage` component for inline icons
- [x] Handle cases where player has no character assigned (show just player name)

### Phase 2: Reminder Token Placement Interaction
- [x] Show placement status on each reminder token: if already placed, grey it out and show "Player N (Character)" below
- [x] Clicking a reminder token navigates to Day view (switch to TownSquare tab)
- [x] If a choice dropdown has a player selected, highlight that player's card in TownSquare with a drop shadow
- [x] **Bonus**: After a choice is entered, show inline "Add [icon] TokenName to Player N" button that places the token without leaving night view

### Phase 3: Signal Recording
- [x] Detect "finger signal" night action steps → render a number input/dropdown (0-5 or similar)
- [x] Detect "thumbs up/down" steps → render a yes/no toggle
- [x] Store signal values in night progress state
- [x] Display recorded signals in night history

### Phase 4: Chip Layout Reorganization
- [x] Move character type chip to upper-left of content card
- [x] Move active affecting reminders (tokens from OTHER characters placed on this player) to right of character icon
- [x] Move this character's available reminder tokens below the separator, above the checklist
- [x] Ensure layout works well on mobile viewports

### Phase 5: Notes UX Improvements
- [x] Pre-populate notes with previous night's notes (if any) as starting text
- [x] Allow vertical growth up to max ~15% viewport height
- [x] Add subtle background (10% white opacity or similar light tint) for visibility
- [x] Ensure notes section is visually distinct and not easy to miss

### Phase 6: Tests & Documentation
- [x] Tests for choice dropdown rendering with player/character context
- [x] Tests for reminder token placement status display
- [x] Tests for signal recording
- [x] Tests for notes pre-population
- [x] Milestone docs

---

## 3. Files Affected

| File | Change |
|------|--------|
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Chip layout, token placement, notes UX |
| `UI/src/components/NightPhase/NightChoiceSelector.tsx` | Player/character context in dropdowns |
| `UI/src/components/NightPhase/FlashcardCarousel.tsx` | Navigation back to Day view |
| `UI/src/components/NightPhase/NightTabPanel.tsx` | Day view switch on token click |
| `UI/src/context/GameContext.tsx` | Signal recording in night progress (append at end) |
| `UI/src/pages/GameViewPage.tsx` | Tab switching for token placement |

---

## 4. Testing Requirements

- [x] Choice dropdowns show "Player N (Character)" / "Character (Player N)" format
- [x] Placed reminder tokens show grey + placement info
- [x] Token click triggers day view navigation
- [x] Signal values recorded and displayed in night history
- [x] Notes pre-populate from previous night
- [x] Chip layout renders correctly on mobile viewports

---

## 5. Acceptance Criteria

- [x] Choice dropdowns show full player + character context with icons
- [x] Reminder tokens show placement status; clicking navigates to Day view for placement
- [x] Inline "Add token to Player N" button appears after choice entry (bonus)
- [x] Finger signals and thumbs up/down recorded in night progress
- [x] Chip layout reorganized: type upper-left, affecting tokens right of icon, available tokens above checklist
- [x] Notes pre-populated, subtly styled, vertically growable
- [x] All tests pass, 0 TS/ESLint errors
