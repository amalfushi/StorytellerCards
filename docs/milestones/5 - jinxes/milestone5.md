# Milestone 5 — Jinxes

> **Goal:** Display jinx interactions throughout the app — in script views, character details, night phase flashcards, and TownSquare — so Storytellers always know which character interaction rules apply to their current game.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Data Status](#2-data-status)
3. [Solution Overview](#3-solution-overview)
4. [Task List](#4-task-list)
5. [Files Affected](#5-files-affected)
6. [Dependencies](#6-dependencies)
7. [Testing Requirements](#7-testing-requirements)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Problem Statement

Jinxes are special interaction rules between specific character pairs. When two jinxed characters are both on the same script (or both in play), the Storyteller must remember and apply the jinx rule. Examples:

- **Spy + Magician**: "When the Spy sees the Grimoire, the Demon and Magician tokens are swapped."
- **Pit-Hag + Leviathan**: "The Leviathan cannot enter play after day 5."
- **Legion + Mayor**: "If Legion is in play, the Mayor doesn't win if just 3 players live."

There are **131 jinx pairs** across 27+ characters. Currently:
- ✅ Jinx data is imported into character files (131 pairs with bidirectional mirroring)
- ✅ `Jinx` interface exists in `types/index.ts` (`{ characterId, description }`)
- ❌ **No jinx display UI anywhere** — the data sits unused
- ❌ No jinx detection logic (which jinxes are active given the current script/game)
- ❌ No jinx reminders during the night phase

---

## 2. Data Status

Jinx data is already present in character files. Example from `alchemist.ts`:

```typescript
jinxes: [
  { characterId: 'boffin', description: 'If the Alchemist has the Boffin ability, the Alchemist does not learn what ability the Demon has.' },
  { characterId: 'marionette', description: 'An Alchemist-Marionette has no Marionette ability & the Marionette is in play.' },
  // ... 6 more
]
```

**Statistics:**
- 27+ characters have jinxes
- 131 total jinx pairs (bidirectionally mirrored — both characters reference each other)
- Most jinxed: Leviathan (13), Riot (12), Summoner (11), Plague Doctor (9)

No import work is needed — this milestone is purely **UI/display**.

---

## 3. Solution Overview

### 3.1 Active Jinx Detection

Create a utility that identifies which jinxes are relevant:

```typescript
function getActiveJinxes(scriptCharacterIds: string[]): ActiveJinx[]

interface ActiveJinx {
  character1Id: string;
  character1Name: string;
  character2Id: string;
  character2Name: string;
  description: string;
}
```

A jinx is "active" when **both** characters in the pair are on the current script. This is the set the Storyteller needs to know about.

### 3.2 Jinx Display Locations

| Location | When to Show | What to Show |
|----------|-------------|--------------|
| **Script View** (`ScriptReferenceTab`) | Always, if script has active jinxes | "Jinxes" section at the bottom listing all active pairs |
| **Character Detail Modal** | When viewing a character that has jinxes with other script characters | Jinx section showing relevant jinxes for that character |
| **Night Flashcard** | During night, if the current character has an active jinx | Jinx reminder banner/chip on the flashcard |
| **Script Builder** | When selecting characters that create jinxes | Warning/info indicator showing jinx count |

### 3.3 Visual Design

Jinxes should be visually distinct — they're special rules that override normal behavior:

- **Color**: Use a warm amber/warning color (e.g., `#f59e0b` or MUI `warning`)
- **Icon**: ⚡ or a chain-link icon to denote interaction
- **Layout**: Show both character icons + names + jinx text

```
┌─────────────────────────────────────────────────┐
│ ⚡ Jinxes (3 active)                            │
│                                                  │
│ [🎭 Spy] ↔ [🎭 Magician]                       │
│ When the Spy sees the Grimoire, the Demon and    │
│ Magician tokens are swapped.                     │
│                                                  │
│ [🎭 Pit-Hag] ↔ [🎭 Leviathan]                  │
│ The Leviathan cannot enter play after day 5.     │
│                                                  │
│ [🎭 Legion] ↔ [🎭 Mayor]                        │
│ If Legion is in play, the Mayor doesn't win if   │
│ just 3 players live.                             │
└─────────────────────────────────────────────────┘
```

### 3.4 Night Phase Jinx Reminders

During the night flashcards, if the current character has an active jinx with another character that's also in the game, show a small reminder:

```
┌────────────────────────────────────────┐
│ Spy                           Night 2  │
│ ────────────────────────────────────── │
│ ⚡ Jinx: Magician                     │
│ "When the Spy sees the Grimoire,      │
│  the Demon and Magician tokens        │
│  are swapped."                        │
│ ────────────────────────────────────── │
│ Each night, the Spy may look at       │
│ the Grimoire...                       │
└────────────────────────────────────────┘
```

---

## 4. Task List

### Phase 1: Active Jinx Detection Utility

- [ ] Create `UI/src/utils/jinxUtils.ts` with:
  - `getActiveJinxes(scriptCharacterIds: string[]): ActiveJinx[]` — finds all jinx pairs where both characters are on the script
  - `getCharacterActiveJinxes(characterId: string, scriptCharacterIds: string[]): ActiveJinx[]` — jinxes for a specific character
  - Deduplication: since jinxes are mirrored, ensure each pair appears only once in the list
- [ ] Define `ActiveJinx` type in `types/index.ts` (append at end)
- [ ] Write comprehensive tests for jinx detection

### Phase 2: Script View — Jinxes Section

- [ ] Add a "Jinxes" section at the bottom of `ScriptReferenceTab.tsx`
- [ ] Show all active jinxes for the current script
- [ ] Each jinx entry: both character icons + names + description text
- [ ] Use amber/warning color scheme
- [ ] Only show the section if there are active jinxes (hide if none)

### Phase 3: Character Detail Modal — Jinx Section

- [ ] Add jinx section to `CharacterDetailModal.tsx`
- [ ] Show jinxes for the viewed character that are active in the current script context
- [ ] If not in a game/script context, show all jinxes for the character (informational)
- [ ] Each entry: paired character icon + name + description

### Phase 4: Night Flashcard — Jinx Reminder

- [ ] In `NightFlashcard.tsx`, check if the current character has active jinxes with other in-play characters
- [ ] If yes, show a compact jinx reminder banner above the night action text
- [ ] Show the paired character name and jinx text
- [ ] Use a visually distinct style (amber background, ⚡ icon) so it stands out

### Phase 5: Script Builder — Jinx Indicator

- [ ] In `ScriptBuilder.tsx`, when selecting characters, show a jinx count indicator
- [ ] When a character with jinxes is added and its jinx partner is already selected, show the jinx info
- [ ] This is informational only — jinxes don't prevent character selection

### Phase 6: Tests & Stories

- [ ] `jinxUtils.test.ts`: test active jinx detection, deduplication, per-character filtering, edge cases (no jinxes, all jinxes)
- [ ] `ScriptReferenceTab.test.tsx`: test jinx section appears with correct pairs, hidden when no jinxes
- [ ] `CharacterDetailModal.test.tsx`: test jinx section in modal
- [ ] `NightFlashcard.test.tsx`: test jinx reminder banner appears for jinxed characters
- [ ] `ScriptBuilder.test.tsx`: test jinx indicator on character selection
- [ ] Storybook stories: script view with jinxes, character modal with jinxes, night flashcard with jinx reminder

---

## 5. Files Affected

### New Files

| File | Purpose |
|------|---------|
| `UI/src/utils/jinxUtils.ts` | Active jinx detection utility |
| `UI/src/utils/jinxUtils.test.ts` | Tests for jinx utilities |

### Modified

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Add `ActiveJinx` type (append at end) |
| `UI/src/components/ScriptViewer/ScriptReferenceTab.tsx` | Jinxes section at bottom |
| `UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx` | Jinx section tests |
| `UI/src/components/common/CharacterDetailModal.tsx` | Jinx section in modal |
| `UI/src/components/common/CharacterDetailModal.test.tsx` | Jinx section tests |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Jinx reminder banner |
| `UI/src/components/NightPhase/NightFlashcard.test.tsx` | Jinx reminder tests |
| `UI/src/components/ScriptBuilder/ScriptBuilder.tsx` | Jinx indicator |
| `UI/src/components/ScriptBuilder/ScriptBuilder.test.tsx` | Jinx indicator tests |

---

## 6. Dependencies

- **No blockers.** Jinx data is already imported into character files.
- Can run in parallel with all other milestones.
- Low overlap: touches different files than M18 (except potentially `ScriptReferenceTab` — but different sections of the component).
- The `jinxUtils.ts` utility is self-contained and imports only character data.

---

## 7. Testing Requirements

### Jinx Utilities

- [ ] `jinxUtils.test.ts`: `getActiveJinxes()` returns correct pairs for a script with jinxed characters
- [ ] `jinxUtils.test.ts`: returns empty array when no jinxed characters are on the script
- [ ] `jinxUtils.test.ts`: deduplicates mirrored jinxes (Spy↔Magician appears once, not twice)
- [ ] `jinxUtils.test.ts`: `getCharacterActiveJinxes()` filters to specific character
- [ ] `jinxUtils.test.ts`: handles characters with many jinxes (Leviathan: 13)
- [ ] `jinxUtils.test.ts`: handles characters not in the character registry gracefully

### Component Tests

- [ ] Script view: jinx section renders with correct count and content
- [ ] Script view: jinx section hidden when no active jinxes
- [ ] Character modal: shows jinxes relevant to current script
- [ ] Character modal: shows all jinxes when no script context
- [ ] Night flashcard: jinx reminder visible for jinxed characters
- [ ] Night flashcard: no jinx reminder for non-jinxed characters
- [ ] Script builder: jinx indicator shows count when jinx partner selected

---

## 8. Acceptance Criteria

- [ ] Active jinx detection correctly identifies jinx pairs when both characters are on the current script
- [ ] Script view shows a "Jinxes" section at the bottom with all active jinx pairs, using amber/warning styling
- [ ] Character detail modal shows relevant jinxes for the viewed character
- [ ] Night flashcard shows a compact jinx reminder when the current character has an active jinx
- [ ] Script builder shows a jinx indicator when selecting characters that create jinx interactions
- [ ] Jinx display is visually distinct (amber color, ⚡ icon) and easy to read
- [ ] Mirrored jinxes are deduplicated — each pair appears only once
- [ ] All existing tests pass + comprehensive jinx tests
- [ ] TypeScript, ESLint, and test suite all pass
