# Milestone 18 — Progress Tracker

## Status: ✅ Complete

**Completed:** 2025-07-17

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Script Builder — Traveller/Fabled/Loric Sections | ✅ Complete |
| Phase 2 | Script Import — Verify Traveller/Fabled/Loric IDs | ✅ Complete |
| Phase 3 | Script View — Section Ordering (TF→OS→MN→DM→TR→FB→LO) | ✅ Complete (already implemented) |
| Phase 4 | Game State — activeFabled/activeLoric | ✅ Complete |
| Phase 5 | TownSquare — Fabled/Loric Corner Display | ✅ Complete |
| Phase 6 | Players List — Game Modifiers Section | ✅ Complete |
| Phase 7 | Tests & Stories | ✅ Complete |

## Implementation Details

### Phase 1: Script Builder
- Extended `TYPE_ORDER` to include `Traveller`, `Fabled`, `Loric`
- Removed character type filter — all character types now shown in Browse panel
- Composition chips, section headers, and Selection tab all include new types
- Files: `ScriptBuilder.tsx`

### Phase 2: Script Import
- `scriptImporter.ts` already handles all character types — IDs are plain strings
- Added 4 new test cases verifying Traveller, Fabled, Loric, and mixed imports
- No code changes needed

### Phase 3: Script View Ordering
- `ScriptReferenceTab.tsx` already had all 7 `TYPE_SECTIONS` defined
- Added tests verifying the full ordering TF→OS→MN→DM→TR→FB→LO
- No code changes needed

### Phase 4: Game State
- Added `activeFabled?: string[]` and `activeLoric?: string[]` to `Game` interface
- Added 4 reducer actions: `ADD_FABLED`, `REMOVE_FABLED`, `ADD_LORIC`, `REMOVE_LORIC`
- Duplicate prevention on add; graceful handling of missing IDs on remove
- Persists via existing `localStorage` mechanism (auto-save on game state change)
- Files: `types/index.ts`, `GameContext.tsx`

### Phase 5: TownSquare Corner Display
- Added `CornerCharacter` interface and optional `activeFabled`/`activeLoric` props
- Fabled chips render in upper-left corner (orange `#ff9800`)
- Loric chips render in upper-right corner (green `#558b2f`)
- Always visible regardless of show/hide toggle
- Click opens Dialog showing character ability text
- Files: `TownSquareLayout.tsx`

### Phase 6: Players List Bottom Section
- Added "Game Modifiers" section below player table
- Shows active Fabled/Loric with name, type badge, and ability text
- No seat/alive/vote columns — these are game-level modifiers, not players
- Always visible (not affected by Day/Night toggle)
- Files: `PlayerListTab.tsx`

### Phase 7: Tests & Stories
- **ScriptBuilder.test.tsx**: +4 tests (Traveller/Fabled/Loric sections, saved script includes them)
- **scriptImporter.test.ts**: +4 tests (Traveller/Fabled/Loric/mixed import)
- **ScriptReferenceTab.test.tsx**: +4 tests (Traveller/Fabled/Loric sections, ordering)
- **GameContext.test.tsx**: +12 tests (ADD/REMOVE Fabled/Loric, duplicates, persistence)
- **TownSquareLayout.test.tsx**: +6 tests (corner display, no corners, ability dialog)
- **PlayerListTab.test.tsx**: +6 tests (Game Modifiers section, Fabled/Loric rendering)
- **TownSquareLayout.stories.tsx**: +3 stories (Fabled corner, Loric corner, both)
- Total new tests: **36**

## Test Results
- All 2515 tests passing across 57 files
- 0 TypeScript errors
- 0 ESLint errors
