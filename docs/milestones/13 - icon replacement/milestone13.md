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
- The fallback should be a generic character silhouette or the existing colored-circle placeholder
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

- [ ] Create `UI/src/utils/characterIcon.ts` with `getCharacterIconPath()` function
- [ ] Create `UI/src/utils/characterIcon.test.ts` with tests for the utility
- [ ] Add a generic fallback icon to `UI/public/icons/characters/` (e.g., `_fallbackIcon.png` or use an inline SVG)

### Phase 2: Audit & Replace Icons in Each View

- [ ] **Night Flashcards** ([`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx)): Replace placeholder icon rendering with real PNG using `getCharacterIconPath()`
- [ ] **TownSquare** ([`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx)): Replace placeholder icon/colored circle with real PNG
- [ ] **Night Order** ([`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx)): Replace placeholder icon with real PNG
- [ ] **Night History** ([`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx)): Replace placeholder icon with real PNG
- [ ] **Players List** ([`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx)): Replace placeholder icon with real PNG
- [ ] **Script View** ([`CharacterCard.tsx`](../../UI/src/components/ScriptViewer/CharacterCard.tsx)): Replace placeholder icon with real PNG
- [ ] Add `onError` fallback handler on all `<img>` elements to gracefully handle missing icons

### Phase 3: Structural Night Cards

- [ ] **Structural Cards** ([`StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx)): Determine if structural entries (Dusk, Dawn, Minion Info, Demon Info) need icons; if not, ensure they render without broken image references

### Phase 4: Verify & Clean Up

- [ ] Remove any remaining placeholder icon CSS (colored circles used as icon substitutes)
- [ ] Verify no broken `<img>` references across the app by checking browser console for 404s
- [ ] Update Storybook stories to verify icon rendering in visual tests

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

- [ ] `characterIcon.test.ts`: Test `getCharacterIconPath()` returns correct path for known character IDs
- [ ] `characterIcon.test.ts`: Test fallback behavior for unknown/empty character IDs
- [ ] Update existing component tests to verify `<img>` elements render with correct `src` attributes
- [ ] Test `onError` fallback handler swaps to generic icon

### Visual Testing

- [ ] Update Storybook stories for `PlayerToken`, `NightFlashcard`, `CharacterCard` to show real icons
- [ ] Verify icons render at correct sizes in each context

### Integration Verification

- [ ] Run the app (`npm run dev`) and manually verify icons appear in:
  - Night flashcards
  - TownSquare tokens
  - Night order list
  - Night history
  - Players list
  - Script view
- [ ] Check browser console for any 404 errors on icon paths

### Development Checklist

Before completing this milestone, run and pass all three:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

---

## 8. Acceptance Criteria

- [ ] Every view that displays character information renders the actual PNG icon from `UI/public/icons/characters/`
- [ ] No placeholder colored circles remain as the primary icon display for characters that have icon files
- [ ] Missing icons gracefully fall back to a generic icon (no broken image indicators)
- [ ] Structural night entries (Dusk, Dawn, etc.) render appropriately without broken images
- [ ] All existing tests pass with icon-related updates
- [ ] New utility function has comprehensive test coverage
- [ ] No 404 errors in browser console for icon paths during normal app usage
- [ ] TypeScript compilation, ESLint, and test suite all pass
