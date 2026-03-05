# Milestone 13 — Icon Replacement — Progress

> Last updated: 2026-03-05

## Status: ✅ Complete

Merged via PR #10: [Milestone 13: Icon Replacement](https://github.com/amalfushi/StorytellerCards/pull/10)

## Phases

| Phase | Description | Status |
|-------|------------|--------|
| Phase 1 | Icon Utility | ✅ Complete |
| Phase 2 | Audit & Replace Icons | ✅ Complete |
| Phase 3 | Structural Night Cards | ✅ Complete |
| Phase 4 | Verify & Clean Up | ✅ Complete |

## Key Deliverables

### New Files Created
- `UI/src/utils/characterIcon.ts` — Icon path utility + alignment border color helper
- `UI/src/utils/characterIcon.test.ts` — 12 tests
- `UI/src/components/common/CharacterIconImage.tsx` — Reusable icon component (all views share this)
- `UI/src/components/common/CharacterIconImage.test.tsx` — 11 tests
- `UI/src/components/common/CharacterIconImage.stories.tsx` — 10 Storybook variants

### Components Updated
- `NightFlashcard.tsx` — 80px icon with glow shadow
- `PlayerToken.tsx` — SIZE_MAP-based sizing (56/52/48px)
- `NightOrderEntry.tsx` — 48px icon with order badge
- `PlayerRow.tsx` — 48px icon in table cell
- `CharacterCard.tsx` — 48px icon in accordion summary
- `CharacterDetailModal.tsx` — Updated icon rendering

### Plan Deviations
- Created centralized `CharacterIconImage` component instead of modifying each view individually
- No separate `_fallbackIcon.png` file — fallback rendered inline as colored circle with initial
- `NightHistoryReview.tsx` not modified (was in original plan)
- `CharacterDetailModal.tsx` modified (not in original plan)
- Added alignment-colored border ring, 48px minimum size, dead state support, click handlers

## Verification
- TypeScript: 0 errors
- ESLint: 0 errors
- Tests: 2404 passing
