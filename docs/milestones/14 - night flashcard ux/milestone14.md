# Milestone 14 — Night Flashcard UX

> **Goal:** Improve the night flashcard user experience by reducing checkbox clutter to only actionable items, fixing the indentation hierarchy for sub-instructions, and improving the power description text styling.

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

The current night flashcard rendering has three UX issues:

### 1.1 Too Many Checkboxes

Every sub-action line in the flashcard gets a checkbox, including non-actionable informational steps like "Put the Poisoner to sleep" or "Wake the target." This creates visual clutter and makes it harder for the Storyteller to track which steps actually require a decision or physical action.

### 1.2 Confusing Indentation

The hierarchy between primary actions and their sub-steps is not visually clear. The current layout makes it difficult to follow the flow, especially for characters with conditional logic (`if` blocks) and compound actions.

### 1.3 Power Description Styling

The `abilityShort` / power description text at the top of each flashcard is currently rendered in italics, which is harder to read on small mobile screens. It should be bold and slightly larger to serve as a quick reference.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Night cards | #1 | "there are too many checkboxes in the night flashcards. we should only be showing checkmarks on actionable things" |
| Night cards | #2 | "The indenting is weird to follow" — includes ideal layout example |
| Night cards | #4 | "The power short description text should be a bit larger and/or default to bolded instead of italics" |

### Ideal Layout (from user feedback)

```
[] The Pit-Hag chooses a player & a character.
    Choose a player
    Choose a character

[] If they chose a character that is not in play: Put the Pit-Hag to sleep.
    Wake the target.
    Show the YOU ARE token & their new character token.
```

**Key observations from the ideal layout:**
- Top-level actionable instructions get checkboxes
- Sub-steps (indented) do NOT get checkboxes — they are details under the parent action
- `if` conditional blocks get their own checkbox at the same level as other actions
- Children of `if` blocks are indented without checkboxes

---

## 3. Solution Overview

### 3.1 Checkbox Logic

Redesign the checkbox rendering rules:

| Step Type | Gets Checkbox? | Indentation |
|-----------|---------------|-------------|
| Top-level action (e.g., "The Poisoner chooses a player") | ✅ Yes | None (level 0) |
| Sub-step detail (e.g., "Choose a player") | ❌ No | Indented under parent |
| Conditional `if` block (e.g., "If they chose a character not in play...") | ✅ Yes | None (level 0) |
| Children of `if` block (e.g., "Wake the target") | ❌ No | Indented under `if` |

### 3.2 Determining Actionable Steps

The `subActions` array on each `NightAction` contains all steps. To determine which are "actionable" (get checkboxes):

- **Option A**: Use the `isConditional` flag on `NightSubAction` — conditional steps and their immediate parent action get checkboxes
- **Option B**: Add a new `isActionable` boolean to `NightSubAction` — explicitly mark which steps get checkboxes
- **Option C**: Use indentation/grouping metadata — group sub-actions into parent-child relationships

**Recommended approach:** Option B or a combination — the rendering component determines actionability based on the sub-action structure. Top-level actions (the first step describing what the character does) and `if` conditionals are actionable. Detail steps that elaborate on *how* to execute the parent action are not.

### 3.3 Visual Hierarchy

```
┌─────────────────────────────────────────────┐
│  [Character Icon]  CHARACTER NAME            │
│  **Each night, choose a player...**          │  ← Bold, larger font
│                                              │
│  ☐ The Poisoner chooses a player.            │  ← Checkbox, level 0
│      Choose a player                         │  ← No checkbox, indented
│                                              │
│  ☐ If the Poisoner chose a new target:       │  ← Checkbox, level 0
│      Mark the new target with POISONED.       │  ← No checkbox, indented
│      Remove POISONED from the old target.     │  ← No checkbox, indented
└─────────────────────────────────────────────┘
```

### 3.4 Power Description Styling

Change `abilityShort` rendering from:
```css
font-style: italic;
font-size: 0.875rem;  /* current */
```
To:
```css
font-weight: bold;
font-size: 1rem;      /* slightly larger */
```

---

## 4. Task List

### Phase 1: Analyze Current Structure

- [ ] Review [`SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx) to understand current checkbox rendering logic
- [ ] Review [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) to understand how `subActions` and `choices` are laid out
- [ ] Catalog all characters' `subActions` arrays to identify the parent/child grouping patterns
- [ ] Determine if `NightSubAction` type needs a new field (e.g., `isActionable`, `indent`, or `parentId`)

### Phase 2: Update Sub-Action Rendering

- [ ] Modify [`SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx) to only render checkboxes on actionable top-level steps
- [ ] Add indentation styling for sub-steps (children of actionable steps)
- [ ] Handle `isConditional` sub-actions: render with checkbox at level 0, children indented
- [ ] Ensure checkboxes still track completion state correctly with the reduced set
- [ ] Update completion tracking logic — night action completion should be based on the reduced checkbox set (only actionable items need to be checked)

### Phase 3: Update Power Description Styling

- [ ] In [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx), change `abilityShort` text from italics to bold
- [ ] Increase `abilityShort` font size slightly (e.g., `0.875rem` → `1rem`)
- [ ] Verify the styling works across card widths on mobile viewports

### Phase 4: Update Night Action Completion Logic

- [ ] Review how `SubActionChecklist` completion state feeds into the night phase progress/completion
- [ ] Ensure the "all actions complete" check only considers actionable (checkbox-bearing) steps
- [ ] Verify `NightProgressBar` correctly reflects the reduced checkbox count

### Phase 5: Update Storybook Stories

- [ ] Update [`SubActionChecklist.stories.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.stories.tsx) to demonstrate the new layout
- [ ] Update [`NightFlashcard.stories.tsx`](../../UI/src/components/NightPhase/NightFlashcard.stories.tsx) to show bold power description
- [ ] Add a story variant showing a character with `if` conditionals (e.g., Pit-Hag)

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/NightPhase/SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx) | Core change — checkbox visibility & indentation logic |
| [`UI/src/components/NightPhase/SubActionChecklist.test.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.test.tsx) | Updated tests for new rendering behavior |
| [`UI/src/components/NightPhase/SubActionChecklist.stories.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.stories.tsx) | Updated stories |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/NightPhase/NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) | Power description styling (bold, larger font) |
| [`UI/src/components/NightPhase/NightFlashcard.test.tsx`](../../UI/src/components/NightPhase/NightFlashcard.test.tsx) | Updated tests for styling changes |
| [`UI/src/components/NightPhase/NightFlashcard.stories.tsx`](../../UI/src/components/NightPhase/NightFlashcard.stories.tsx) | Updated stories |
| [`UI/src/components/NightPhase/NightProgressBar.tsx`](../../UI/src/components/NightPhase/NightProgressBar.tsx) | May need update if progress calculation changes |
| [`UI/src/types/index.ts`](../../UI/src/types/index.ts) | Possibly add `isActionable` or `indent` to `NightSubAction` |

### NOT Modified

- Character data files in `UI/src/data/characters/` — if `NightSubAction` gains new fields, existing characters would need updates, but this should be done carefully to avoid conflicting with other milestones
- Night order logic (`_nightOrder.ts`, `nightOrderFilter.ts`)
- Night history components (M19's territory)
- Game context / state management

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M13 (Icon Replacement) | `NightFlashcard.tsx` | M13 changes icon rendering; M14 changes step layout and text styling. Different sections of the component — low conflict risk. |
| M15 (Day/Night Tab Workflow) | `FlashcardCarousel.tsx` | M15 changes navigation/tab logic; M14 changes card content rendering. Minimal overlap. |
| M19 (Night History) | Similar UI patterns | M19 operates on history components, not live flashcard components. No file overlap. |

---

## 6. Dependencies

**None.** This milestone can run in parallel with all other milestones (M13, M15–M19).

If `NightSubAction` type needs changes (e.g., adding `isActionable`), coordinate with any milestone that might also modify [`types/index.ts`](../../UI/src/types/index.ts). However, the type change is additive (new optional field) and low-risk for merge conflicts.

---

## 7. Testing Requirements

### Unit Tests

- [ ] `SubActionChecklist.test.tsx`: Test that only actionable steps render checkboxes
- [ ] `SubActionChecklist.test.tsx`: Test that sub-steps render without checkboxes but with indentation
- [ ] `SubActionChecklist.test.tsx`: Test that `isConditional` steps render with checkboxes
- [ ] `SubActionChecklist.test.tsx`: Test that children of conditional steps render indented without checkboxes
- [ ] `SubActionChecklist.test.tsx`: Test completion tracking only counts actionable (checkbox) items
- [ ] `NightFlashcard.test.tsx`: Test `abilityShort` renders with bold styling (not italic)
- [ ] `NightProgressBar.test.tsx`: Verify progress calculation with reduced checkbox count

### Storybook Tests

- [ ] `SubActionChecklist.stories.tsx`: Story with simple character (all top-level actions)
- [ ] `SubActionChecklist.stories.tsx`: Story with conditional character (Pit-Hag style)
- [ ] `SubActionChecklist.stories.tsx`: Story with compound actions and sub-steps
- [ ] `NightFlashcard.stories.tsx`: Story showing bold power description

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] Only top-level actionable instructions and `if` conditional blocks have checkboxes
- [ ] Sub-steps (details under an action) are indented and displayed without checkboxes
- [ ] The visual hierarchy matches the ideal layout from the user feedback (see Section 2)
- [ ] Night action completion tracking works correctly with the reduced checkbox set
- [ ] `NightProgressBar` accurately reflects progress based on actionable items only
- [ ] `abilityShort` / power description text is rendered in bold (not italic) with slightly larger font
- [ ] Night flashcard completion state resets correctly per night (existing behavior preserved)
- [ ] All existing tests pass with updated assertions
- [ ] New tests cover the checkbox visibility and indentation logic
- [ ] Storybook stories demonstrate the new layout and styling
- [ ] TypeScript compilation, ESLint, and test suite all pass
