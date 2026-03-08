# Milestone 22 — BotC Official Data Import

> **Goal:** Import valuable data from the official `botc-release` repository into Storyteller Cards — jinxes, flavor text, edition tags, WebP icons, night order validation, and setup/global reminder metadata.

Based on findings from [M21 Research](../21%20-%20botc-release%20data%20import/milestone21.md).

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Source Data](#2-source-data)
3. [Task List](#3-task-list)
4. [Files Affected](#4-files-affected)
5. [Dependencies](#5-dependencies)
6. [Testing Requirements](#6-testing-requirements)
7. [Acceptance Criteria](#7-acceptance-criteria)

---

## 1. Problem Statement

The official BotC app repository (`D:\StorytellerCards\botc-release`) contains canonical data that our app lacks:

| Gap | Impact | Source File |
|-----|--------|-------------|
| **No jinx data** (M5 planned but no data) | Storytellers must memorize/look up 131 character interaction rules during play | `jinxes.json` |
| **No flavor text** on any of our 179 characters | Character views lack atmospheric depth | `roles.json` → `flavor` |
| **No edition tracking** (TB=Trouble Brewing, BMR=Bad Moon Rising, S&V=Sects & Violets, Experimental) | Can't filter/group characters by edition in script builder | `roles.json` → `edition` |
| **PNG icons at 148 KB avg** (26.6 MB total) | Slow mobile load times; WebP would be ~20 KB avg (86% reduction) | `resources/characters/` |
| **Night order not validated** against canonical source | Potential ordering discrepancies | `nightsheet.json` |
| **No `setup` boolean flag** for quick-filter | Can't quickly identify the 23 characters that modify game setup | `roles.json` → `setup` |
| **No global reminder tokens** | 6 characters have reminders that apply when they're not in play | `roles.json` → `remindersGlobal` |

### Out of Scope

- **WC25 tournament scripts** — existing script import functionality handles this. Default/bundled scripts may be a future milestone.
- **`special` app integration features** — specific to the official online app, not relevant to our Storyteller tool.
- **Goudy Stout font** — licensing unclear; not importing.

---

## 2. Source Data

All source data is at `D:\StorytellerCards\botc-release\resources\data\`:

| File | Size | Contents |
|------|------|----------|
| `roles.json` | ~140 KB | 179 characters with `flavor`, `edition`, `setup`, `remindersGlobal` |
| `jinxes.json` | ~22 KB | 131 jinx pairs across 27 characters |
| `nightsheet.json` | ~3 KB | Canonical first night (79 entries) + other night (99 entries) order |

Icon images at `D:\StorytellerCards\botc-release\resources\characters\`:
- 353 WebP files organized by edition (`tb/`, `bmr/`, `snv/`, `carousel/`, `fabled/`, `loric/`)
- Includes alignment variants (`_e` evil, `_g` good) — we only need the default (unaligned) icons

### Data Format Reference

See [M21 Section 4](../21%20-%20botc-release%20data%20import/milestone21.md#4-data-format-reference) for complete schemas.

**Key mappings:**
```
jinxes.json { id, reason }  →  our Jinx { characterId, description }
roles.json  edition          →  new CharacterDef.edition
roles.json  flavor           →  new CharacterDef.flavor
roles.json  setup            →  new CharacterDef.setup (boolean)
roles.json  remindersGlobal  →  new ReminderToken.isGlobal or separate array
```

---

## 3. Task List

### Phase 1: Import Jinx Data (Priority 1 — highest value)

This feeds directly into our planned M5 (Jinxes milestone).

- [ ] Write an import script (`scripts/importJinxes.ts` or Node script) that:
  1. Reads `botc-release/resources/data/jinxes.json`
  2. For each source character, adds `jinxes: Jinx[]` to the character's `.ts` file
  3. Maps `{ id, reason }` → `{ characterId, description }` (our existing `Jinx` interface)
  4. Mirrors jinxes bidirectionally — if Alchemist→Boffin exists, also add Boffin→Alchemist
- [ ] Run the import script and verify all 131 pairs (262 total with mirroring) are added to 27+ character files
- [ ] Validate imported jinxes via `characterData.test.ts` structural validation
- [ ] Add a jinx count summary to the import output for verification

### Phase 2: Import Flavor Text (Priority 2)

- [ ] Add `flavor?: string` to `CharacterDef` interface in `types/index.ts` (append at end)
- [ ] Write import logic to read `roles.json` and add `flavor` to each character's `.ts` file
- [ ] All 179 characters should have flavor text after import
- [ ] Update character detail UI (`CharacterCard.tsx` or character modal) to display flavor text in italics below the ability text

### Phase 3: Import Edition Data (Priority 3)

- [ ] Add `edition?: string` to `CharacterDef` interface in `types/index.ts` (append at end)
- [ ] Define edition constants with human-readable labels:
  - `tb` = Trouble Brewing (base set)
  - `bmr` = Bad Moon Rising
  - `snv` = Sects & Violets
  - `carousel` = Experimental / unreleased
  - `fabled` = Fabled
  - `loric` = Loric
- [ ] Write import logic to read `roles.json` and add `edition` to each character's `.ts` file
- [ ] Update ScriptBuilder to support filtering by edition (e.g., "Show only Trouble Brewing characters")
- [ ] Update character detail UI to show edition badge/tag

### Phase 4: Migrate Icons to WebP (Priority 4)

- [ ] Copy the 179 default (unaligned) WebP icons from `botc-release/resources/characters/` to our icon directory
- [ ] Update `CharacterIcon` type and `characterIcon.ts` to reference `.webp` files instead of `.png`
- [ ] Remove the old PNG icons (or keep as fallback during transition)
- [ ] Update `CharacterIconImage` component if path logic changes
- [ ] Verify all 179 icons render correctly in the app
- [ ] Measure bundle/load size improvement

### Phase 5: Night Order Validation (Priority 5)

- [ ] Write a validation script/test that:
  1. Reads `botc-release/resources/data/nightsheet.json`
  2. Compares array positions against our characters' `firstNight.order` and `otherNights.order` values
  3. Reports any discrepancies (character present in one but not the other, different ordering)
- [ ] Fix any ordering discrepancies found
- [ ] Handle post-dawn entries (Leviathan, Vizier) — verify our system accounts for these
- [ ] Add as a test in `characterData.test.ts` or a new `nightOrderValidation.test.ts`

### Phase 6: Import Setup Flag & Global Reminders (Priority 7)

- [ ] Add `setup?: boolean` to `CharacterDef` in `types/index.ts` (append at end)
- [ ] Import `setup: true` for the 23 characters that modify game setup
- [ ] Add `isGlobal?: boolean` to `ReminderToken` in `types/index.ts` OR add `remindersGlobal?: ReminderToken[]` to `CharacterDef`
- [ ] Import global reminders for the 6 characters that have them (Philosopher, Alchemist, Drunk, Marionette, Lil' Monsta)
- [ ] Update `characterData.test.ts` to validate new fields

### Phase 7: Tests & Documentation

- [ ] Ensure `characterData.test.ts` structural validation covers new fields (flavor, edition, setup, jinxes)
- [ ] Add tests for jinx bidirectional mirroring
- [ ] Add tests for night order validation
- [ ] Update AGENTS.md stats if test counts changed
- [ ] Create `progress.md` in this milestone folder
- [ ] Update root `docs/progress.md` with M22 status

---

## 4. Files Affected

### Import Scripts (New — can be one-time scripts, not shipped in app)

| File | Purpose |
|------|---------|
| `scripts/importJinxes.ts` (or `.js`) | Import jinxes from `jinxes.json` into character files |
| `scripts/importCharacterMeta.ts` | Import flavor, edition, setup, remindersGlobal from `roles.json` |
| `scripts/validateNightOrder.ts` | Compare our night order against `nightsheet.json` |
| `scripts/migrateIcons.ts` | Copy WebP icons and update references |

### Modified

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Add `flavor?`, `edition?`, `setup?` to `CharacterDef`; possibly `isGlobal?` to `ReminderToken` |
| `UI/src/data/characters/*.ts` (27+ files) | Add `jinxes` arrays |
| `UI/src/data/characters/*.ts` (179 files) | Add `flavor`, `edition`, `setup` fields |
| `UI/src/components/ScriptViewer/CharacterCard.tsx` | Display flavor text, edition badge |
| `UI/src/components/ScriptBuilder/ScriptBuilder.tsx` | Edition filter UI |
| `UI/src/utils/characterIcon.ts` | Update paths for WebP |
| `UI/src/components/common/CharacterIconImage.tsx` | Update if icon path logic changes |
| `UI/src/data/characters/characterData.test.ts` | Validate new fields |
| `UI/public/icons/` or equivalent | Replace PNG → WebP (179 files) |

---

## 5. Dependencies

- **M21 (Research)** — ✅ Complete. This milestone is the follow-up.
- **M5 (Jinxes)** — Phase 1 imports the data; M5 would build the jinx *UI/display/gameplay* on top of this data. Phase 1 here is the data foundation for M5.
- **No blockers** — can run in parallel with M18/M19 (different files entirely).

### Licensing

All data imports are permitted under the [BotC Community Created Content Policy](https://bloodontheclocktower.com/pages/community-created-content-policy). See [M21 Section 5](../21%20-%20botc-release%20data%20import/milestone21.md#5-licensing-notes).

---

## 6. Testing Requirements

### Structural Validation (characterData.test.ts)

- [ ] Validate all 179 characters have `flavor` string (non-empty)
- [ ] Validate all 179 characters have `edition` string (one of: `tb` (Trouble Brewing), `bmr` (Bad Moon Rising), `snv` (Sects & Violets), `carousel` (Experimental), `fabled`, `loric`)
- [ ] Validate 23 characters have `setup: true`
- [ ] Validate 27+ characters have non-empty `jinxes[]` arrays
- [ ] Validate total jinx pair count is 131 (or 262 if mirrored)
- [ ] Validate 6 characters have global reminder tokens

### Night Order Validation

- [ ] Test that our first night order matches `nightsheet.json` positions
- [ ] Test that our other night order matches `nightsheet.json` positions
- [ ] Document any intentional deviations

### Icon Migration

- [ ] Verify 179 WebP files exist and are loadable
- [ ] Verify `CharacterIconImage` renders all icons without errors

### ScriptBuilder

- [ ] Test edition filter shows only characters from selected edition
- [ ] Test edition filter works with existing character type filtering

---

## 7. Acceptance Criteria

- [ ] 131 jinx pairs imported with bidirectional mirroring (both characters reference each other)
- [ ] All 179 characters have `flavor` text displayed in character detail views
- [ ] All 179 characters have `edition` field; ScriptBuilder supports edition filtering
- [ ] Icons migrated to WebP with measurable size reduction (target: >80% reduction)
- [ ] Night order validated against canonical `nightsheet.json` — discrepancies documented or fixed
- [ ] `setup` boolean and `remindersGlobal` imported for applicable characters
- [ ] All existing tests pass + new validation tests
- [ ] TypeScript compilation, ESLint, and test suite all pass
- [ ] No WC25 scripts bundled (existing import handles those)
