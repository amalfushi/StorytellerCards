# Milestone 4 — Multi-Demon & Edge Case Support — Progress

> Status: ✅ Complete
> Completed: 2025-07-18

## Summary

Implemented flexible demon count support, alignment auto-update on character changes, and conditional night order logic for edge-case BotC scenarios (Legion, Atheist, Lil' Monsta, Pit-Hag).

## Phases Completed

### Phase 1: Distribution Rules Flexibility ✅
- Added `getDistributionSuggestions()` — script-aware suggestions for Legion, Atheist, Lil' Monsta
- Added `getDistributionWarnings()` — soft warnings for unusual demon/minion counts
- Updated `CharacterAssignmentDialog` to display suggestions and warnings as MUI `Alert` components
- Allowed duplicate character IDs in assignment (for Legion)

### Phase 2: Alignment Auto-Update ✅
- Updated `GameContext` `UPDATE_PLAYER` reducer to auto-derive alignment from character type when `characterId` changes
- Demon/Minion → Evil, Townsfolk/Outsider → Good
- Explicit alignment override still supported (for edge cases like Marionette)
- Auto-updated alignment persists to localStorage

### Phase 3: Night Order Edge Cases ✅
- Made `demoninfo` conditional: skipped when Atheist on script or no demon players (unless Lil' Monsta)
- Made `minioninfo` conditional: skipped when Atheist on script
- Added deduplication: multiple players sharing a character (Legion) produce one night order entry
- Added `getPlayerNamesForCharacter()` utility for flashcards to show all relevant player names

### Phase 4: Tests ✅
- 33 new tests added across 4 files
- All 3494 unit tests passing (58 files)
- 0 TypeScript errors, 0 ESLint errors

## Files Modified

| File | Change |
|------|--------|
| `UI/src/data/playerCountRules.ts` | Added `getDistributionSuggestions()`, `getDistributionWarnings()`, types |
| `UI/src/utils/nightOrderFilter.ts` | Conditional structural entries, deduplication, `getPlayerNamesForCharacter()` |
| `UI/src/context/GameContext.tsx` | Alignment auto-update in `UPDATE_PLAYER` reducer |
| `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx` | Suggestions, warnings, duplicate-allowed IDs |
| `UI/src/data/playerCountRules.test.ts` | 17 new tests for suggestions and warnings |
| `UI/src/utils/nightOrderFilter.test.ts` | 14 new tests for conditional entries, deduplication, player names |
| `UI/src/context/GameContext.test.tsx` | 7 new tests for alignment auto-update |
| `UI/src/hooks/useNightOrder.test.ts` | Updated existing tests, added Atheist-specific test |
