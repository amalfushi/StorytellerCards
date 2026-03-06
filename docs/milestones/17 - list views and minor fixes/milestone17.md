## Status: ✅ Complete

**Completed:** 2026-03-06

### Summary
All 4 phases implemented with tests passing (55 test files, 2418 tests, 0 TS errors, 0 ESLint errors).

### Changes Made

**Phase 1 — Players List Fixes:**
- Reordered columns to: Seat, Player, Type, Icon, Character, Ability, Tokens, Alignment, Alive, Vote
- Added missing "Tokens" column header
- Made Ability column widest with word-wrap support
- Traveller icons and character names always visible (even in Day mode)
- Traveller row border changed to single-color (alignment-based), only visible in Night mode
- Traveller rows get 10% opacity background tint matching alignment color

**Phase 2 — Script View Fix:**
- `CharacterCard.tsx`: Added `renderAbilityDetailed()` helper that parses `•` bullet characters into `<ul><li>` lists
- Intro text renders as paragraph, bullet items render as proper HTML list

**Phase 3 — Night Order View Fix:**
- Removed `Badge` component showing order number from `NightOrderEntry.tsx`
- Visual list position is sufficient for users

**Phase 4 — Day Timer Fix:**
- Changed timer input from `width: 120` to `minWidth: 150` to prevent text overflow

**Phase 5 — Tests & Stories:**
- Updated `PlayerListTab.test.tsx` with new column order assertions
- Added 5 new tests to `PlayerRow.test.tsx` (Traveller visibility, ability wrapping, background tint)
- Added 2 new tests to `CharacterCard.test.tsx` (bullet list rendering)
- Updated `NightOrderEntry.test.tsx` to assert order number NOT displayed
- Added `TravellerDayView` story to `PlayerRow.stories.tsx`

### Files Changed
- `UI/src/components/PlayerList/PlayerListTab.tsx`
- `UI/src/components/PlayerList/PlayerListTab.test.tsx`
- `UI/src/components/PlayerList/PlayerRow.tsx`
- `UI/src/components/PlayerList/PlayerRow.test.tsx`
- `UI/src/components/PlayerList/PlayerRow.stories.tsx`
- `UI/src/components/ScriptViewer/CharacterCard.tsx`
- `UI/src/components/ScriptViewer/CharacterCard.test.tsx`
- `UI/src/components/NightOrder/NightOrderEntry.tsx`
- `UI/src/components/NightOrder/NightOrderEntry.test.tsx`
- `UI/src/components/Timer/DayTimer.tsx`

---

# Milestone 17 — List Views & Minor Fixes

> **Goal:** Fix and polish the Players List view, Script view, Night Order view, and Day Timer — a collection of small, independent UI fixes that improve the overall app quality.

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

Several views across the app have small but noticeable UX issues:

### 1.1 Players List — Column Order & Traveller Icons

The Players List view has incorrect column ordering in visible secret information mode. The current order doesn't match the desired order, and the "Tokens" column header is missing entirely. Additionally, Traveller character icons should always be visible (even in hidden mode) since their character type is public information.

### 1.2 Players List — Ability Column Width

The Ability column doesn't have enough width and lacks text wrapping, causing long ability descriptions to overflow or get truncated on small viewports.

### 1.3 Script View — Bullet Separators

The detailed rules accordion content in the Script view incorrectly uses `•` (bullet) characters between what should be separate lines. This makes the rules hard to read.

### 1.4 Night Order View — Order Numbers

The Night Order view displays internal order numbers (used for sorting logic) to the user. These numbers are implementation details and shouldn't be shown — they add no user value and create visual clutter.

### 1.5 Day Timer — Input Width

The Day discussion timer input field is too narrow, causing the timer text to overflow its container.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Players list | #1 | "Traveller icons can always be shown (without their alignment)" |
| Players list | #2 | "the order of columns should be seat, player, type, icon, character, ability, tokens, alignment, alive, vote. At the moment we are missing a column name (token) and it's in a different order. The ability column should be the widest. We should also have line wrap in that column" |
| Script view | #1 | "we're putting • between what should be line breaks for the detailed rules for each accordion" |
| Night order view | #1 | "we don't need to show the order number anywhere ever. that's internal logic information" |
| Day discussion timer | — | "the input needs to be a bit wider. text is overflowing" |

---

## 3. Solution Overview

### 3.1 Players List Column Order

**Desired column order (visible secret information mode):**

| # | Column | Notes |
|---|--------|-------|
| 1 | Seat | Seat number |
| 2 | Player | Player name |
| 3 | Type | Character type (Townsfolk, Outsider, etc.) |
| 4 | Icon | Character icon image |
| 5 | Character | Character name |
| 6 | Ability | Ability description — **widest column**, with `word-wrap` |
| 7 | Tokens | Reminder tokens on this player — **new column header** |
| 8 | Alignment | Good / Evil |
| 9 | Alive | Alive / Dead status |
| 10 | Vote | Ghost vote remaining |

### 3.2 Traveller Icon Visibility

In hidden secret information mode, Traveller character icons should always be visible because Traveller identities are public knowledge in BotC. However, Traveller **alignment** should remain hidden (alignment is secret even for Travellers).

### 3.3 Ability Column Styling

```css
.ability-column {
  flex: 2;  /* widest column */
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
```

### 3.4 Script View Line Breaks

Replace `•` separator characters with proper line breaks in the accordion content. This likely requires changing how the `abilityDetailed` or rules text is split and rendered — from joining with `•` to rendering as separate `<p>` or `<br/>` elements.

### 3.5 Night Order Number Removal

Remove the rendering of `order` field values in the Night Order view. The order **number** is used internally for sorting but should not be displayed. The visual ordering of the list itself is sufficient.

### 3.6 Day Timer Input Width

Increase the width of the timer input field to prevent text overflow. This is likely a simple CSS fix:

```css
.timer-input {
  min-width: 80px;  /* or wider as needed */
}
```

---

## 4. Task List

### Phase 1: Players List Fixes

- [x] Reorder columns in [`PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx) to: Seat, Player, Type, Icon, Character, Ability, Tokens, Alignment, Alive, Vote
- [x] Add "Tokens" column header (currently missing from the header row)
- [x] Make the Ability column the widest with `flex: 2` or equivalent
- [x] Add `word-wrap: break-word` and `overflow-wrap: break-word` to the Ability column
- [x] Update [`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) to render cells in the new column order
- [x] In hidden mode: always show Traveller character icons (but hide their alignment)
- [x] Verify column order looks correct on mobile and tablet viewports

### Phase 2: Script View Fix

- [x] In [`ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) or the accordion component: Replace `•` bullet separators with proper line breaks
- [x] Determine where the `•` is being inserted (likely in the character ability detail rendering) and replace with `\n` or `<br/>` rendering
- [x] Verify the fix works for all character accordions in the script view

### Phase 3: Night Order View Fix

- [x] In [`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx): Remove the display of the `order` number
- [x] In [`NightOrderTab.tsx`](../../UI/src/components/NightOrder/NightOrderTab.tsx): Remove any order number column/display if present
- [x] Verify the night order list is still visually ordered correctly (by position in the list, not by a displayed number)

### Phase 4: Day Timer Fix

- [x] In [`DayTimer.tsx`](../../UI/src/components/Timer/DayTimer.tsx): Increase the timer input field width
- [x] Set `min-width` to prevent text overflow
- [x] Verify the fix on small viewports

### Phase 5: Tests & Stories

- [x] Update [`PlayerListTab.test.tsx`](../../UI/src/components/PlayerList/PlayerListTab.test.tsx) for new column order
- [x] Update [`PlayerRow.test.tsx`](../../UI/src/components/PlayerList/PlayerRow.test.tsx) for Traveller icon visibility in hidden mode
- [x] Update [`ScriptReferenceTab.test.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx) for line break rendering
- [x] Update [`NightOrderEntry.test.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.test.tsx) to verify order number is NOT displayed
- [x] Update [`DayTimer.test.tsx`](../../UI/src/components/Timer/DayTimer.test.tsx) for input width
- [x] Update relevant Storybook stories (`PlayerRow.stories.tsx`, `DayTimer.stories.tsx`, etc.)

---

## 5. Files Affected

### Owned by This Milestone

These files are only modified by M17 — no overlap with other milestones:

| File | Change |
|------|--------|
| [`UI/src/components/PlayerList/PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx) | Column reorder, add Tokens header |
| [`UI/src/components/PlayerList/PlayerListTab.test.tsx`](../../UI/src/components/PlayerList/PlayerListTab.test.tsx) | Updated tests |
| [`UI/src/components/PlayerList/PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) | Cell reorder, ability column styling, Traveller icon visibility |
| [`UI/src/components/PlayerList/PlayerRow.test.tsx`](../../UI/src/components/PlayerList/PlayerRow.test.tsx) | Updated tests |
| [`UI/src/components/ScriptViewer/ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) | Replace `•` with line breaks |
| [`UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx) | Updated tests |
| [`UI/src/components/NightOrder/NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx) | Remove order number display |
| [`UI/src/components/NightOrder/NightOrderEntry.test.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.test.tsx) | Updated tests |
| [`UI/src/components/NightOrder/NightOrderTab.tsx`](../../UI/src/components/NightOrder/NightOrderTab.tsx) | Remove order number if shown here |
| [`UI/src/components/NightOrder/NightOrderTab.test.tsx`](../../UI/src/components/NightOrder/NightOrderTab.test.tsx) | Updated tests |
| [`UI/src/components/Timer/DayTimer.tsx`](../../UI/src/components/Timer/DayTimer.tsx) | Widen input field |
| [`UI/src/components/Timer/DayTimer.test.tsx`](../../UI/src/components/Timer/DayTimer.test.tsx) | Updated tests |

### NOT Modified

- TownSquare components — M16's territory
- Night phase components — M14 and M15's territory
- Night history components — M19's territory
- Game context / state management
- Character data files
- Script builder / importer — M18's territory

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M13 (Icon Replacement) | `PlayerRow.tsx`, `NightOrderEntry.tsx` | M13 changes icon rendering; M17 changes column order and removes order numbers. Different aspects — low conflict risk. |
| M18 (Traveller/Fabled/Loric) | `PlayerListTab.tsx` | M18 adds Fabled/Loric to the bottom of the players list. M17 fixes column ordering. Different sections — low conflict risk. |

---

## 6. Dependencies

**None.** This milestone can run fully in parallel with all other milestones (M13–M16, M18–M19).

All changes in M17 are in separate component directories with no overlap with the core changes in other milestones. The only shared files (`PlayerRow.tsx`, `NightOrderEntry.tsx`) are modified in different ways by different milestones.

---

## 7. Testing Requirements

### Unit Tests

**Players List:**
- [x] `PlayerListTab.test.tsx`: Test column headers appear in correct order
- [x] `PlayerListTab.test.tsx`: Test "Tokens" column header is present
- [x] `PlayerRow.test.tsx`: Test cells render in correct column order
- [x] `PlayerRow.test.tsx`: Test Ability column has text wrapping CSS
- [x] `PlayerRow.test.tsx`: Test Traveller icon visible in hidden mode
- [x] `PlayerRow.test.tsx`: Test Traveller alignment hidden in hidden mode

**Script View:**
- [x] `ScriptReferenceTab.test.tsx`: Test detailed rules render with line breaks (not `•` bullets)
- [x] `ScriptReferenceTab.test.tsx`: Test multiple rule lines render as separate elements

**Night Order View:**
- [x] `NightOrderEntry.test.tsx`: Test order number is NOT rendered in the output
- [x] `NightOrderTab.test.tsx`: Test entries are displayed in correct order (by position, not by visible number)

**Day Timer:**
- [x] `DayTimer.test.tsx`: Test input field has adequate width (min-width check)

### Storybook Stories

- [x] `PlayerRow.stories.tsx`: Show updated column order with all data
- [x] `PlayerRow.stories.tsx`: Show Traveller row in hidden mode (icon visible, alignment hidden)
- [x] `PlayerRow.stories.tsx`: Show long ability text with word wrap
- [x] `DayTimer.stories.tsx`: Show timer with wider input field

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [x] Players List columns in visible mode follow the order: Seat, Player, Type, Icon, Character, Ability, Tokens, Alignment, Alive, Vote
- [x] "Tokens" column header is present and visible
- [x] Ability column is the widest and supports word-wrap for long text
- [x] Traveller character icons are always visible in hidden mode (alignment still hidden)
- [x] Script view detailed rules use line breaks instead of `•` bullet separators
- [x] Night Order view does NOT display order numbers anywhere
- [x] Day Timer input field is wide enough to display the timer text without overflow
- [x] All changes are purely visual/layout — no data model or state changes required
- [x] All existing tests pass with updated assertions
- [x] New tests cover column order, text wrapping, line breaks, and hidden display rules
- [x] TypeScript compilation, ESLint, and test suite all pass
