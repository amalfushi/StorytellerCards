# Milestone 24 — UI Polish & Bug Fixes

## Status: ✅ Complete

**Completed:** 2026-03-09

### Summary
Addressed cross-cutting UI polish items and bug fixes from post-M23 feedback: fixed character selection header chips and 12-player distribution bug, added jinxes accordion to character detail modal, ensured reminder token visual consistency (type-colored chips with source icons) across all render locations, unified player list with shared action modal, fixed night history notes styling and editability, and added game deletion to session management.

> **Goal:** Address cross-cutting UI polish items, visual consistency fixes, and bug fixes from post-M23 feedback across character selection, player list, character detail modal, reminder tokens, night history, and session management.

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

### Select In-Play Characters
- Remove the total selected header chip — just show the per-type chips (Townsfolk: 5, Outsider: 1, etc.)
- Don't abbreviate character type names in the header counts (show "Townsfolk" not "TO")
- Add character icon to each character checkbox row
- Add a searchbox to filter characters
- **Bug**: 12-player game shows wrong minion count (3 instead of 2) and total shows n/13 instead of n/12
- Omit Travellers from this screen (added separately, may not be in the game at start)
- Rename to "Select Characters" (or "Game N: Select Characters")

### Assign Characters
- Atheist pre-game reminder text should be simplified to: "Atheist: No evil characters in the game."

### Character Detail Modal — Jinxes
- Jinxes should be in a **closed-by-default accordion** (rarely needed)
- **Exception**: jinxes that are "active" (both characters on the script/in the game) should be highlighted/shown

### Reminder Tokens (Global)
- Reminder token chips must be colored by source character type and show source character icon — **everywhere** in the app (character detail modal, token management modal, players list, night flashcards, etc.)
- Increase reminder token chip icon size by ~10% — currently hard to make out in night cards. Size must be consistent across all render locations.

### Player List
- Player action modal must be the **same modal** as TownSquare (not a different set of actions)
- Remove the Swap column — replace with an "edit" icon that opens the shared action modal
- Keep the Alignment column but change to show text ("Evil", "Good", "Unknown") instead of icons/colors — serves as a color accessibility option
- Add a toggle to show/hide the Alignment column (default: off)
- Remove the dash in empty Tokens column
- Rename "Tokens" column to "Reminders"

### Night History
- Notes text color should be white
- In edit mode, notes must be editable (verify this works)
- In the summary drawer, show both player name AND character name everywhere (currently may show only one)

### Sessions
- Add ability to **delete games** within a session

---

## 2. Task List

### Phase 1: Select Characters Fixes
- [x] Remove total selected header chip; keep only per-type chips
- [x] Use full type names (not abbreviations) in header chips
- [x] Add character icon to each character checkbox row
- [x] Add searchbox/filter input
- [x] **Fix bug**: 12-player distribution shows wrong minion/total count
- [x] Omit Traveller characters from this screen
- [x] Rename dialog title to "Select Characters" (or "Game N: Select Characters")

### Phase 2: Character Detail Modal — Jinxes Accordion
- [x] Wrap jinxes section in a closed-by-default MUI Accordion
- [x] If any jinxes are "active" (both characters on current script/game), auto-expand and highlight them
- [x] Non-active jinxes remain collapsed

### Phase 3: Reminder Token Visual Consistency
- [x] Audit ALL places reminder tokens are rendered across the app
- [x] Ensure every location uses source character type color + source character icon
- [x] Increase icon size by ~10% and make consistent across all locations
- [x] Locations to check: CharacterDetailModal, TokenManager, NightFlashcard, PlayerList, NightHistoryReview, SetupChecklist, PlayerActionsModal

### Phase 4: Player List Fixes
- [x] Use the same PlayerActionsModal as TownSquare (share the component)
- [x] Remove Swap column; add "edit" icon button per row to open the modal
- [x] Alignment column: change to text ("Evil"/"Good"/"Unknown"), add show/hide toggle (default off)
- [x] Remove dash placeholder in empty Reminders cells
- [x] Rename "Tokens" column header to "Reminders"

### Phase 5: Night History Fixes
- [x] Notes text color → white
- [x] Verify edit mode allows note editing (fix if broken)
- [x] Summary drawer: show "Player N (CharacterName)" format everywhere, not just one

### Phase 6: Session Management — Delete Games
- [x] Add delete game action to session view (with confirmation dialog)
- [x] Add `DELETE_GAME` reducer action to SessionContext (append at end)
- [x] Remove game from localStorage on delete

### Phase 7: Misc Fixes
- [x] Atheist pre-game reminder text → "Atheist: No evil characters in the game."

### Phase 8: Tests & Documentation
- [x] Update tests for all changed components
- [x] Milestone docs and progress tracking

---

## 3. Files Affected

| File | Change |
|------|--------|
| `UI/src/components/Setup/CharacterSelection.tsx` | Header chips, icons, search, bug fix, travellers, rename |
| `UI/src/components/common/CharacterDetailModal.tsx` | Jinxes accordion |
| `UI/src/components/TownSquare/TokenManager.tsx` | Icon size, color consistency |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Token icon size consistency |
| `UI/src/components/common/TokenChips.tsx` | Shared token chip rendering (color, icon, size) |
| `UI/src/components/PlayerList/PlayerListTab.tsx` | Shared modal, column rename, remove swap/dash |
| `UI/src/components/PlayerList/PlayerRow.tsx` | Edit icon, remove swap button |
| `UI/src/components/NightHistory/NightHistoryReview.tsx` | Notes color, edit mode |
| `UI/src/components/NightHistory/NightHistoryDrawer.tsx` | Summary format |
| `UI/src/context/SessionContext.tsx` | DELETE_GAME action |
| `UI/src/components/Setup/SetupChecklist.tsx` | Atheist text fix |
| `UI/src/data/playerCountRules.ts` | 12-player distribution bug fix |

---

## 4. Testing Requirements

- [x] 12-player distribution returns correct counts (2 minions, total = 12)
- [x] Character selection: search filters correctly, travellers excluded, icons render
- [x] Jinxes accordion: collapsed by default, active jinxes highlighted
- [x] Reminder tokens: consistent color + icon across all render locations
- [x] Player list: edit icon opens shared modal, column renamed
- [x] Delete game: removes from session, confirmation dialog works
- [x] Night history: notes white, editable in edit mode, summary shows both names

---

## 5. Acceptance Criteria

- [x] Select Characters shows per-type counts (full names), character icons, searchbox, no travellers
- [x] 12-player distribution bug fixed
- [x] Jinxes in character modal are collapsed by default; active jinxes highlighted
- [x] Reminder tokens visually consistent everywhere (type color, source icon, ~10% larger icons)
- [x] Player list uses same action modal as TownSquare, "Reminders" column, no swap column, alignment toggle (default off)
- [x] Night history notes are white, editable, summary shows player + character
- [x] Games can be deleted from sessions
- [x] All tests pass, 0 TS/ESLint errors
