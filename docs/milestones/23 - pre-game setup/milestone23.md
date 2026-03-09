# Milestone 23 — Pre-Game Setup & Reminder Token System

## Status: ✅ Complete

**Completed:** 2026-03-09

### Summary
Built a comprehensive pre-game setup flow guiding Storytellers through character selection, distribution validation, character assignment, identity concealment (Drunk/Marionette/Lunatic), and reminder token placement — all before Night 1 begins. Added a full reminder token management system with type-colored chips and source character icons throughout the app.

> **Goal:** Build a comprehensive pre-game setup flow and reminder token system so the Storyteller is guided through all character-driven setup requirements — distribution modifiers, required character dependencies, identity concealment (Drunk/Marionette/Lunatic), and reminder token placement — before Night 1 begins.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Phases](#2-phases)
3. [Task List](#3-task-list)
4. [Files Affected](#4-files-affected)
5. [Dependencies](#5-dependencies)
6. [Testing Requirements](#6-testing-requirements)
7. [Acceptance Criteria](#7-acceptance-criteria)

---

## 1. Problem Statement

The app currently has no pre-game setup guidance. BotC has extensive setup requirements that depend on which characters are on the script and in play. Without guidance, Storytellers will miss critical steps.

### 1.1 No Structured Setup Flow

The current game creation jumps straight from "new game" to character assignment. The actual BotC setup flow is more nuanced:

1. **Create game** — select script, set player count
2. **Set up seats/players** — the Storyteller may set up physical seats and the app before players arrive. Player names can be added later or swapped.
3. **Select in-play characters** — choose which characters from the script are actually in this game (the script may have 25+ characters but only 10 are used for a 10-player game)
4. **Assign characters to seats** — distribute the selected characters to player seats (random or manual)
5. **Pre-game setup** — handle distribution modifiers, identity concealment, reminder tokens, storyteller decisions
6. **Night 1** — begin play

The app should support this flow, and importantly:
- **Seat/player swaps** should be available at any time (players arrive late, swap seats, etc.)
- If a swap happens after character assignment, the character assignment moves with the player
- Character selection from the script should be a separate step from assignment to players

### 1.2 Reminder Tokens Not Populated

Most character files have `reminders: []` — the official `roles.json` has rich reminder data (120+ characters with reminders, ~40 unique token types) that we haven't imported. Without reminders, the token system has no data to work with.

**Reminder data includes:**
- Per-character reminder arrays with text labels and counts (e.g., Innkeeper has 2× "Safe" + 1× "Drunk")
- Global reminders for identity-concealed characters (Drunk, Marionette, Philosopher, Alchemist, Lil' Monsta)
- `:reminder:` notation in night instructions indicating where tokens should be placed during night actions

### 1.3 Distribution Modifiers

Characters modify the player count distribution during setup:

| Character | Modifier | Notes |
|-----------|----------|-------|
| Baron | `[+2 Outsiders]` | 2 additional Outsiders replace Townsfolk |
| Fang Gu | `[+1 Outsider]` | 1 additional Outsider replaces a Townsfolk |
| Vigormortis | `[-1 Outsider]` | 1 fewer Outsider |
| Balloonist | `[+0 or +1 Outsider]` | Storyteller chooses |
| Hermit | `[-0 or -1 Outsider]` | Storyteller chooses |
| Xaan | `[X Outsiders]` | Overrides Outsider count entirely (ST picks X) |
| Kazali | `[-? to +? Outsiders]` | ST picks any Outsider count |
| Lord of Typhon | `[+1 Minion, -? to +? Outsiders]` | Extra Minion + flexible Outsiders |
| Sentinel (Fabled) | `[might add Outsiders]` | ST may add 0-2 Outsiders |

### 1.4 Required Character Dependencies

Some characters auto-add another character to the script during setup:

| Character | Requires | Notation |
|-----------|----------|----------|
| Choirboy | King | `[+the King]` — King auto-added if not already on script |
| Huntsman | Damsel | `[+the Damsel]` — Damsel auto-added if not already on script |
| Bounty Hunter | — | `[1 Townsfolk is evil]` — ST must assign one good player as evil |

### 1.5 Identity Concealment Setup

Characters that require swapping the visible character token:

| Character | Setup Requirement | Reminder Tokens |
|-----------|------------------|-----------------|
| **Marionette** | Thinks they're a good character. Swap their token for the good character they believe they are. Place "Is The Marionette" reminder. Also place that good character's setup reminders (e.g., Fortune Teller's "Red Herring"). | `Is The Marionette` (global) |
| **Drunk** | Thinks they're a Townsfolk. Swap their token for the Townsfolk they believe they are. Place "Is The Drunk" reminder. Also pretend that Townsfolk's ability works. | `Is The Drunk` (global) |
| **Lunatic** | Thinks they're the Demon. Keeps the Lunatic token (no swap — better UX than hiding it). The Storyteller pretends they are the Demon during night actions. The real Demon exists elsewhere. | (no token swap needed) |

The Storyteller must also set up the "believed" character's reminders (e.g., if Marionette thinks they're the Fortune Teller, the "Red Herring" reminder must be placed on some player to maintain the illusion).

### 1.6 Other Storyteller Pre-Game Decisions

6 characters have `storytellerSetup` steps already defined:
- **Demons** (Imp, Fang Gu, No Dashii, Kazali, Ojo): Pick 3 not-in-play good character bluffs
- **Drunk**: Choose which Townsfolk the Drunk thinks they are
- **Fortune Teller**: Designate the Red Herring player

### 1.7 Night Flashcard `:reminder:` Notation

The official BotC data uses `:reminder:` markers in `firstNightReminder` and `otherNightReminder` to indicate where the Storyteller should place a specific reminder token. Our night flashcards should show the corresponding reminder token icon at these positions (35+ characters use this pattern).

---

## 2. Phases

### Phase 1: Import Reminder Token Data from roles.json

**Prerequisite for reminder-related phases.** Populate `reminders` arrays in all character files.

- Read `roles.json` reminder data for each character
- Map string labels → `ReminderToken` objects with proper IDs
- Respect token counts (e.g., Innkeeper has 2× "Safe" — create 2 token objects)
- Preserve existing `remindersGlobal` data (already imported for 5 characters)
- Add a `sourceCharacterId` field to `ReminderToken` to track which character a reminder comes from (for icon display)
- Add validation in `characterData.test.ts`

### Phase 2: Game Setup Flow — Character Selection from Script

Restructure the game creation flow to separate character selection from player assignment:

```
New Game → Set Player Count → Select In-Play Characters → Assign to Seats → Pre-Game Setup → Night 1
```

- Add a **"Character Selection"** step between game creation and character assignment
- Display all characters from the script, grouped by type (Townsfolk/Outsider/Minion/Demon)
- Storyteller picks which characters are in THIS game (respecting distribution rules)
- Show distribution targets and current counts as characters are toggled
- The selected subset becomes the pool for assignment in the next step
- Distribution modifier characters (Baron, Fang Gu, etc.) auto-adjust targets when selected

### Phase 3: Seat/Player Management & Swaps

- **Player seats can be set up before players arrive** — seats exist with numbers, names can be added/changed later
- **Seat swap action**: swap two players' seat positions (available at any time via TownSquare or Players List)
  - If characters are already assigned, the character assignment moves with the player
  - If no characters assigned yet, just the player name/seat number swap
- Seat swap should be accessible from:
  - TownSquare context menu (long-press/click a player → "Swap with..." → select target)
  - Players List (drag-and-drop or swap button)
- **Player name editing** should remain available at all times (player arrives late, name correction)

### Phase 4: Reminder Token UI Enhancements

- Add source character icon to each reminder token display (small icon showing which character the token belongs to — e.g., "Red Herring" shows Fortune Teller icon)
- Update `TokenManager.tsx` to use imported reminder data as the available token set
- Limit token placement to the counts defined in the character data (e.g., max 2× "Safe" for Innkeeper)
- Allow placing any character's reminders on any player (not just the character's own player)

### Phase 5: Night Flashcard `:reminder:` Integration

- Parse `:reminder:` markers from `firstNightReminder`/`otherNightReminder` fields in character data
- In the night flashcard UI, show the corresponding reminder token icon/chip at each `:reminder:` position
- The token shown should match the character's reminder array in order (1st `:reminder:` = 1st reminder, 2nd = 2nd, etc.)
- This gives the Storyteller a visual cue of which token to place during each night action

### Phase 6: Distribution Modifier Detection & Warnings

- Create a utility `getSetupModifiers(scriptCharacterIds: string[])` that returns all distribution modifiers for the active script
- Auto-adjust the suggested distribution in `CharacterAssignmentDialog` based on modifiers
- Show clear UI indicators: "+2 Outsiders (Baron)", "+1 Minion (Lord of Typhon)", etc.
- Handle conflicts (Baron +2 and Vigormortis -1 = net +1 Outsiders)

### Phase 7: Required Character Auto-Detection

- When Choirboy is on the script but King is not, show a warning/auto-add suggestion
- When Huntsman is on the script but Damsel is not, show a warning/auto-add suggestion
- Bounty Hunter: prompt the Storyteller to designate one good player as evil-registering
- These checks should appear in the script builder and character assignment flow

### Phase 8: Pre-Game Setup Checklist

Build a "Setup Checklist" step that appears after character assignment but before Night 1:

```
┌──────────────────────────────────────────────┐
│ 📋 Pre-Game Setup Checklist                  │
│                                              │
│ ✅ Distribution adjusted: +2 Outsiders (Baron)│
│ ☐ Choose Drunk's believed character          │
│ ☐ Designate Fortune Teller's Red Herring     │
│ ☐ Pick 3 bluffs for the Imp                  │
│ ☐ Place "Is The Marionette" on Alice         │
│ ☐ Place Fortune Teller reminders for Alice   │
│   (Marionette believes she is Fortune Teller)│
│ ☐ Place "Is The Drunk" on Bob               │
│ ☐ Seat check: Marionette neighbors Demon     │
│                                              │
│ [Start Night 1 →]                            │
└──────────────────────────────────────────────┘
```

Items are derived dynamically from:
- Characters with `setup: true`
- Characters with `storytellerSetup` steps
- Characters with `setupModification`
- Characters with required dependencies (Choirboy→King, Huntsman→Damsel)
- Characters with global reminders requiring placement
- Identity concealment characters (Drunk, Marionette, Lunatic)

### Phase 9: Identity Concealment System

- Support "apparent character" vs "actual character" per player
- When the Marionette is assigned, allow the ST to pick which good character they believe they are
- Swap the visible token/icon on the TownSquare to show the believed character
- Place the "Is The Marionette" global reminder on that player
- Auto-detect and prompt for the believed character's own setup requirements
- Same flow for Drunk (swap token to believed Townsfolk)
- Lunatic keeps their own Lunatic token — no swap needed (the ST pretends during night actions; better UX than hiding the Lunatic identity from the grimoire)
- Alignment display: show the believed alignment in hidden-info mode, actual alignment in visible mode

### Phase 10: Tests & Documentation

- Comprehensive tests for all new utilities and components
- Update existing character assignment and night flashcard tests
- Storybook stories for setup checklist, reminder token display, seat swaps
- Milestone documentation

---

## 3. Task List

### Phase 1: Import Reminder Tokens
- [ ] Add `sourceCharacterId?: string` to `ReminderToken` in `types/index.ts`
- [ ] Write import script to read `roles.json` reminders and populate each character's `reminders` array
- [ ] Respect token counts (e.g., 2× "Safe" = two separate `ReminderToken` objects)
- [ ] Add `count?: number` or duplicate entries per the source data
- [ ] Validate all characters with reminders in `characterData.test.ts`
- [ ] Ensure global reminders remain intact

### Phase 2: Character Selection from Script
- [ ] Add "Character Selection" step to game creation flow (between game creation and assignment)
- [ ] Display all script characters grouped by type with toggle selection
- [ ] Show distribution targets and current counts as characters are toggled
- [ ] Distribution modifier characters auto-adjust targets when selected
- [ ] Selected character subset becomes the pool for Phase 3 assignment

### Phase 3: Seat/Player Management & Swaps
- [ ] Support seat setup before players arrive (seat numbers exist, names optional)
- [ ] Add seat swap action: swap two players' positions (TownSquare context menu + Players List)
- [ ] If characters assigned, character assignment moves with the player on swap
- [ ] Player name editing available at all times
- [ ] Swap accessible from TownSquare (tap player → "Swap with..." → select target) and Players List

### Phase 4: Reminder Token UI
- [ ] Add source character icon to reminder token chips in `TokenManager.tsx`
- [ ] Use imported reminder data as the available token pool
- [ ] Enforce count limits per token type
- [ ] Allow placing any in-play character's reminders on any player

### Phase 5: Night `:reminder:` Integration
- [ ] Parse `:reminder:` markers from night instruction text
- [ ] Display corresponding reminder token chips in `NightFlashcard.tsx`
- [ ] Match markers to reminder array by position

### Phase 6: Distribution Modifiers
- [ ] Create `getSetupModifiers()` utility
- [ ] Auto-adjust distribution suggestions in `CharacterAssignmentDialog`
- [ ] Show modifier indicators in the UI
- [ ] Handle modifier conflicts (additive)

### Phase 7: Required Characters
- [ ] Detect Choirboy without King, Huntsman without Damsel
- [ ] Show warnings/auto-add in script builder and character assignment
- [ ] Bounty Hunter evil-townsfolk designation prompt

### Phase 8: Setup Checklist UI
- [ ] Create `SetupChecklist` component
- [ ] Dynamically generate items from script/game state
- [ ] Integrate into game flow (between character assignment and Night 1)
- [ ] Checkable items with state persistence

### Phase 9: Identity Concealment
- [ ] Add `apparentCharacterId` to player state
- [ ] UI for selecting believed character (Drunk, Marionette)
- [ ] Token swap on TownSquare (Drunk/Marionette show believed character icon)
- [ ] Lunatic keeps own token (no swap)
- [ ] Auto-prompt for believed character's setup requirements
- [ ] Alignment display logic (apparent vs actual)

### Phase 10: Tests & Documentation
- [ ] Tests for all new utilities, components, and state changes
- [ ] Storybook stories
- [ ] Milestone docs and progress tracking

---

## 4. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `UI/src/utils/setupModifiers.ts` | Distribution modifier detection |
| `UI/src/utils/setupModifiers.test.ts` | Tests |
| `UI/src/utils/reminderUtils.ts` | Reminder token utilities (parsing `:reminder:`, token pools) |
| `UI/src/utils/reminderUtils.test.ts` | Tests |
| `UI/src/components/Setup/SetupChecklist.tsx` | Pre-game setup checklist UI |
| `UI/src/components/Setup/SetupChecklist.test.tsx` | Tests |
| `UI/src/components/Setup/CharacterSelection.tsx` | In-play character selection from script |
| `UI/src/components/Setup/CharacterSelection.test.tsx` | Tests |
| `scripts/importReminders.ts` | One-time import script for roles.json reminders |

### Modified

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Add `sourceCharacterId`, `apparentCharacterId` |
| `UI/src/data/characters/*.ts` (120+ files) | Populate `reminders` arrays |
| `UI/src/components/TownSquare/TokenManager.tsx` | Source character icons, count limits |
| `UI/src/components/TownSquare/TownSquareTab.tsx` | Seat swap action in context menu |
| `UI/src/components/TownSquare/PlayerActionsModal.tsx` | Seat swap UI |
| `UI/src/components/PlayerList/PlayerListTab.tsx` | Seat swap from list view |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | `:reminder:` token display |
| `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx` | Distribution modifiers, required char warnings |
| `UI/src/context/GameContext.tsx` | `apparentCharacterId`, seat swap action |
| `UI/src/pages/GameViewPage.tsx` | Setup flow integration, character selection step |
| `UI/src/data/playerCountRules.ts` | Distribution modifier support |

---

## 5. Dependencies

- **M22** (BotC Data Import) — ✅ Complete. Provides `roles.json` access and character data foundation.
- **M4** (Multi-Demon) — ✅ Complete (pending merge). Distribution flexibility foundation.
- **M5** (Jinxes) — ✅ Complete. Establishes pattern for script-aware utilities.
- **Phase 1 (reminder import) must complete before Phases 4, 5, 8, 9.**
- Phases 2, 3 (character selection, seat swaps) are independent and can run in parallel with Phase 1.
- Phases 6 and 7 (distribution modifiers, required chars) are independent of reminder work.

---

## 6. Testing Requirements

### Reminder Import
- [ ] All characters with reminders in `roles.json` have populated `reminders` arrays
- [ ] Token counts match source data
- [ ] Global reminders preserved
- [ ] `sourceCharacterId` populated on all tokens

### Character Selection
- [ ] All script characters displayed grouped by type
- [ ] Distribution targets shown and update as characters toggled
- [ ] Selected subset correctly passed to character assignment
- [ ] Distribution modifiers auto-adjust targets

### Seat/Player Swaps
- [ ] Swap two players without character assignments — names/seats swap
- [ ] Swap two players with character assignments — characters move with players
- [ ] Swap accessible from TownSquare and Players List
- [ ] Player name editing works at all times

### Distribution Modifiers
- [ ] Baron +2 Outsiders detected and applied
- [ ] Fang Gu +1 Outsider detected
- [ ] Multiple modifiers combine correctly
- [ ] Lord of Typhon +1 Minion detected

### Required Characters
- [ ] Choirboy without King shows warning
- [ ] Huntsman without Damsel shows warning
- [ ] Auto-add works correctly

### Setup Checklist
- [ ] Generates correct items for scripts with setup characters
- [ ] Items are checkable and persist
- [ ] Empty checklist for scripts with no setup characters

### Identity Concealment
- [ ] Marionette can be assigned an apparent character
- [ ] TownSquare shows apparent character icon
- [ ] Reminder tokens from both actual and apparent character are available
- [ ] Drunk apparent character assignment works
- [ ] Lunatic keeps own token, no swap

### Night `:reminder:` Display
- [ ] Reminder tokens shown in flashcards at `:reminder:` positions
- [ ] Correct tokens mapped from character's reminder array

---

## 7. Acceptance Criteria

- [ ] Game setup flow: New Game → Select Characters → Assign to Seats → Pre-Game Setup → Night 1
- [ ] Character selection step allows picking which script characters are in the game
- [ ] Seat/player swaps available at any time; character assignments move with players
- [ ] All character `reminders` arrays populated from `roles.json` with correct counts
- [ ] Reminder tokens show source character icon
- [ ] Token placement enforces count limits from character data
- [ ] Distribution modifiers detected and applied automatically with clear UI
- [ ] Required character dependencies detected with warnings/auto-add
- [ ] Pre-game setup checklist dynamically generated from script/game state
- [ ] Identity concealment (Drunk, Marionette) swaps visible character and places correct reminders; Lunatic keeps own token
- [ ] Night flashcards show reminder tokens at `:reminder:` positions
- [ ] All existing tests pass + comprehensive new tests
- [ ] TypeScript, ESLint, and test suite all pass
