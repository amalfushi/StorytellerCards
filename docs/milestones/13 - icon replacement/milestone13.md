# Milestone 13 — Icon Replacement

> **Goal:** Replace all remaining placeholder/missing character icons across every view with the actual icon PNGs downloaded in M8, and add graceful fallback for any missing icon files.

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
9. [Implementation Notes](#9-implementation-notes)

---

## 1. Problem Statement

M8 downloaded 179 character icon PNGs to `UI/public/icons/characters/` using the naming convention `{characterId}Icon.png` (e.g., `fortunetellerIcon.png`, `impIcon.png`). However, many views in the app still render placeholder icons (colored circles or `<TODO>` markers) instead of the actual character images. This creates a visually incomplete experience across the entire application.

The icon files exist on disk but are not consistently referenced in the rendering components. Each view that displays character information needs to be audited and updated to use the real icon path.

---

## 2. Source Items

From [`Milestoneoverload.md`](../Milestoneoverload.md):

| Section | Item | Text |
|---------|------|------|
| Night cards | #3 | "we need to replace the Placeholder icon with the actual icon" |
| Night order view | #2 | "we need to replace placeholder icons with actual icons" |
| Night history | bullet 1 | "we need to be using the actual character icons" |
| TownSquare | #2 | "we need to replace the character icons with the actual icons" |

---

## 3. Solution Overview

### 3.1 Icon Path Convention

All character icons follow the path pattern:
```
/icons/characters/{characterId}Icon.png
```

Examples:
- `/icons/characters/fortunetellerIcon.png`
- `/icons/characters/impIcon.png`
- `/icons/characters/nodashiiIcon.png`

### 3.2 Utility Function

Create a shared utility function that resolves a character ID to its icon path, with a fallback for missing icons:

```typescript
/**
 * Get the icon path for a character by ID.
 * Returns the path to the character's PNG icon, or a fallback generic icon
 * if the character ID is unknown.
 */
export function getCharacterIconPath(characterId: string): string {
  return `/icons/characters/${characterId}Icon.png`;
}
```

### 3.3 Fallback Strategy

- Use an `onError` handler on `<img>` elements to swap in a generic fallback icon when a character's PNG doesn't exist
- The fallback should the existing colored-circle placeholder
- This handles edge cases like custom homebrew characters or characters added after M8's icon download

### 3.4 Views to Update

```
Night Flashcards ──► NightFlashcard.tsx
TownSquare ─────────► PlayerToken.tsx
Night Order ────────► NightOrderEntry.tsx
Night History ──────► NightHistoryReview.tsx
Players List ───────► PlayerRow.tsx
Script View ────────► CharacterCard.tsx
```

---

## 4. Task List

### Phase 1: Icon Utility

- [x] Create `UI/src/utils/characterIcon.ts` with `getCharacterIconPath()` function
- [x] Create `UI/src/utils/characterIcon.test.ts` with tests for the utility
- [x] Add a generic fallback icon to `UI/public/icons/characters/` (e.g., `_fallbackIcon.png` or use an inline SVG)

### Phase 2: Audit & Replace Icons in Each View

- [x] **Night Flashcards** ([`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx)): Replace placeholder icon rendering with real PNG using `getCharacterIconPath()`
- [x] **TownSquare** ([`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx)): Replace placeholder icon/colored circle with real PNG
- [x] **Night Order** ([`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx)): Replace placeholder icon with real PNG
- [x] **Night History** ([`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx)): Replace placeholder icon with real PNG
- [x] **Players List** ([`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx)): Replace placeholder icon with real PNG
- [x] **Script View** ([`CharacterCard.tsx`](../../UI/src/components/ScriptViewer/CharacterCard.tsx)): Replace placeholder icon with real PNG
- [x] Add `onError` fallback handler on all `<img>` elements to gracefully handle missing icons

### Phase 3: Structural Night Cards

- [x] **Structural Cards** ([`StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx)): Determine if structural entries (Dusk, Dawn, Minion Info, Demon Info) need icons; if not, ensure they render without broken image references

### Phase 4: Verify & Clean Up

- [x] Remove any remaining placeholder icon CSS (colored circles used as icon substitutes)
- [x] Verify no broken `<img>` references across the app by checking browser console for 404s
- [x] Update Storybook stories to verify icon rendering in visual tests

---

## 5. Files Affected

### Owned by This Milestone

| File | Change |
|------|--------|
| `UI/src/utils/characterIcon.ts` | **New** — icon path utility |
| `UI/src/utils/characterIcon.test.ts` | **New** — tests for icon utility |

### Modified by This Milestone

| File | Change |
|------|--------|
| [`UI/src/components/NightPhase/NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) | Replace placeholder with real icon |
| [`UI/src/components/TownSquare/PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) | Replace placeholder with real icon |
| [`UI/src/components/NightOrder/NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx) | Replace placeholder with real icon |
| [`UI/src/components/NightHistory/NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx) | Replace placeholder with real icon |
| [`UI/src/components/PlayerList/PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) | Replace placeholder with real icon |
| [`UI/src/components/ScriptViewer/CharacterCard.tsx`](../../UI/src/components/ScriptViewer/CharacterCard.tsx) | Replace placeholder with real icon |

### NOT Modified

- Character data files in `UI/src/data/characters/` — icon paths are resolved at render time, not stored in data
- Night order logic (`_nightOrder.ts`, `nightOrderFilter.ts`)
- Game context / state management

### Potential Overlap with Other Milestones

| Milestone | Shared File | Coordination |
|-----------|-------------|--------------|
| M14 (Night Flashcard UX) | `NightFlashcard.tsx` | M13 changes icon rendering; M14 changes step/checkbox layout. Different sections of the component. |
| M16 (TownSquare Polish) | `PlayerToken.tsx` | M13 changes icon rendering; M16 changes sizing/layout. Different aspects. |
| M17 (List Views) | `PlayerRow.tsx` | M13 changes icon rendering; M17 changes column order. Different aspects. |

---

## 6. Dependencies

**None.** This milestone can run in parallel with all other milestones (M14–M19).

**Prerequisite:** M8 (wiki scraping) must be complete — character icon PNGs must exist in `UI/public/icons/characters/`. ✅ Already complete.

---

## 7. Testing Requirements

### Unit Tests

- [x] `characterIcon.test.ts`: Test `getCharacterIconPath()` returns correct path for known character IDs
- [x] `characterIcon.test.ts`: Test fallback behavior for unknown/empty character IDs
- [x] Update existing component tests to verify `<img>` elements render with correct `src` attributes
- [x] Test `onError` fallback handler swaps to generic icon

### Visual Testing

- [x] Update Storybook stories for `PlayerToken`, `NightFlashcard`, `CharacterCard` to show real icons
- [x] Verify icons render at correct sizes in each context

### Integration Verification

- [x] Run the app (`npm run dev`) and manually verify icons appear in:
  - Night flashcards
  - TownSquare tokens
  - Night order list
  - Night history
  - Players list
  - Script view
- [x] Check browser console for any 404 errors on icon paths

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [x] Every view that displays character information renders the actual PNG icon from `UI/public/icons/characters/`
- [x] No placeholder colored circles remain as the primary icon display for characters that have icon files
- [x] Missing icons gracefully fall back to a generic icon (no broken image indicators)
- [x] Structural night entries (Dusk, Dawn, etc.) render appropriately without broken images
- [x] All existing tests pass with icon-related updates
- [x] New utility function has comprehensive test coverage
- [x] No 404 errors in browser console for icon paths during normal app usage
- [x] TypeScript compilation, ESLint, and test suite all pass

---

## 9. Implementation Notes

> Added post-completion to document deviations from the original plan.

### Key Architectural Deviation: Centralized `CharacterIconImage` Component

Instead of modifying each component individually to call `getCharacterIconPath()` directly, a **reusable `CharacterIconImage` component** was created at [`UI/src/components/common/CharacterIconImage.tsx`](../../UI/src/components/common/CharacterIconImage.tsx). All 6 views now share this single component for consistent icon rendering, sizing, fallback behavior, and styling.

### Phase 1 Deviations

- `getCharacterIconPath()` and `FALLBACK_ICON_PATH` were created as planned, plus an additional `getAlignmentBorderColor()` helper
- `characterIcon.test.ts` contains 12 tests (more than originally scoped)
- **No separate `_fallbackIcon.png` file** was added to `UI/public/icons/characters/`; instead, the fallback is a colored circle with the character's first letter, rendered inline by `CharacterIconImage`

### Phase 2 Deviations

All views updated to use `<CharacterIconImage>` instead of calling `getCharacterIconPath()` directly:

| Component | Icon Size | Notes |
|-----------|-----------|-------|
| [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) | 80px | Glow shadow effect |
| [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) | SIZE_MAP (56/52/48px) | Size varies by player count |
| [`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx) | 48px | With order badge overlay |
| [`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) | 48px | In table cell |
| [`CharacterCard.tsx`](../../UI/src/components/ScriptViewer/CharacterCard.tsx) | 48px | In accordion summary |
| [`CharacterDetailModal.tsx`](../../UI/src/components/common/CharacterDetailModal.tsx) | — | **Not in original plan** — also updated |

- **`NightHistoryReview.tsx` was NOT modified** despite being listed in the original plan (the component did not need icon changes)
- `onError` fallback is built into `CharacterIconImage` — falls back to a colored circle with the character's initial letter

### Phase 3 & 4 Notes

- Structural cards (Dusk, Dawn, Minion Info, Demon Info) verified to render without broken image references
- Placeholder icon CSS replaced by the `CharacterIconImage` component
- Storybook stories added: [`CharacterIconImage.stories.tsx`](../../UI/src/components/common/CharacterIconImage.stories.tsx) with 10 variants

### Additional Features (Not in Original Plan)

- **48px minimum icon size** enforced via `Math.max(rawSize, 48)` to prevent icons from being too small on mobile
- **Alignment-colored border ring** — 3px solid border: blue (`#1976d2`) for Good, red (`#d32f2f`) for Evil, character type color as fallback
- **White circular background** behind the icon PNG for visual clarity
- **`isDead` prop support** — desaturates + darkens via CSS filter for dead players
- **Click handler support** — enables opening `CharacterDetailModal` from the icon

### Test Results

| Test File | Count |
|-----------|-------|
| `characterIcon.test.ts` | 12 tests |
| `CharacterIconImage.test.tsx` | 11 tests |
| All existing component tests | Updated for new `<img>` selectors |
| **Final total** | **2404 tests passing** |

- TypeScript: 0 errors
- ESLint: 0 errors
