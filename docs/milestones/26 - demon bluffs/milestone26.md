# Milestone 26 — Demon Bluffs

> **Goal:** Add support for demon bluffs — the 3 not-in-play good characters the Demon is shown on the first night to use as fake claims. Includes bluff selection UI, management via the Demon's action modal, and display in night flashcards.

Based on feedback from [`post23feedback.md`](../post23feedback.md).

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Task List](#3-task-list)
4. [Files Affected](#4-files-affected)
5. [Testing Requirements](#5-testing-requirements)
6. [Acceptance Criteria](#6-acceptance-criteria)

---

## 1. Problem Statement

In BotC, on the first night the Demon is shown 3 not-in-play good characters (Townsfolk/Outsiders) as "bluffs" — characters they can safely claim to be without being caught by information characters. This is critical gameplay that our app doesn't currently support.

The Storyteller needs to:
1. **Select bluffs** after choosing in-play characters (the bluffs come from the remaining unselected good characters)
2. **Show bluffs** to the Demon during the first night (currently handled by `storytellerSetup` but not connected to actual bluff data)
3. **Change bluffs** if needed (rare but sometimes done mid-game)
4. **Reference bluffs** throughout the game to remember what the Demon was told

---

## 2. Solution Overview

### 2.1 Bluff Selection Step

After the "Select Characters" step and before character assignment:

```
New Game → Select Characters → SELECT DEMON BLUFFS → Assign to Seats → Setup → Night 1
```

- Show all unselected good characters (Townsfolk + Outsiders) from the script
- Storyteller picks exactly 3 as demon bluffs
- Store as `demonBluffs: string[]` (character IDs) on the game state

### 2.2 Demon Action Modal

- Add a "Bluffs" section to the Demon's PlayerActionsModal
- Show the 3 bluff character icons + names
- Allow changing bluffs (swap one out for another unselected good character)

### 2.3 Night Flashcard Integration

- On the first night `demoninfo` structural entry, show the 3 bluff characters with icons
- The Storyteller shows these to the Demon player during the first night

### 2.4 Bluff Reference

- Bluffs should be viewable from the Demon's player card at any time
- Consider showing bluffs in the game info/status area

---

## 3. Task List

### Phase 1: Game State
- [ ] Add `demonBluffs?: string[]` to `Game` type in `types/index.ts` (append at end)
- [ ] Add `SET_DEMON_BLUFFS` reducer action to `GameContext.tsx` (append at end)
- [ ] Persist via existing localStorage mechanism

### Phase 2: Bluff Selection UI
- [ ] Create `UI/src/components/Setup/DemonBluffSelection.tsx`
- [ ] Show unselected good characters (Townsfolk + Outsiders not in `inPlayCharacterIds`)
- [ ] Allow selecting exactly 3
- [ ] Show character icons + names
- [ ] Integrate into game flow after character selection, before assignment

### Phase 3: Demon Action Modal — Bluffs Section
- [ ] Add "Demon Bluffs" section to `PlayerActionsModal.tsx` (visible only for demon players)
- [ ] Show the 3 bluff characters with icons and names
- [ ] Allow changing individual bluffs (swap with another available good character)

### Phase 4: Night Flashcard — Bluff Display
- [ ] On the `demoninfo` first night entry, display the 3 bluff character icons + names
- [ ] Label clearly: "Show these bluffs to the Demon"
- [ ] Update `storytellerSetup` integration to use actual bluff data instead of generic "pick 3 bluffs" text

### Phase 5: Tests & Documentation
- [ ] `DemonBluffSelection.test.tsx`: renders unselected good chars, selects 3, validation
- [ ] `GameContext.test.tsx`: SET_DEMON_BLUFFS action
- [ ] `PlayerActionsModal.test.tsx`: bluffs section for demons
- [ ] `NightFlashcard.test.tsx`: bluff display on demoninfo
- [ ] Milestone docs

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `UI/src/components/Setup/DemonBluffSelection.tsx` | Bluff selection UI |
| `UI/src/components/Setup/DemonBluffSelection.test.tsx` | Tests |

### Modified

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Add `demonBluffs` to Game type |
| `UI/src/context/GameContext.tsx` | `SET_DEMON_BLUFFS` action |
| `UI/src/components/TownSquare/PlayerActionsModal.tsx` | Bluffs section for demon players |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Bluff display on demoninfo entry |
| `UI/src/pages/GameViewPage.tsx` | Bluff selection step in game flow |

---

## 5. Testing Requirements

- [ ] Bluff selection shows only unselected good characters
- [ ] Exactly 3 bluffs can be selected (validation)
- [ ] Bluffs persist in game state
- [ ] Demon player's action modal shows bluffs section
- [ ] Bluffs can be changed from the action modal
- [ ] First night demoninfo flashcard shows bluff characters with icons
- [ ] Non-demon players don't see bluffs section

---

## 6. Acceptance Criteria

- [ ] After selecting in-play characters, Storyteller selects 3 demon bluffs from remaining good characters
- [ ] Bluffs stored in game state and persisted
- [ ] Demon's action modal shows bluffs with ability to change them
- [ ] First night flashcard shows bluff characters during demoninfo step
- [ ] All tests pass, 0 TS/ESLint errors
