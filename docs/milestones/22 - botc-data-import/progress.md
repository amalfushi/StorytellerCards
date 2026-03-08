# Milestone 22 — BotC Official Data Import — Progress

> Status: ✅ Complete
> Completed: 2026-03-08

## Summary

Imported canonical data from the official BotC app repository (`botc-release`) into all 179 character files, added new UI features, and validated data integrity.

## Phase Results

### Phase 1: Jinx Data ✅
- **Jinxes were already imported** from a previous milestone
- Fixed 41 missing bidirectional jinx mirrors across 17 character files
- All jinx `characterId` references validated against the character registry
- Bidirectional mirroring test added and passing

### Phase 2: Flavor Text ✅
- Added `flavor?: string` to `CharacterDef` in `types/index.ts`
- Imported flavor text from `roles.json` into all 179 character files
- Added flavor text display in `CharacterDetailModal` (italicized, in quotes)
- Structural validation: all 179 characters have non-empty flavor text

### Phase 3: Edition Data ✅
- Added `Edition` constant and `EditionLabel` mapping to `types/index.ts`
- Added `edition?: Edition` to `CharacterDef`
- Imported edition data from `roles.json` into all 179 character files
- Editions: `tb` (Trouble Brewing), `bmr` (Bad Moon Rising), `snv` (Sects & Violets), `carousel` (Experimental), `fabled`, `loric`
- Added edition badge chip in `CharacterDetailModal`
- Added edition filter chips in `ScriptBuilder` (toggleable, works with search filter)
- Added edition badge in `ScriptBuilder` character rows
- All 6 editions validated as present

### Phase 4: WebP Icon Migration ✅
- Copied 179 WebP icons from `botc-release/resources/characters/`
- Strategy: use plain `.webp` when available (41 chars), fall back to `_g.webp` (138 chars)
- Updated `getCharacterIconPath()` to return `.webp` paths
- Updated all 179 character files from `.png` to `.webp` icon references
- Removed all 179 old PNG icons
- **Size reduction: 26.01 MB → 3.67 MB (85.9% reduction)**
- Updated all test assertions for `.webp` extension

### Phase 5: Night Order Validation ✅
- Created `nightOrderValidation.test.ts` with 3 tests
- Validates first night and other nights relative ordering against `nightsheet.json`
- All ordering inversions: 0 (our order matches canonical source)
- Structural entries (minioninfo, demoninfo) validated in correct positions
- Logged expected gaps: Traveller characters in canonical but not in our night order

### Phase 6: Setup Flag & Global Reminders ✅
- Added `setup?: boolean` to `CharacterDef`
- Imported `setup: true` for 23 characters
- Added `isGlobal?: boolean` to `ReminderToken`
- Added `remindersGlobal?: ReminderToken[]` to `CharacterDef`
- Imported global reminders for 5 characters: Philosopher, Alchemist, Drunk, Marionette, Lil' Monsta
- All validated via structural tests

### Phase 7: Tests & Documentation ✅
- 3461 unit tests passing across 58 test files
- 0 TypeScript errors, 0 ESLint errors
- New test coverage:
  - `characterData.test.ts`: flavor, edition, setup, jinx, global reminders validation
  - `nightOrderValidation.test.ts`: night order alignment with canonical data
  - `CharacterDetailModal.test.tsx`: flavor text and edition badge rendering
  - `characterIcon.test.ts` and `CharacterIconImage.test.tsx`: WebP path assertions

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `scripts/importCharacterMeta.mjs` | One-time script: imported flavor, edition, setup, global reminders |
| `scripts/migrateIcons.mjs` | One-time script: copied WebP icons from botc-release |
| `scripts/fixJinxMirrors.mjs` | One-time script: fixed bidirectional jinx mirroring |
| `UI/src/data/characters/nightOrderValidation.test.ts` | Night order validation test |

### Modified Files
| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Added `Edition`, `EditionLabel`, `flavor`, `edition`, `setup`, `remindersGlobal` to `CharacterDef`; `isGlobal` to `ReminderToken` |
| `UI/src/data/characters/*.ts` (179 files) | Added flavor, edition, setup, remindersGlobal, fixed jinx mirrors |
| `UI/src/utils/characterIcon.ts` | Changed paths from `.png` to `.webp` |
| `UI/src/components/common/CharacterDetailModal.tsx` | Added flavor text + edition badge display |
| `UI/src/components/ScriptBuilder/ScriptBuilder.tsx` | Added edition filter + edition badge in rows |
| `UI/src/data/characters/characterData.test.ts` | Added M22 validation tests |
| `UI/src/utils/characterIcon.test.ts` | Updated assertions for `.webp` |
| `UI/src/components/common/CharacterIconImage.test.tsx` | Updated assertion for `.webp` |
| `UI/src/components/common/CharacterDetailModal.test.tsx` | Added flavor + edition tests |
| `UI/public/icons/characters/` | Replaced 179 PNGs with 179 WebPs |

## Key Metrics
- **Icon size reduction**: 26.01 MB → 3.67 MB (85.9%)
- **Jinx mirrors fixed**: 41 across 17 files
- **Characters with setup flag**: 23
- **Characters with global reminders**: 5
- **Night order inversions**: 0
