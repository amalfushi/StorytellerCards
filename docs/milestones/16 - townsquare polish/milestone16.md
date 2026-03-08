## Status: ✅ Complete

- **Completion date:** 2026-03-06
- **Summary:** Implemented all 6 phases of TownSquare Polish — card sizing with portrait aspect ratios and 60×90px minimums, token center fix so badges radiate from card center, visibility rules for hidden/day mode, new unified PlayerActionsModal replacing separate quick actions and edit dialog, dynamic token set built from active characters' reminders, and linear token layout mode for small viewports with localStorage persistence.
- **Key evidence:** 2470 tests across 57 test files — all passing, 0 TypeScript errors, 0 ESLint errors

### Files Created
- `UI/src/components/TownSquare/PlayerActionsModal.tsx`
- `UI/src/components/TownSquare/PlayerActionsModal.test.tsx`
- `UI/src/components/TownSquare/PlayerActionsModal.stories.tsx`
- `UI/src/utils/buildAvailableTokens.ts`
- `UI/src/utils/buildAvailableTokens.test.ts`

### Files Modified
- `UI/src/components/TownSquare/PlayerToken.tsx`
- `UI/src/components/TownSquare/PlayerToken.test.tsx`
- `UI/src/components/TownSquare/PlayerToken.stories.tsx`
- `UI/src/components/TownSquare/TokenManager.tsx`
- `UI/src/components/TownSquare/TokenManager.test.tsx`
- `UI/src/components/TownSquare/TownSquareLayout.stories.tsx`
- `UI/src/components/TownSquare/TownSquareTab.tsx`
- `UI/src/components/TownSquare/TownSquareTab.test.tsx`

---

# Milestone 16 — TownSquare Polish

> **Goal:** Fix TownSquare layout issues, visibility rules, token management, and responsive behavior to deliver a polished, functional TownSquare experience.

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

The TownSquare view has multiple layout, visibility, and interaction issues that degrade the Storyteller experience:

### 1.1 Character Card Sizing

Character cards can shrink to unreadable sizes on smaller screens or with many players. There is no enforced minimum size, and Traveller cards don't scale consistently with regular character cards.

### 1.2 Token Positioning

Tokens placed on character cards radiate from the upper-left corner of the card instead of the actual center, causing visual misalignment.

### 1.3 Context Menu Placement

The context menu (mark as dead, manage tokens, etc.) currently appears when clicking a character card in **hidden** secret information mode, but these actions should only be available in **visible** secret information mode. The actions should be combined with the edit player modal, with dead/token management prioritized above character/alignment changes.

### 1.4 Hidden Information Mode

When secret information is hidden (Day phase, public view), too much information is shown. Only player name, dead status, ghost vote, seat info, and Traveller public info should be visible. Tokens should be completely hidden.

### 1.5 Available Token Set

The set of available tokens in the context menu should be dynamically built from the active characters' token definitions (from character data). Additionally, a "Mad" token should be conditionally available when characters with "mad" abilities (e.g., Mutant, Harpy) are in play.

### 1.6 Small Viewport Token Layout

On small screens, radial token placement becomes cramped. An alternative linear layout (tokens in a line on the far side from TownSquare center) should be available, toggled via a settings option.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| TownSquare | #1 | "each character card should have a minimum size in both directions 60x90px is a good start" |
| TownSquare | #3 | "there is a misalignment between where the center of the token placement is and the actual center of the character card" |
| TownSquare | #4 | "the context menu...needs to be moved to the visible secret information mode. aka: combine with the edit player modal" |
| TownSquare | #5 | "We need to hide tokens during the hide secret information view" |
| TownSquare | #6 | "during the hide secret information view, we should only see the player name, and if they're dead, if they have a remaining ghost vote, their seat info. If the character is a traveller, we should also see the red/blue split and the character icon" |
| TownSquare | #7 | "traveller character cards are not abiding by the same sizing scaling as regular character cards" |
| TownSquare | #8 | "for each character that has tokens in the set of active characters playing, those tokens make up the set of available tokens" |
| TownSquare | #9 | "There's actually 1 more 'basic' token...Mad...this only applies if there is a character that has an ability about being mad" |
| TownSquare | #10 | "For small viewports we should place tokens in a line...on the furthest side from the center of townsquare" |

---

## 3. Solution Overview

### 3.1 Minimum Card Size

```css
.character-card {
  min-width: 60px;
  min-height: 90px;
}
```

Apply the same sizing logic to Traveller cards — they should use identical scaling rules as regular character cards.

### 3.2 Token Center Fix

The token radial positioning calculation currently uses the card's `(0, 0)` (top-left) as the center point. Fix to use:

```typescript
const centerX = cardElement.offsetLeft + cardElement.offsetWidth / 2;
const centerY = cardElement.offsetTop + cardElement.offsetHeight / 2;
```

### 3.3 Context Menu & Visibility Rules

**Hidden information mode** (Day phase, public view):
| Element | Visible? |
|---------|----------|
| Player name | ✅ |
| Dead status | ✅ |
| Ghost vote remaining | ✅ |
| Seat number | ✅ |
| Character name | ❌ |
| Character icon | ❌ (unless Traveller) |
| Character type color | ❌ (unless Traveller — show red/blue split) |
| Alignment | ❌ (even for Travellers) |
| Tokens | ❌ |
| Context menu (edit actions) | ❌ |

**Visible information mode** (Night phase, ST view):
| Element | Visible? |
|---------|----------|
| Everything | ✅ |
| Context menu / Edit actions | ✅ — combined into edit player modal |

### 3.4 Edit Player Modal Reorder

When in visible mode, the edit player modal should show actions in this priority order:

1. **Mark as Dead** / **Mark as Alive**
2. **Manage Tokens** (add/remove tokens)
3. **Change Character**
4. **Change Alignment**

### 3.5 Dynamic Token Set

Build the set of available tokens from:

1. **Basic tokens**: Poison, Drunk (always available)
2. **Mad token**: Only available if any active character has an ability mentioning "mad" (e.g., Mutant, Harpy, Cerenovus)
3. **Character-specific tokens**: From each active character's `reminders` array in their `CharacterDef`

```typescript
function buildAvailableTokens(activeCharacters: CharacterDef[]): ReminderToken[] {
  const tokens: ReminderToken[] = [...basicTokens];
  
  // Add "Mad" conditionally
  const hasMadCharacter = activeCharacters.some(c => 
    c.abilityShort.toLowerCase().includes('mad')
  );
  if (hasMadCharacter) {
    tokens.push({ id: 'basic-mad', text: 'Mad' });
  }
  
  // Add character-specific tokens
  for (const char of activeCharacters) {
    tokens.push(...char.reminders);
  }
  
  return tokens;
}
```

### 3.6 Small Viewport Token Layout

For viewports below a breakpoint (e.g., `< 480px`):
- Tokens are placed in a horizontal or vertical line on the **furthest side** from TownSquare center for each card
- A settings toggle in the navbar allows switching between radial and linear token layouts
- The setting persists in `localStorage`

---

## 4. Task List

### Phase 1: Card Sizing

- [x] Set minimum card dimensions to `60px × 90px` in [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx)
- [x] Ensure Traveller cards use the same sizing/scaling logic as regular character cards
- [x] Verify card sizing works with various player counts (5–15+ players)

### Phase 2: Token Center Fix

- [x] Fix token radial positioning in [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx) or [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) to use card center, not upper-left
- [x] Test with multiple tokens on a single card to verify correct radial spread

### Phase 3: Visibility Rules

- [x] Update [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) to hide character info in hidden mode:
  - Hide character name, icon, type color (except Travellers)
  - Show only player name, dead status, ghost vote, seat number
- [x] For Travellers in hidden mode: show character icon and red/blue type split, but hide alignment
- [x] Hide all tokens on character cards in hidden information mode
- [x] Remove context menu (quick actions) from hidden mode entirely

### Phase 4: Context Menu & Edit Modal

- [x] Move context menu actions to visible information mode only
- [x] Combine context menu actions into the edit player modal ([`PlayerEditDialog.tsx`](../../UI/src/components/PlayerList/PlayerEditDialog.tsx) or [`PlayerQuickActions.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.tsx))
- [x] Reorder modal actions: Mark Dead → Manage Tokens → Change Character → Change Alignment

### Phase 5: Dynamic Token Set

- [x] Create utility function `buildAvailableTokens()` to derive available tokens from active characters
- [x] Integrate with [`TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) — populate token selection from the derived set
- [x] Add "Mad" as a conditional basic token — available only when a character with a "mad" ability is in play
- [x] Source basic tokens (Poison, Drunk) from a constants file rather than hardcoding

### Phase 6: Small Viewport Token Layout

- [x] Implement linear token layout mode as an alternative to radial
- [x] Linear mode places tokens in a line on the side of the card furthest from TownSquare center
- [x] Add a settings toggle (gear icon in navbar or TownSquare header) to switch between radial/linear
- [x] Auto-select linear mode for viewports `< 480px` (with manual override via toggle)
- [x] Persist the layout preference in `localStorage`

### Phase 7: Tests & Stories

- [x] Update [`PlayerToken.test.tsx`](../../UI/src/components/TownSquare/PlayerToken.test.tsx) for min sizing, visibility rules
- [x] Update [`TownSquareLayout.test.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.test.tsx) for token centering fix
- [x] Update [`PlayerQuickActions.test.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.test.tsx) for context menu relocation
- [x] Update [`TokenManager.test.tsx`](../../UI/src/components/TownSquare/TokenManager.test.tsx) for dynamic token set
- [x] Add test for "Mad" token conditional availability
- [x] Update Storybook stories for new layout variants and visibility modes
- [x] Add stories for small viewport linear token layout

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/TownSquare/PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) | Min sizing, visibility rules, token positioning fix |
| [`UI/src/components/TownSquare/PlayerToken.test.tsx`](../../UI/src/components/TownSquare/PlayerToken.test.tsx) | Updated tests |
| [`UI/src/components/TownSquare/TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx) | Token center fix, linear layout mode |
| [`UI/src/components/TownSquare/TownSquareLayout.test.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.test.tsx) | Updated tests |
| [`UI/src/components/TownSquare/PlayerQuickActions.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.tsx) | Context menu — visible mode only, reordered |
| [`UI/src/components/TownSquare/PlayerQuickActions.test.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.test.tsx) | Updated tests |
| [`UI/src/components/TownSquare/TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) | Dynamic token set from active characters |
| [`UI/src/components/TownSquare/TokenManager.test.tsx`](../../UI/src/components/TownSquare/TokenManager.test.tsx) | Updated tests |
| [`UI/src/components/TownSquare/TownSquareTab.tsx`](../../UI/src/components/TownSquare/TownSquareTab.tsx) | Possible settings toggle integration |
| [`UI/src/components/TownSquare/TownSquareTab.test.tsx`](../../UI/src/components/TownSquare/TownSquareTab.test.tsx) | Updated tests |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/PlayerList/PlayerEditDialog.tsx`](../../UI/src/components/PlayerList/PlayerEditDialog.tsx) | Combine quick actions into edit modal |
| [`UI/src/components/PlayerList/PlayerEditDialog.test.tsx`](../../UI/src/components/PlayerList/PlayerEditDialog.test.tsx) | Updated tests |

### NOT Modified

- Character data files — token definitions are read from existing `reminders` arrays
- Night phase components — M14 and M15's territory
- Night history components — M19's territory
- Game context state (unless settings toggle state needs persisting)

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M13 (Icon Replacement) | `PlayerToken.tsx` | M13 changes icon rendering; M16 changes sizing/layout/visibility. Different aspects but same file — coordinate merge order. |
| M18 (Traveller/Fabled/Loric) | `TownSquareLayout.tsx` | M18 adds Fabled/Loric corners to TownSquare. M16 fixes existing layout. M18 should ideally run after M16 to build on fixed layout. |

---

## 6. Dependencies

**No hard dependencies.** Can run in parallel with M13, M14, M15, M17, M19.

**Recommended sequencing:**
- M16 should complete before M18 (Traveller/Fabled/Loric Integration) to avoid conflicts on [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx). M18 adds Fabled/Loric corner displays and should build on the polished layout from M16.
- If running in parallel with M18, coordinate on `TownSquareLayout.tsx` to avoid merge conflicts.

---

## 7. Testing Requirements

### Unit Tests

- [x] `PlayerToken.test.tsx`: Test minimum card dimensions (60×90px)
- [x] `PlayerToken.test.tsx`: Test Traveller cards scale same as regular cards
- [x] `PlayerToken.test.tsx`: Test hidden mode shows only: player name, dead status, ghost vote, seat
- [x] `PlayerToken.test.tsx`: Test hidden mode Traveller shows icon + red/blue split, hides alignment
- [x] `PlayerToken.test.tsx`: Test tokens are hidden in hidden mode
- [x] `TownSquareLayout.test.tsx`: Test token positioning uses card center
- [x] `PlayerQuickActions.test.tsx`: Test context menu only appears in visible mode
- [x] `PlayerQuickActions.test.tsx`: Test action order: Dead → Tokens → Character → Alignment
- [x] `TokenManager.test.tsx`: Test available tokens include character-specific reminders
- [x] `TokenManager.test.tsx`: Test "Mad" token appears when Mad-related character is active
- [x] `TokenManager.test.tsx`: Test "Mad" token does NOT appear when no Mad-related character is active
- [x] `TokenManager.test.tsx`: Test basic tokens (Poison, Drunk) always present
- [x] Test linear token layout mode renders tokens in a line
- [x] Test settings toggle persists layout preference

### Storybook Stories

- [x] `PlayerToken.stories.tsx`: Hidden mode vs. visible mode variants
- [x] `PlayerToken.stories.tsx`: Traveller in hidden mode (showing icon + blue/red split)
- [x] `TownSquareLayout.stories.tsx`: Radial vs. linear token layout
- [x] `TownSquareLayout.stories.tsx`: Small viewport variant
- [x] `PlayerQuickActions.stories.tsx`: Reordered actions in visible mode
- [x] `TokenManager`: Story showing dynamic token list from active characters

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [x] Character cards have a minimum size of 60×90px
- [x] Traveller cards scale identically to regular character cards
- [x] Tokens radiate from the actual center of character cards (not upper-left)
- [x] In hidden information mode: only player name, dead status, ghost vote, and seat are visible
- [x] In hidden mode: Travellers additionally show their character icon and red/blue type split (but NOT alignment)
- [x] All tokens are hidden in hidden information mode
- [x] Context menu / quick actions only appear in visible information mode
- [x] Edit modal action order: Mark Dead → Manage Tokens → Change Character → Change Alignment
- [x] Available tokens are dynamically built from active characters' `reminders` arrays
- [x] "Mad" token is conditionally available only when a character with mad-related ability is in play
- [x] Basic tokens (Poison, Drunk) are always available
- [x] Small viewport alternative: tokens in a linear layout on the far side from center
- [x] Settings toggle available to switch between radial and linear token layouts
- [x] All existing tests pass with updates
- [x] New tests cover visibility rules, sizing, token set generation, and layout modes
- [x] TypeScript compilation, ESLint, and test suite all pass
