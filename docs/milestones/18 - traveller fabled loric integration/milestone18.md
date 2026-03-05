# Milestone 18 — Traveller, Fabled & Loric Integration

> **Goal:** Add full Traveller, Fabled, and Loric support across script management (creation, import, view) and game views (TownSquare corners, Players List bottom section).

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

Travellers, Fabled, and Loric are three special character types in Blood on the Clocktower that are not fully integrated into the app:

### 1.1 Script Creation

The Script Builder doesn't support adding Travellers, Fabled, or Loric characters to a script. In BotC:
- **Travellers** are typically included on a script (usually 4 per script). They can join or leave mid-game.
- **Fabled** are optional game modifiers available for any script. No fixed count.
- **Loric** are optional characters available for any script. No fixed count.

### 1.2 Script Import

The script importer may not properly handle Traveller, Fabled, or Loric character IDs when importing JSON scripts.

### 1.3 Script View Ordering

The Script view should display character sections in a specific order: Townsfolk → Outsiders → Minions → Demons → Travellers → Fabled → Loric.

### 1.4 TownSquare Display

When Fabled or Loric characters are active in a game, they should appear in fixed corner positions on the TownSquare:
- **Fabled**: Upper-left corner
- **Loric**: Upper-right corner

These are always visible (even in hidden secret information mode) because they are public game modifiers. No players are assigned to Fabled or Loric — they are game-level effects.

### 1.5 Players List Display

Active Fabled and Loric characters should appear at the bottom of the Players List view, separate from seated players.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Travellers/Fabled/Loric | #1 | "these need to be available during script creation. the norm is to have 4 available travellers per script. Fabled and Loric are always optional and can be used in any combination/count" |
| Travellers/Fabled/Loric | #2 | "the script import option should support travellers, fabled, loric" |
| Travellers/Fabled/Loric | #3 | "the script view from top to bottom should show the existing order, travellers, fabled, then loric" |
| Travellers/Fabled/Loric | #4 | "If there are fabled or loric in play, we should show them in the upper left and right of townsquare respectively. They should always be in view regardless of hidden secret information or not. no players will ever be assigned to these characters" |
| Travellers/Fabled/Loric | #5 | "If the fabled or loric are in play, we should show them at the bottom of the players view list" |

---

## 3. Solution Overview

### 3.1 Script Builder Updates

Add three new sections to the Script Builder UI:

```
┌──────────────────────────────────┐
│  Script Builder                  │
│                                  │
│  ── Townsfolk (13) ──            │
│  [character list...]             │
│                                  │
│  ── Outsiders (4) ──             │
│  [character list...]             │
│                                  │
│  ── Minions (4) ──               │
│  [character list...]             │
│                                  │
│  ── Demons (4) ──                │
│  [character list...]             │
│                                  │
│  ── Travellers (4 typical) ──    │  ← NEW SECTION
│  [character list...]             │
│                                  │
│  ── Fabled (optional) ──         │  ← NEW SECTION
│  [character list...]             │
│                                  │
│  ── Loric (optional) ──          │  ← NEW SECTION
│  [character list...]             │
└──────────────────────────────────┘
```

- Travellers: filterable list of all Traveller characters (18 currently in the data)
- Fabled: filterable list of all Fabled characters (14 currently)
- Loric: filterable list of all Loric characters (3 currently)
- No hard count limits — selection is flexible

### 3.2 Script Import Updates

Ensure [`scriptImporter.ts`](../../UI/src/utils/scriptImporter.ts) correctly:
- Recognizes Traveller, Fabled, and Loric character IDs from imported JSON
- Preserves them in the script data
- Handles the standard BotC script JSON format where these are included in the character ID array

### 3.3 Script View Section Order

The Script Reference view should render sections in this order:

1. Townsfolk
2. Outsiders
3. Minions
4. Demons
5. Travellers
6. Fabled
7. Loric

Each section should use its type-specific color (see [`characterTypeColor.ts`](../../UI/src/components/common/characterTypeColor.ts)):
- Travellers: Blue/Red split
- Fabled: Orange-gold gradient (`#ff9800` → `#ffd54f`)
- Loric: Mossy green (`#558b2f`)

### 3.4 TownSquare Corner Display

```
┌─────────────────────────────────┐
│ [Fabled]              [Loric]   │
│  Angel                 Bigwig   │
│  Djinn                          │
│                                 │
│          ┌─────────┐            │
│         /  Player   \           │
│        / TownSquare  \          │
│       /   Circle      \         │
│                                 │
│                                 │
└─────────────────────────────────┘
```

- Fabled characters render as small cards/chips in the upper-left corner
- Loric characters render as small cards/chips in the upper-right corner
- Always visible — not affected by the "hide secret information" toggle
- Clicking on a Fabled/Loric card shows its ability text (read-only)
- No player assignment — these are game-level modifiers

### 3.5 Game State: Active Fabled/Loric

The game state needs to track which Fabled and Loric characters are currently active:

```typescript
interface GameState {
  // ... existing fields
  activeFabled: string[];  // character IDs of active Fabled
  activeLoric: string[];   // character IDs of active Loric
}
```

These can be added/removed via a game management action (separate from player assignment).

### 3.6 Players List Bottom Section

```
┌─────────────────────────────────────────────┐
│  Seat | Player | Type | ... | Alive | Vote  │
│  ─────────────────────────────────────────── │
│  1    | Alice  | TF   | ... | ✅    | ✅    │
│  2    | Bob    | OS   | ... | ✅    | ✅    │
│  ...                                        │
│  ─────────────────────────────────────────── │
│  Game Modifiers                              │
│  ─────────────────────────────────────────── │
│  —    | Angel  | Fabled | [icon] | [ability] │
│  —    | Bigwig | Loric  | [icon] | [ability] │
└─────────────────────────────────────────────┘
```

Fabled and Loric appear at the bottom of the list with:
- No seat number (they don't sit at the table)
- Character name, type, icon, and ability
- No alive/dead status, no vote, no alignment

---

## 4. Task List

### Phase 1: Script Builder — Traveller/Fabled/Loric Sections

- [ ] Add Traveller section to [`ScriptBuilder.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.tsx) with character selection checkboxes
- [ ] Add Fabled section to Script Builder with character selection checkboxes
- [ ] Add Loric section to Script Builder with character selection checkboxes
- [ ] Ensure type-specific colors are applied to each section header
- [ ] Test that selected Travellers/Fabled/Loric are included in the saved script data

### Phase 2: Script Import

- [ ] Review [`scriptImporter.ts`](../../UI/src/utils/scriptImporter.ts) and verify it handles Traveller, Fabled, and Loric character IDs
- [ ] Test importing a script JSON that includes these character types
- [ ] Fix any ID lookup failures for Traveller/Fabled/Loric characters (ensure they're in the character registry)

### Phase 3: Script View Ordering

- [ ] Update [`ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) to render sections in order: Townsfolk → Outsiders → Minions → Demons → Travellers → Fabled → Loric
- [ ] Add section headers for Travellers, Fabled, and Loric with appropriate colors
- [ ] Ensure characters within each section are sorted alphabetically (or by script sort rules)

### Phase 4: Game State — Active Fabled/Loric

- [ ] Add `activeFabled` and `activeLoric` arrays to game state in [`GameContext.tsx`](../../UI/src/context/GameContext.tsx)
- [ ] Add reducer actions: `ADD_FABLED`, `REMOVE_FABLED`, `ADD_LORIC`, `REMOVE_LORIC`
- [ ] Persist in `localStorage` via existing game state persistence
- [ ] Add UI for activating/deactivating Fabled and Loric (e.g., from a game management menu or the script view)

### Phase 5: TownSquare Corner Display

- [ ] Add Fabled corner display (upper-left) to [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx)
- [ ] Add Loric corner display (upper-right) to `TownSquareLayout.tsx`
- [ ] Render as small character cards/chips showing icon and name
- [ ] Ensure corners are always visible (not affected by hide secret info toggle)
- [ ] Add click handler to show ability text for each Fabled/Loric character
- [ ] Ensure corner display doesn't interfere with the player token circle layout

### Phase 6: Players List Bottom Section

- [ ] Add "Game Modifiers" section at the bottom of [`PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx)
- [ ] Render active Fabled and Loric characters with: name, type, icon, ability
- [ ] Omit seat, alive/dead, vote, alignment columns for these entries
- [ ] Style the section separator distinctly from player rows

### Phase 7: Tests & Stories

- [ ] Update [`ScriptBuilder.test.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.test.tsx) for Traveller/Fabled/Loric sections
- [ ] Update [`scriptImporter.test.ts`](../../UI/src/utils/scriptImporter.test.ts) for import of these character types
- [ ] Update [`ScriptReferenceTab.test.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx) for section ordering
- [ ] Update [`GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) for new state fields and actions
- [ ] Update [`TownSquareLayout.test.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.test.tsx) for corner display
- [ ] Update [`PlayerListTab.test.tsx`](../../UI/src/components/PlayerList/PlayerListTab.test.tsx) for bottom section
- [ ] Add Storybook stories for TownSquare with Fabled/Loric corners
- [ ] Add Storybook stories for Script Builder with Traveller/Fabled/Loric sections

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/ScriptBuilder/ScriptBuilder.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.tsx) | Add Traveller/Fabled/Loric sections |
| [`UI/src/components/ScriptBuilder/ScriptBuilder.test.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.test.tsx) | Updated tests |
| [`UI/src/utils/scriptImporter.ts`](../../UI/src/utils/scriptImporter.ts) | Ensure Traveller/Fabled/Loric import works |
| [`UI/src/utils/scriptImporter.test.ts`](../../UI/src/utils/scriptImporter.test.ts) | Updated tests |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/ScriptViewer/ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) | Section ordering with Traveller/Fabled/Loric |
| [`UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx) | Updated tests |
| [`UI/src/components/TownSquare/TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx) | Fabled/Loric corner display |
| [`UI/src/components/TownSquare/TownSquareLayout.test.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.test.tsx) | Updated tests |
| [`UI/src/components/PlayerList/PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx) | Bottom section for Fabled/Loric |
| [`UI/src/components/PlayerList/PlayerListTab.test.tsx`](../../UI/src/components/PlayerList/PlayerListTab.test.tsx) | Updated tests |
| [`UI/src/context/GameContext.tsx`](../../UI/src/context/GameContext.tsx) | Add `activeFabled`/`activeLoric` state |
| [`UI/src/context/GameContext.test.tsx`](../../UI/src/context/GameContext.test.tsx) | Updated tests |

### NOT Modified

- Character data files — Traveller, Fabled, and Loric characters already exist in the data (M8 added 179 characters)
- Night phase components — M14 and M15's territory
- Night history components — M19's territory
- PlayerToken or PlayerQuickActions — M16's territory for existing player cards

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M16 (TownSquare Polish) | `TownSquareLayout.tsx` | M16 fixes existing layout (sizing, centering, visibility). M18 adds new corner elements. **M16 should ideally complete first** so M18 builds on a fixed layout. If parallel, coordinate on `TownSquareLayout.tsx`. |
| M17 (List Views) | `PlayerListTab.tsx`, `ScriptReferenceTab.tsx` | M17 fixes column ordering; M18 adds new sections. Different parts of the components — low conflict risk. |
| M15 (Day/Night Workflow) | `GameContext.tsx` | Both add state fields. Additive changes — low conflict risk. |
| M19 (Night History) | `GameContext.tsx` | Both add reducer actions. Additive changes — low conflict risk. |

---

## 6. Dependencies

**Recommended sequencing:**
- **M16 (TownSquare Polish) should ideally complete first** — M18 adds Fabled/Loric corner displays to [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx), which is heavily modified by M16 for layout fixes. Building on a stable, polished layout reduces merge conflicts.
- If running in parallel with M16, explicitly coordinate on `TownSquareLayout.tsx` to avoid conflicts.

**Can run in parallel with:** M13 (Icon Replacement), M14 (Night Flashcard UX), M15 (Day/Night Workflow), M17 (List Views — low overlap), M19 (Night History).

**Prerequisites:**
- M8 (wiki scraping) complete — Traveller, Fabled, and Loric character data files must exist. ✅ Already complete (179 characters including all types).

---

## 7. Testing Requirements

### Unit Tests

**Script Builder:**
- [ ] `ScriptBuilder.test.tsx`: Test Traveller section appears with character checkboxes
- [ ] `ScriptBuilder.test.tsx`: Test Fabled section appears with character checkboxes
- [ ] `ScriptBuilder.test.tsx`: Test Loric section appears with character checkboxes
- [ ] `ScriptBuilder.test.tsx`: Test selected Travellers/Fabled/Loric are included in saved script

**Script Import:**
- [ ] `scriptImporter.test.ts`: Test importing JSON with Traveller character IDs
- [ ] `scriptImporter.test.ts`: Test importing JSON with Fabled character IDs
- [ ] `scriptImporter.test.ts`: Test importing JSON with Loric character IDs
- [ ] `scriptImporter.test.ts`: Test importing JSON with all character types mixed

**Script View:**
- [ ] `ScriptReferenceTab.test.tsx`: Test sections render in order: TF → OS → MN → DM → TR → FB → LO
- [ ] `ScriptReferenceTab.test.tsx`: Test each section has appropriate header and color

**Game State:**
- [ ] `GameContext.test.tsx`: Test `ADD_FABLED` / `REMOVE_FABLED` actions
- [ ] `GameContext.test.tsx`: Test `ADD_LORIC` / `REMOVE_LORIC` actions
- [ ] `GameContext.test.tsx`: Test active Fabled/Loric persist correctly

**TownSquare:**
- [ ] `TownSquareLayout.test.tsx`: Test Fabled renders in upper-left corner
- [ ] `TownSquareLayout.test.tsx`: Test Loric renders in upper-right corner
- [ ] `TownSquareLayout.test.tsx`: Test corners visible in both hidden and visible info modes
- [ ] `TownSquareLayout.test.tsx`: Test no corners when no Fabled/Loric active

**Players List:**
- [ ] `PlayerListTab.test.tsx`: Test "Game Modifiers" section appears at bottom when Fabled/Loric active
- [ ] `PlayerListTab.test.tsx`: Test Fabled/Loric rendered without seat/alive/vote columns
- [ ] `PlayerListTab.test.tsx`: Test no bottom section when no Fabled/Loric active

### Storybook Stories

- [ ] `TownSquareLayout.stories.tsx`: TownSquare with Fabled in upper-left
- [ ] `TownSquareLayout.stories.tsx`: TownSquare with Loric in upper-right
- [ ] `TownSquareLayout.stories.tsx`: TownSquare with both Fabled and Loric
- [ ] Script Builder story with all character type sections visible

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] Script Builder includes Traveller, Fabled, and Loric sections for character selection
- [ ] Script importer correctly handles Traveller, Fabled, and Loric character IDs in imported JSON
- [ ] Script view displays sections in order: Townsfolk → Outsiders → Minions → Demons → Travellers → Fabled → Loric
- [ ] Each section uses its type-specific color scheme
- [ ] Active Fabled characters appear in the upper-left corner of TownSquare
- [ ] Active Loric characters appear in the upper-right corner of TownSquare
- [ ] Fabled and Loric corner displays are always visible (not hidden by secret info toggle)
- [ ] No players can be assigned to Fabled or Loric characters
- [ ] Active Fabled and Loric appear at the bottom of the Players List with name, type, icon, ability
- [ ] Game state tracks `activeFabled` and `activeLoric` arrays with add/remove actions
- [ ] All existing tests pass with updates
- [ ] New tests cover script builder sections, import, view ordering, TownSquare corners, and Players List bottom section
- [ ] TypeScript compilation, ESLint, and test suite all pass
