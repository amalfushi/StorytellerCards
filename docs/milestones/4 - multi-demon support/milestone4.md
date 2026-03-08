# Milestone 4 — Multi-Demon & Edge Case Support

## Status: ✅ Complete

**Completed:** 2025-07-18

All 4 phases implemented — distribution rules flexibility, alignment auto-update, night order edge cases, and comprehensive tests. See [progress.md](progress.md) for details.

---

> **Goal:** Handle game scenarios where there are multiple demons (Legion, Pit-Hag creation), no demon (Lil' Monsta, Atheist), or a non-standard demon setup — ensuring the app doesn't break or produce incorrect behavior in these cases.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Scenarios](#2-scenarios)
3. [Solution Overview](#3-solution-overview)
4. [Task List](#4-task-list)
5. [Files Affected](#5-files-affected)
6. [Dependencies](#6-dependencies)
7. [Testing Requirements](#7-testing-requirements)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Problem Statement

The app currently assumes **exactly 1 demon per game**:

- `playerCountRules.ts` hardcodes `demons: 1` for all player counts (5–15)
- `demoninfo` structural night entry assumes waking one demon on the first night
- No validation prevents or warns about zero-demon or multi-demon setups
- Character assignment has no special handling for demon edge cases

BotC has several legitimate scenarios that violate the "exactly 1 demon" assumption:

| Scenario | Characters Involved | What Happens |
|----------|-------------------|--------------|
| **Multiple demons in play** | Legion (all minion slots are also Legion) | Multiple players register as demons simultaneously |
| **Demon created mid-game** | Pit-Hag turns a player into a demon | Game can have 2+ demons after a Pit-Hag night action |
| **No demon player** | Lil' Monsta (token, not a player) | The "demon" is a token babysat by a Minion — no player is actually the demon |
| **No evil characters at all** | Atheist | The game has zero evil characters; the Storyteller is "the adversary" |
| **Demon replaced** | Philosopher, Alchemist, Drunk | A player may think they're a demon but aren't, or a non-demon player gains demon abilities |

The app should handle all of these gracefully without crashing, producing incorrect night orders, or displaying misleading information.

---

## 2. Scenarios

### 2.1 Legion — Multiple Demons

- **Setup**: All Minion slots are replaced with copies of Legion. If there are 4 Minion slots, there are 5 Legions total (1 demon + 4 ex-minion slots).
- **Alignment**: All Legions are Evil. Legions in Minion slots register as both Minion and Demon.
- **Night**: "A player might die" — only one Legion kill per night.
- **Impact on our app**:
  - Character assignment must allow multiple players to have `characterId: "legion"`
  - Player count distribution should flex: when Legion is in play, demons > 1 is valid
  - Alignment display: all Legion players are Evil
  - Night order: only one Legion entry in night order (not one per Legion player)

### 2.2 Pit-Hag — Demon Created Mid-Game

- **Setup**: Pit-Hag is a Minion who can change a player's character each night, including into a demon.
- **Mid-game change**: If Pit-Hag turns a Townsfolk into a demon, the game now has 2 demons.
- **Impact on our app**:
  - Character reassignment during a game must be supported (already exists via player editing)
  - Alignment should update when character type changes (Townsfolk→Demon = Good→Evil)
  - Night order should dynamically include the new demon's night actions
  - No validation should prevent a second demon from being assigned mid-game

### 2.3 Lil' Monsta — No Demon Player

- **Setup**: Lil' Monsta is a demon token, not assigned to a player. A Minion "babysits" the token each night.
- **Impact on our app**:
  - Valid to have zero players with a demon `characterId`
  - Lil' Monsta should appear in the night order (it has night actions for choosing a babysitter)
  - The "demon info" first-night step still applies (Minions learn who babysits)
  - TownSquare should not require a demon player to function

### 2.4 Atheist — No Evil Characters

- **Setup**: There are no evil characters at all. No demons, no minions. The Storyteller is the adversary.
- **Impact on our app**:
  - Valid to have zero demons AND zero minions
  - `demoninfo` and `minioninfo` structural night entries should be skipped
  - Night order should work normally with no demon entries
  - Player alignment: all players are Good

---

## 3. Solution Overview

### 3.1 Relax Demon Count Assumptions

Rather than enforcing "exactly 1 demon," the app should:
- Allow 0, 1, or N demons in the player list
- Show a **soft warning** (not a blocking error) if the demon count seems unusual for the script
- Let the Storyteller override — they know the game better than validation rules

### 3.2 Character Assignment Flexibility

- Allow the same character ID to be assigned to multiple players (for Legion)
- Allow a game with no demon player (for Lil' Monsta, Atheist)
- When a player's character changes mid-game (Pit-Hag scenario), automatically update their alignment

### 3.3 Night Order Adaptations

- `demoninfo` structural entry: show conditionally — skip if Atheist is in the script or no demons exist
- `minioninfo` structural entry: show conditionally — skip if Atheist is in the script
- Night order deduplication: if multiple players share a character (Legion), only show one night order entry
- Dynamically rebuild night order when characters change mid-game (already handled by `buildNightOrder()` which reads from character data)

### 3.4 Distribution Rules Update

- Update `playerCountRules.ts` to make demon count a **default** rather than a hard requirement
- When Legion is on the script, suggest adjusting demon count to match the number of Legion copies
- When Atheist is on the script, suggest 0 demons and 0 minions

---

## 4. Task List

### Phase 1: Distribution Rules Flexibility

- [ ] Update `playerCountRules.ts` to support variable demon counts (not hardcoded to 1)
- [ ] Add script-aware distribution suggestions:
  - If script contains Legion: suggest `demons = minions + 1` (all minion slots become Legion)
  - If script contains Atheist: suggest `demons = 0, minions = 0`
  - If script contains Lil' Monsta: note that demon is a token, not a player
- [ ] Update `CharacterAssignmentDialog` to show a soft warning (not error) for unusual demon counts
- [ ] Allow duplicate character IDs in assignment (for Legion)

### Phase 2: Alignment Auto-Update

- [ ] When a player's character changes via player editing (Pit-Hag scenario), auto-update alignment:
  - Demon/Minion character → set alignment to Evil
  - Townsfolk/Outsider character → set alignment to Good (but allow manual override for Drunk, Marionette, etc.)
- [ ] Show a visual indicator when alignment was auto-changed
- [ ] Ensure alignment change persists to localStorage

### Phase 3: Night Order Edge Cases

- [ ] Make `demoninfo` structural entry conditional:
  - Skip if Atheist is on the script
  - Skip if there are zero demon players AND no Lil' Monsta
  - Show normally otherwise (even with multiple demons — info goes to all)
- [ ] Make `minioninfo` structural entry conditional:
  - Skip if Atheist is on the script
- [ ] Deduplicate night order entries: if multiple players share a character (Legion), show only one entry in the night flashcards
- [ ] Night flashcard: when multiple players have the same character, show all relevant player names in the flashcard

### Phase 4: Tests

- [ ] Test: multiple players assigned Legion — assignment works, night order shows one entry
- [ ] Test: zero demons in game (Atheist) — no crash, demoninfo/minioninfo skipped
- [ ] Test: Lil' Monsta — no demon player, night order includes Lil' Monsta babysitter step
- [ ] Test: mid-game character change to demon — alignment auto-updates
- [ ] Test: playerCountRules with flexible demon counts
- [ ] Test: distribution suggestions for Legion, Atheist, Lil' Monsta scripts

---

## 5. Files Affected

### Modified

| File | Change |
|------|--------|
| `UI/src/data/playerCountRules.ts` | Flexible demon count, script-aware suggestions |
| `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx` | Allow duplicates, soft warnings, alignment auto-update |
| `UI/src/data/characters/_nightOrder.ts` | Conditional demoninfo/minioninfo structural entries |
| `UI/src/utils/nightOrderFilter.ts` | Deduplication logic for same-character players |
| `UI/src/context/GameContext.tsx` | Alignment auto-update on character change (append new action at end) |
| `UI/src/types/index.ts` | Any new types needed (append at end) |

### Test Files

| File | Change |
|------|--------|
| `UI/src/data/playerCountRules.test.ts` | Flexible demon count tests |
| `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.test.tsx` | Multi-demon, zero-demon scenarios |
| `UI/src/utils/nightOrderFilter.test.ts` | Deduplication, conditional structural entries |
| `UI/src/context/GameContext.test.tsx` | Alignment auto-update tests |

---

## 6. Dependencies

- **No hard dependencies.** Can run in parallel with all other milestones.
- Low conflict risk — touches different files than M18 (Traveller/Fabled/Loric) and M19 (Night History).
- Minor overlap with `GameContext.tsx` (add actions at end of switch) and `nightOrderFilter.ts`.

---

## 7. Testing Requirements

### Unit Tests

- [ ] `playerCountRules.test.ts`: variable demon counts, script-aware suggestions
- [ ] `CharacterAssignmentDialog.test.tsx`: assign multiple Legions, assign zero demons, soft warnings
- [ ] `nightOrderFilter.test.ts`: skip demoninfo/minioninfo for Atheist, deduplicate Legion
- [ ] `GameContext.test.tsx`: alignment auto-update on character change

### Integration Scenarios

- [ ] Full game setup with Legion script: assign 5 Legions, run night phase, complete night
- [ ] Full game setup with Atheist script: zero evil, run night phase, complete night
- [ ] Pit-Hag mid-game: start with 1 demon, change a player to a second demon, verify night order updates

---

## 8. Acceptance Criteria

- [ ] Multiple players can be assigned the same demon character (Legion) without errors
- [ ] Games with zero demons (Atheist, Lil' Monsta) function correctly — no crashes, correct night order
- [ ] `demoninfo` and `minioninfo` night entries are skipped when Atheist is in the script
- [ ] Night order deduplicates entries when multiple players share a character
- [ ] Changing a player's character mid-game auto-updates alignment (Demon/Minion→Evil, Townsfolk/Outsider→Good)
- [ ] Distribution rules show soft warnings (not errors) for unusual demon counts
- [ ] All existing tests pass + new edge case tests
- [ ] TypeScript, ESLint, and test suite all pass
