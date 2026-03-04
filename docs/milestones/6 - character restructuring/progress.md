# Milestone 6 — Progress

> Character data restructuring: monolithic JSON → individual TypeScript files with declarative night choices.
>
> Requirements: [`milestone6.md`](milestone6.md)

---

## Status: ✅ Complete (Phases 1–5 of 7)

Phases 6 (Deprecate Regex) and 7 (Cleanup) were partially completed. Remaining items intentionally deferred — see [Deferred Items](#deferred-items) below and the [M6 Deferred Cleanup](../../progress.md) section in the main progress tracker.

---

## Summary

Replaced `characters.json` (43 characters) and `nightOrder.json` (168 entries) with individual TypeScript character files and a derived night order system. Added declarative `NightChoice` schema to replace regex-based choice parsing.

## What Was Done

### Phase 1: Schema Design

- Added new types to [`types/index.ts`](../../UI/src/types/index.ts):
  - `NightChoiceType` — `as const` object for choice selector types (`player`, `livingPlayer`, `deadPlayer`, `character`, `alignment`, `yesno`)
  - `NightChoice` — declarative description of interactive night action choices
  - `SetupModification` — how a character modifies player-count distribution
  - `StorytellerSetup` — pre-game decisions for the Storyteller
  - `GameRuleOverride` — Fabled/Loric rule overrides
  - `Jinx` — character interaction stub for M5
- Added optional `choices?: NightChoice[]` to `NightAction`
- Added optional `setupModification?`, `storytellerSetup?`, `gameRuleOverrides?`, `jinxes?` to `CharacterDef`

### Phase 2: Infrastructure

- Created directory structure: `UI/src/data/characters/{townsfolk,outsider,minion,demon,fabled,traveller}/`
- Created [`_nightOrder.ts`](../../UI/src/data/characters/_nightOrder.ts) with structural entries (`FIRST_NIGHT_STRUCTURAL`, `OTHER_NIGHTS_STRUCTURAL`) and `buildNightOrder()` function
- Created [`index.ts`](../../UI/src/data/characters/index.ts) barrel file with `allCharacters`, `characterMap`, `getCharacter()`, and re-exported `buildNightOrder`

### Phase 3: Character Conversion

Created 43 individual `.ts` files from `characters.json` data:

| Type | Count | Characters |
|------|-------|------------|
| Townsfolk | 21 | amnesiac, balloonist, cannibal, farmer, fisherman, fortuneteller, highpriestess, huntsman, knight, monk, noble, oracle, philosopher, pixie, sage, savant, seamstress, slayer, snakecharmer, steward, villageidiot |
| Outsider | 8 | damsel, drunk, golem, goon, klutz, mutant, ogre, recluse |
| Minion | 8 | baron, cerenovus, harpy, marionette, mezepheles, poisoner, scarletwoman, spy |
| Demon | 5 | fanggu, imp, kazali, nodashii, ojo |
| Fabled | 1 | spiritofivory |

Each character file includes:
- Core fields: `id`, `name`, `type`, `defaultAlignment`, `abilityShort`, `icon`, `reminders`
- Night actions: `firstNight`/`otherNights` with `order`, `helpText`, `subActions`
- Declarative `choices` arrays where applicable
- M6 extension fields where applicable (e.g., Baron has `setupModification`, Drunk has `storytellerSetup`)

### Phase 4: Consumer Migration

| File | Change |
|------|--------|
| [`useCharacterLookup.ts`](../../UI/src/hooks/useCharacterLookup.ts) | Imports from barrel instead of JSON; no `useMemo` needed for map construction |
| [`useNightOrder.ts`](../../UI/src/hooks/useNightOrder.ts) | Calls `buildNightOrder()` instead of importing `nightOrder.json` |
| [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) | Reads `choices` from `NightAction` directly; falls back to regex parsing via `NightChoiceHelper.ts` for characters without explicit choices |
| [`mockData.ts`](../../UI/src/stories/mockData.ts) | Imports from barrel instead of JSON |

### Phase 5: Cleanup (Partial)

- Removed `UI/src/data/characters.json`
- Removed `UI/src/data/nightOrder.json`
- Added `UI/src/data/characters/traveller/.gitkeep` placeholder for future traveller characters

## Deferred Items

The following items from M6 Phases 6 and 7 were intentionally deferred. They are tracked in [`docs/progress.md`](../../progress.md) under "M6 Deferred Cleanup".

| Item | Reason for Deferral | Target |
|------|---------------------|--------|
| Remove [`NightChoiceHelper.ts`](../../UI/src/components/NightPhase/NightChoiceHelper.ts) (regex fallback) | Still needed as fallback for characters without declarative `choices` — will be unnecessary after M8 populates all characters | After M8 |
| Remove `ParsedChoice` type from [`NightChoiceSelector.tsx`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) | Used by regex fallback path | After M8 |
| Remove local `NightChoiceType` from [`NightChoiceSelector.tsx`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) | Co-exists with canonical type in `types/index.ts`; removal requires updating the regex fallback path | After M8 |
| Decouple [`mockData.ts`](../../UI/src/stories/mockData.ts) from real character data | Currently imports from barrel; works fine but couples stories to real data | Low priority |
| Remove or fix [`characters.go`](../../API/internal/handlers/characters.go) endpoint | References deleted `characters.json` — endpoint is broken at runtime; API is "dumb" so removing it is the right approach | M8 or separate cleanup |
| Create `loric/` character subdirectory | No Loric characters implemented yet | M8 |

## Files Changed

| Category | Files |
|----------|-------|
| New types | [`UI/src/types/index.ts`](../../UI/src/types/index.ts) |
| New infrastructure | [`UI/src/data/characters/index.ts`](../../UI/src/data/characters/index.ts), [`UI/src/data/characters/_nightOrder.ts`](../../UI/src/data/characters/_nightOrder.ts) |
| New character files | 43 files in `UI/src/data/characters/{townsfolk,outsider,minion,demon,fabled}/` |
| Updated consumers | [`useCharacterLookup.ts`](../../UI/src/hooks/useCharacterLookup.ts), [`useNightOrder.ts`](../../UI/src/hooks/useNightOrder.ts), [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx), [`mockData.ts`](../../UI/src/stories/mockData.ts) |
| Removed | `UI/src/data/characters.json`, `UI/src/data/nightOrder.json` |

## Verification

- TypeScript: 0 errors (`npx tsc --noEmit`)
- ESLint: 0 errors, 0 warnings (`npx eslint .`)
- Tests: 52/52 passing (5 test files)
