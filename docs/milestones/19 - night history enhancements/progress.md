# Milestone 19 — Night History Enhancements — Progress

## Status: ✅ Complete

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Edit Mode Toggle | ✅ Complete |
| Phase 2 | Editable Notes | ✅ Complete |
| Phase 3 | Editable Choices | ✅ Complete |
| Phase 4 | Actionable Summary | ✅ Complete |
| Phase 5 | Tests & Stories | ✅ Complete |

## Changes Made

### Phase 1: Edit Mode Toggle
- Replaced "Editable" text label with an interactive toggle button (📝 Edit / 👁 View)
- Default mode is **view** (read-only) — FlashcardCarousel receives `readOnly={true}`
- Toggle switches to **edit** mode — FlashcardCarousel receives `readOnly={false}`
- Added accessible aria-labels for the toggle button

### Phase 2: Editable Notes
- Added `UPDATE_NIGHT_HISTORY_NOTE` reducer action to `GameContext.tsx`
- Granular action updates only the note for a specific character in a specific night entry
- `NightHistoryReview` dispatches this action instead of replacing the entire entry for note changes
- Changes persist to localStorage via the auto-save effect

### Phase 3: Editable Choices
- Added `UPDATE_NIGHT_HISTORY_CHOICE` reducer action to `GameContext.tsx`
- Granular action updates only the selection for a specific character in a specific night entry
- Edits apply only to the history entry — the current active night is not affected
- Changes persist to localStorage via the auto-save effect

### Phase 4: Actionable Summary
- Added `NightSummaryLine` interface to `types/index.ts`
- Added `generateActionableNightSummary()` utility function to `nightHistoryUtils.ts`
- Summary generation logic: Demon kills show "(killed)", Poisoner shows "(poisoned)", multi-player choices join with "&", structural entries are skipped
- Summary lines displayed in `NightHistoryDrawer` sidebar under each night entry
- Summaries update reactively via `useMemo` when history changes

### Phase 5: Tests & Stories
- Updated `NightHistoryReview.test.tsx`: 17 tests (added edit toggle, note/choice granular action tests)
- Updated `NightHistoryDrawer.test.tsx`: 15 tests (added actionable summary display tests)
- Updated `nightHistoryUtils.test.ts`: 33+ tests (added 15 generateActionableNightSummary tests)
- Updated `GameContext.test.tsx`: added UPDATE_NIGHT_HISTORY_NOTE (5 tests) and UPDATE_NIGHT_HISTORY_CHOICE (6 tests) sections
- Added `WithActionableSummaries` Storybook story to NightHistoryDrawer.stories.tsx
- Added mock data `mockNightHistoryWithSelections` to stories/mockData.ts

## Files Modified

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Added `NightSummaryLine` interface |
| `UI/src/context/GameContext.tsx` | Added `UPDATE_NIGHT_HISTORY_NOTE` and `UPDATE_NIGHT_HISTORY_CHOICE` actions |
| `UI/src/context/GameContext.test.tsx` | Added 11 tests for new reducer actions |
| `UI/src/utils/nightHistoryUtils.ts` | Added `generateActionableNightSummary()` function |
| `UI/src/utils/nightHistoryUtils.test.ts` | Added 15 tests for summary generation |
| `UI/src/components/NightHistory/NightHistoryReview.tsx` | Added edit/view toggle, granular dispatch |
| `UI/src/components/NightHistory/NightHistoryReview.test.tsx` | Added 8 tests for edit mode toggle |
| `UI/src/components/NightHistory/NightHistoryDrawer.tsx` | Added summary display with `useCharacterLookup` |
| `UI/src/components/NightHistory/NightHistoryDrawer.test.tsx` | Added 4 tests for actionable summary |
| `UI/src/components/NightHistory/NightHistoryDrawer.stories.tsx` | Added `WithActionableSummaries` story |
| `UI/src/stories/mockData.ts` | Added `mockNightHistoryWithSelections` |

## Verification

- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `npx eslint .` — 0 errors, 0 warnings
- ✅ `npx vitest run --project unit` — 2513 tests passed (57 test files)
