# Milestone 14 — Night Flashcard UX — Progress

> Last updated: 2026-03-05

## Status: ✅ Complete

## Phases

| Phase | Description | Status |
|-------|------------|--------|
| Phase 1 | Analyze Current Structure | ✅ Complete |
| Phase 2 | Update Sub-Action Rendering | ✅ Complete |
| Phase 3 | Update Power Description Styling | ✅ Complete |
| Phase 4 | Update Night Action Completion Logic | ✅ Complete (no changes needed) |
| Phase 5 | Update Storybook Stories | ✅ Complete |

## Key Deliverables

### New Files Created
- `UI/src/components/NightPhase/subActionUtils.ts` — `computeActionableIndices()` extracted utility

### Files Modified
- `SubActionChecklist.tsx` — Actionable/non-actionable rendering split
- `NightFlashcard.tsx` — `abilityShort` bold styling (was italic)
- `SubActionChecklist.test.tsx` — Rewritten with 15 tests (5 unit + 10 rendering)
- `NightFlashcard.test.tsx` — Added bold styling test, updated checkbox assertion
- `StructuralCard.test.tsx` — Updated checkbox count assertion
- `SubActionChecklist.stories.tsx` — Added `WithConditionalHierarchy`, `SingleAction` stories
- `NightFlashcard.stories.tsx` — Updated JSDoc for bold description
- `mockData.ts` — Added `pitHag` and `pitHagOtherNightEntry` exports

### Plan Deviations
- No type changes to `NightSubAction` — actionability determined at render time
- `NightProgressBar` unchanged (doesn't track checkbox state)
- `GameContext.tsx` unchanged (no completion gate logic exists)
- Utility extracted to separate file (`subActionUtils.ts`) for ESLint compliance

## Verification
- TypeScript: 0 errors
- ESLint: 0 errors
- Tests: 2411 passing across 55 test files
