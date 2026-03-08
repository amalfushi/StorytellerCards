# Milestone 5 — Jinxes UI — Progress

> Status: ✅ Complete
> Completed: 2025-07-24

## Summary

Implemented jinx display UI across four app locations so Storytellers always see which character interaction rules apply to their current game.

## What Was Implemented

### Phase 1: Active Jinx Detection Utility
- Created `UI/src/utils/jinxUtils.ts` with:
  - `getActiveJinxes()` — finds all jinx pairs where both characters are on the script, with deduplication of mirrored pairs
  - `getCharacterActiveJinxes()` — finds jinxes for a specific character within a script context (or all jinxes when no script context)
- Added `ActiveJinx` interface to `types/index.ts`
- Comprehensive tests in `jinxUtils.test.ts` (17 tests)

### Phase 2: Script View — Jinxes Section
- Added amber-colored "⚡ Jinxes" section at bottom of `ScriptReferenceTab.tsx`
- Shows all active jinx pairs with both character icons, names, and description
- Only visible when script has active jinxes
- 4 new tests added to `ScriptReferenceTab.test.tsx`

### Phase 3: Character Detail Modal — Jinx Section
- Added jinx section to `CharacterDetailModal.tsx` with amber styling
- Shows partner character icon, name, and jinx description
- Filters by script context via new `scriptCharacterIds` prop; shows all jinxes when no context
- 4 new tests added to `CharacterDetailModal.test.tsx`

### Phase 4: Night Flashcard — Jinx Reminder
- Added compact jinx reminder banner to `NightFlashcard.tsx`
- Amber background with ⚡ icon, partner name, and jinx text
- Displayed above the sub-action checklist via new `activeJinxes` prop
- 3 new tests added to `NightFlashcard.test.tsx`

### Phase 5: Script Builder — Jinx Indicator
- Added jinx count chip to composition summary in `ScriptBuilder.tsx`
- Shows "⚡ N Jinx(es)" when selected characters create jinx interactions
- Jinx details shown in Selection tab with paired character names and descriptions
- 4 new tests added to `ScriptBuilder.test.tsx`

### Phase 6: Tests
- `jinxUtils.test.ts`: 17 tests covering detection, deduplication, per-character, edge cases
- Component tests: 15 new tests across 4 test files
- All 3494 tests passing, 0 TypeScript errors, 0 ESLint errors

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `UI/src/utils/jinxUtils.ts` | Active jinx detection utility |
| `UI/src/utils/jinxUtils.test.ts` | Comprehensive jinx utility tests |
| `docs/milestones/5 - jinxes/progress.md` | This file |

### Modified Files
| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Added `ActiveJinx` interface |
| `UI/src/components/ScriptViewer/ScriptReferenceTab.tsx` | Jinxes section at bottom |
| `UI/src/components/ScriptViewer/ScriptReferenceTab.test.tsx` | 4 jinx section tests |
| `UI/src/components/common/CharacterDetailModal.tsx` | Jinx section + `scriptCharacterIds` prop |
| `UI/src/components/common/CharacterDetailModal.test.tsx` | 4 jinx section tests |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Jinx reminder banner + `activeJinxes` prop |
| `UI/src/components/NightPhase/NightFlashcard.test.tsx` | 3 jinx reminder tests |
| `UI/src/components/ScriptBuilder/ScriptBuilder.tsx` | Jinx indicator chip + details |
| `UI/src/components/ScriptBuilder/ScriptBuilder.test.tsx` | 4 jinx indicator tests |
| `docs/progress.md` | Updated milestone status |
| `docs/milestones/5 - jinxes/milestone5.md` | Added completion status |
