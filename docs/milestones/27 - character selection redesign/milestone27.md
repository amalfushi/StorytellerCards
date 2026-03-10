# Milestone 27 — Character Selection & Assignment Redesign

## Status: ✅ Complete

**Completed:** 2026-03-10

### Summary
Redesigned the character selection and assignment flow to gracefully handle all 23+ setup-affecting characters. Key deliverables:

- **Adaptive Distribution Engine** (`adaptiveDistribution.ts`) — calculates real-time distribution targets responding to Baron, Fang Gu, Vigormortis, Balloonist, Hermit, Godfather, Xaan, Kazali, Lord of Typhon, Sentinel, Legion, Atheist, Lil' Monsta, and Village Idiot. Handles stacking, overrides (Xaan), reversals (Legion), and zeroing (Atheist).
- **Variable modifier steppers** — +/- controls for Kazali, Balloonist, Hermit, Godfather, Sentinel (not just Village Idiot/Legion)
- **CharacterSelection redesign** — adaptive targets replace static distribution, modifier chips show active modifiers below type headers, Xaan X input when Xaan is selected, duplicate character support (Village Idiot ×N, Legion ×N) with +/- steppers.
- **CharacterAssignmentDialog redesign** — character pool chips with character icons, tap-to-assign, simplified randomize (no type validation), identity concealment prompts for Marionette/Drunk, seating constraint warnings. Removed redundant "Available Characters" section.
- **Seating Constraint Visualization** (`seatingConstraints.ts`) — advisory warnings for Marionette adjacency to Demon and Lord of Typhon evil-line requirements.
- **ReminderTokenChip** — extracted shared single-token visual component used by both ReminderTokenChips (list) and TokenBadges (TownSquare positioned). 30×30 small / 40×40 medium avatars with white circular background, 34×34 inner image. Source character type coloring everywhere.
- **CharacterIconImage** — inner `<img>` increased to 58×58 for readability.
- **Bug fixes** — seat ordering (Player 1 → Seat 1), PlayerList crash fix (abilityShort undefined guard), multi-instance dropdown fix (Village Idiot ×3 assignable), sorted chips/dropdowns by type then alphabetically.

### Verification
- 3828 tests passing across 70 files
- 0 TypeScript errors, 0 ESLint errors

---

> **Goal:** Redesign the "Select Characters" → "Assign to Players" flow so it gracefully handles all setup-affecting characters — distribution modifiers, duplicates, identity concealment, seating constraints, and edge cases like Legion/Atheist/Lil' Monsta — while remaining intuitive for standard games.

---

## 1. Problem Statement

The current flow treats character selection and assignment as two rigid steps with fixed distribution targets. This breaks down for 23+ characters that modify the rules:

- **Legion** reverses the good/evil ratio — most players ARE the demon. The Storyteller can't select "1 Demon" and then assign 7 Legions.
- **Atheist** has zero evil characters — the Storyteller must be able to set Demons=0, Minions=0 and fill every slot with Townsfolk/Outsiders.
- **Xaan** overrides the Outsider count entirely — the Storyteller picks X (the night Xaan activates), and that becomes the Outsider count regardless of other modifiers.
- **Village Idiot** can have 0-2 extra copies in play, replacing Townsfolk slots.
- **Marionette** is a Minion who occupies a Townsfolk/Outsider slot (the player doesn't know they're evil), and must sit next to the Demon.
- **Lord of Typhon** requires all evil characters in a continuous line with the Demon in the middle.
- **Lil' Monsta** is a token, not a player — the demon "slot" is empty and an extra Minion is added.

The current rigid count-based system can't express these scenarios without the Storyteller fighting the UI.

---

## 2. Design Principles

1. **Guide, don't gatekeep** — show distribution targets and warnings, but never prevent the Storyteller from making a choice. They know the game better than validation rules.
2. **Standard games should feel effortless** — for a normal Trouble Brewing game with no setup-affecting characters, the flow should be dead simple: pick characters, assign to seats, done.
3. **Complex setups should be possible** — for Legion/Atheist/Lil' Monsta games, the UI should adapt rather than break.
4. **One flow, not branching flows** — don't create separate "Legion mode" or "Atheist mode". The same UI should handle everything with contextual guidance.

---

## 3. Proposed Flow

### Step 1: Select Characters (from script)

**What changes:** Instead of rigid per-type count targets, use **adaptive targets** that respond to which characters are selected.

```
┌─────────────────────────────────────────────┐
│ Select Characters              Game 1 of S1 │
│─────────────────────────────────────────────│
│ [🔍 Search...]                              │
│                                             │
│ Townsfolk (5 selected)           target: 5  │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ [🎭] Washerwoman                     │ │
│ │ ☑ [🎭] Fortune Teller                  │ │
│ │ ☑ [🎭] Empath                          │ │
│ │ ☑ [🎭] Undertaker                      │ │
│ │ ☑ [🎭] Monk                            │ │
│ │ ☐ [🎭] Slayer                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Outsider (1 selected)            target: 2  │
│   ⚠️ Baron: +2 Outsiders applied           │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ [🎭] Butler                          │ │
│ │ ☐ [🎭] Drunk                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Minion (1 selected)              target: 1  │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ [🎭] Baron                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Demon (1 selected)               target: 1  │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ [🎭] Imp                             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Total: 8/10 ⚠️ Need 2 more                 │
│                                             │
│ [Cancel]                         [Continue] │
└─────────────────────────────────────────────┘
```

**Key behaviors:**

- **Targets are adaptive**: When Baron is selected, Outsider target increases by 2. When Atheist is selected, Demon and Minion targets drop to 0. Targets update in real-time as characters are toggled.
- **Modifier chips**: Below each type header, show applied modifiers as chips: "⚠️ Baron: +2 Outsiders", "⚠️ Xaan: X Outsiders (choose X)"
- **Xaan special input**: When Xaan is selected, show a number input to choose X. The Outsider target becomes X, overriding all other modifiers.
- **Legion mode**: When Legion is selected, show a chip: "Legion: distribution reversed". The good/evil counts swap — for an 8-player game, roughly 6 Legion and 2 good characters; for a 10-player game, roughly 7 Legion and 3 good. Allow the Storyteller to pick exactly how many of each.
- **Atheist mode**: When Atheist is selected, Demon and Minion targets become 0. Only good types have targets.
- **Total count**: Always show total selected vs player count. Warn if mismatch, but allow proceeding.
- **Duplicate support**: Allow selecting a character multiple times (for Village Idiot, Legion). Show a count badge: "Village Idiot ×3".
- **Continue button**: Enabled when total ≥ player count (soft — warn but don't block if under/over).

### Step 2: Assign Characters to Seats

**What changes:** Assignment becomes drag-and-drop or tap-to-assign from a character pool, with contextual guidance for special characters.

```
┌─────────────────────────────────────────────┐
│ Assign Characters                           │
│─────────────────────────────────────────────│
│                                             │
│ Unassigned Characters:                      │
│ [🎭 Imp] [🎭 Baron] [🎭 Washerwoman]      │
│ [🎭 Empath] [🎭 Butler] ...               │
│                                             │
│ ⚠️ Marionette must sit next to a Demon     │
│ ⚠️ Lord of Typhon: evil must be in a line  │
│                                             │
│  ┌─────── TownSquare ──────────┐           │
│  │                              │           │
│  │    [Seat 1: Alice]           │           │
│  │        ← drop here →        │           │
│  │                              │           │
│  │    [Seat 2: Bob]             │           │
│  │        🎭 Imp ✓              │           │
│  │                              │           │
│  │    [Seat 3: Carol]           │           │
│  │        ← drop here →        │           │
│  │                              │           │
│  └──────────────────────────────┘           │
│                                             │
│ [🎲 Randomize]    [Back]       [Continue]  │
└─────────────────────────────────────────────┘
```

**Key behaviors:**

- **Character pool at top**: Shows all selected characters as draggable/tappable chips. Assigned ones get removed from pool, shown on seats.
- **Tap-to-assign**: Tap a character chip, then tap a seat. Or use the existing dropdown approach as fallback.
- **Randomize**: Shuffles and assigns all remaining unassigned characters to empty seats. Respects seating constraints if possible (best-effort).
- **Seating constraint warnings**: 
  - If Marionette is in play, warn when she's not adjacent to a Demon.
  - If Lord of Typhon is in play, warn when evil characters aren't in a line.
  - These are warnings, not blockers — the ST may have reasons.
- **Identity concealment**: When Marionette or Drunk is assigned, immediately prompt for their apparent character (what they believe they are).
- **Duplicate characters**: Multiple Legion chips, each assignable to different seats.

### Step 3: Pre-Game Setup (existing SetupChecklist drawer)

After assignment, the existing setup checklist handles:
- Demon bluff selection
- Reminder token placement (Red Herring, Faux Paw, etc.)
- Identity concealment confirmation
- Any remaining storytellerSetup steps

---

## 4. Handling Each Edge Case

### 4.1 Legion
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When Legion selected, distribution UI switches to "reversed" mode. Good/evil counts swap — for an 8-player game, roughly 6 Legion and 2 good; for 10 players, roughly 7 Legion and 3 good; for 12 players, roughly 9 Legion and 3 good. |
| **Character Pool** | Selecting "Legion ×7" adds 7 Legion chips to the pool. Each gets assigned to a different seat. |
| **Assignment** | All Legion players show as Demon type. Night order shows one Legion entry (not 7). |
| **Bluffs** | Optional — "The Storyteller can decide not to give Legion players bluffs." |

### 4.2 Atheist
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When Atheist selected, Demon and Minion targets → 0. Type sections show "0 needed (Atheist)". All slots filled with Townsfolk/Outsiders. |
| **Assignment** | Normal — all players get good characters. No demon info night entry. |
| **Night Phase** | demoninfo/minioninfo structural entries skipped (already implemented in M4). |

### 4.3 Xaan
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When Xaan selected, show "Choose X" number input. X becomes the Outsider count, overriding Baron/Vigormortis/etc. Chip: "Xaan: X=3 → 3 Outsiders". |
| **Assignment** | Normal — Xaan is a Minion slot. |
| **Night Phase** | Xaan activates on night X. |

### 4.4 Lil' Monsta
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When Lil' Monsta selected, Demon target → 0, Minion target += 1. Chip: "Lil' Monsta: demon is a token (+1 Minion)". |
| **Assignment** | No player gets Demon character. Lil' Monsta appears as a floating token on TownSquare (already handled by Fabled/Loric corner display pattern). |

### 4.5 Marionette
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | Normal — Marionette is a Minion. |
| **Assignment** | When assigned, immediately prompt: "Which good character does the Marionette believe they are?" After selection, show warning if not adjacent to Demon. |
| **TownSquare** | Shows apparent character icon with "Is The Marionette" reminder. |

### 4.6 Lord of Typhon
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When selected, +1 Minion target. Chip: "Lord of Typhon: +1 Minion, evil must be in a line". |
| **Assignment** | After all evil assigned, check if they form a continuous line with Lord of Typhon in the middle. Show warning if not. |

### 4.7 Village Idiot
| Aspect | How It Works |
|--------|-------------|
| **Character Selection** | When selected, show "+/−" stepper to add 0-2 extra copies. Each extra replaces a Townsfolk slot. Chip: "Village Idiot ×2". |
| **Assignment** | Multiple Village Idiot chips in pool. After all assigned, ST marks one as Drunk via setup checklist. |

---

## 5. Task List

### Phase 1: Adaptive Distribution Engine
- [ ] Create `UI/src/utils/adaptiveDistribution.ts` — replaces the current static target calculation
- [ ] Takes: player count + selected character IDs → returns: adaptive targets per type, modifier explanations, warnings
- [ ] Handles ALL modifier interactions: Baron+Vigormortis stacking, Xaan override, Legion reversal, Atheist zeroing, Lil' Monsta +1 Minion
- [ ] Unit tests for every edge case combination

### Phase 2: Redesign CharacterSelection Component
- [ ] Replace static targets with adaptive targets from Phase 1
- [ ] Add modifier chips below type headers showing active modifiers
- [ ] Add Xaan "Choose X" number input when Xaan is selected
- [ ] Support duplicate character selection (Village Idiot ×N, Legion ×N) with count stepper
- [ ] Real-time target updates as characters are toggled
- [ ] Total count with soft warnings (not blocking)

### Phase 3: Redesign CharacterAssignment
- [ ] Character pool UI: show unassigned characters as chips at top
- [ ] Tap-to-assign: tap chip then tap seat (mobile-first)
- [ ] Seating constraint warnings: Marionette adjacency, Lord of Typhon line
- [ ] Identity concealment prompts on assignment (Marionette, Drunk)
- [ ] Randomize with constraint awareness (best-effort)

### Phase 4: Seating Constraint Visualization
- [ ] When Marionette is in play, highlight seats adjacent to Demon as "valid" placements
- [ ] When Lord of Typhon is in play, visualize the required evil line on TownSquare
- [ ] Post-assignment: show warning banner if constraints not met
- [ ] These are advisory only — never block assignment

### Phase 5: Tests & Documentation
- [ ] Adaptive distribution engine: comprehensive edge case tests
- [ ] Character selection: modifier interaction tests, duplicate selection
- [ ] Assignment: constraint warning tests, identity concealment prompts
- [ ] Integration: full Legion/Atheist/Lil' Monsta game setup scenarios

---

## 6. Files Affected

### New Files
| File | Purpose |
|------|---------|
| `UI/src/utils/adaptiveDistribution.ts` | Smart distribution calculator |
| `UI/src/utils/adaptiveDistribution.test.ts` | Comprehensive edge case tests |

### Modified
| File | Change |
|------|--------|
| `UI/src/components/Setup/CharacterSelection.tsx` | Adaptive targets, modifier chips, duplicate support, Xaan input |
| `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx` | Character pool, tap-to-assign, constraint warnings |
| `UI/src/components/TownSquare/TownSquareLayout.tsx` | Seating constraint highlights |
| `UI/src/data/playerCountRules.ts` | May simplify now that adaptive engine handles edge cases |

---

## 7. Dependencies

- **M4** (Multi-Demon) ✅ — distribution flexibility, Legion/Atheist handling
- **M23** (Pre-Game Setup) ✅ — character selection, setup checklist, identity concealment
- **M24** (UI Polish) ✅ — character selection fixes
- No blockers — all prerequisite work is merged.

---

## 8. Acceptance Criteria

- [ ] Standard games (no setup-affecting chars) feel effortless: pick characters, assign, done
- [ ] Legion game: reversed distribution, multiple Legion chips assignable to seats
- [ ] Atheist game: zero evil targets, all good characters
- [ ] Xaan game: Outsider count set via X input, overrides other modifiers
- [ ] Lil' Monsta game: no demon player, +1 minion
- [ ] Marionette: adjacency warning during assignment, identity prompt
- [ ] Lord of Typhon: evil-line warning during assignment
- [ ] Village Idiot: 1-3 copies selectable
- [ ] Distribution targets update in real-time as characters are toggled
- [ ] Modifier chips clearly explain what's changing and why
- [ ] All warnings are soft — never block the Storyteller
- [ ] All tests pass, 0 TS/ESLint errors
