# Milestone 8 — Wiki Scraping & Character Population

> **Goal:** Populate the remaining ~125 BotC characters from the official wiki, download character token icons, and complete the M6 deferred cleanup (remove regex fallback, consolidate types, fix broken API endpoint).

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Scope](#2-scope)
3. [Data Sources](#3-data-sources)
4. [Character File Template](#4-character-file-template)
5. [Icon Strategy](#5-icon-strategy)
6. [Scraping Approach](#6-scraping-approach)
7. [Phased Execution Plan](#7-phased-execution-plan)
8. [M6 Deferred Cleanup](#8-m6-deferred-cleanup)
9. [Characters Requiring Special Attention](#9-characters-requiring-special-attention)
10. [Verification Plan](#10-verification-plan)
11. [Open Questions](#11-open-questions)

---

## 1. Problem Statement

The app currently has 43 of ~168 BotC characters implemented as individual `.ts` files (M6). When a user imports a script containing characters outside this set, those characters appear with `<TODO>` placeholders via `getFallbackCharacter()`. This makes the app unusable for any script beyond Boozling and One In One Out.

Additionally, several M6 cleanup items were deferred until all characters have data:
- Regex-based night choice parsing (`NightChoiceHelper.ts`) remains as a fallback
- Duplicate type definitions (`ParsedChoice`, local `NightChoiceType`) exist in `NightChoiceSelector.tsx`
- The `characters.go` API endpoint is broken (references deleted `characters.json`)
- No `loric/` character subdirectory exists

---

## 2. Scope

### In Scope

| Item | Description |
|------|-------------|
| Character `.ts` files | Create ~125 new character files following M6 template |
| Wiki data extraction | `abilityShort`, `abilityDetailed`, `wikiLink`, night order, night actions, reminders |
| Token icons | Download official PNG icons, name as `{characterId}Icon.png` |
| Icon integration | Populate `CharacterIcon.small`/`medium`/`large` fields (or at minimum one size) |
| Barrel export update | Add all new characters to `index.ts` |
| Night choices | Add declarative `choices` arrays to all characters with night actions |
| M6 cleanup | Remove regex fallback, consolidate types, fix/remove `characters.go` |
| Loric subdirectory | Create `UI/src/data/characters/loric/` with Loric characters |

### Out of Scope

| Item | Reason |
|------|--------|
| Multi-demon game logic | M4 |
| Jinx rule enforcement | M5 — jinx *data* will be populated as stubs |
| Fabled/Loric game rule overrides (logic) | Future milestone — `gameRuleOverrides` *data* will be populated |
| SVG conversion of icons | Nice-to-have but complex; defer unless trivial |
| Strategy/how-to-play text | Link to wiki instead via `wikiLink` |
| Storybook mock data decoupling | Low priority; can be done separately |

---

## 3. Data Sources

### 3.1 Wiki Pages

- **Individual character pages**: `https://wiki.bloodontheclocktower.com/{CharacterName}`
  - Contains: ability text (short + detailed), character type, alignment, night order info
  - Example: `https://wiki.bloodontheclocktower.com/Washerwoman`

- **Icon media pages**: `https://wiki.bloodontheclocktower.com/File:Icon_{charactername}.png`
  - Contains: link to the actual PNG file (transparent background)
  - Example: `https://wiki.bloodontheclocktower.com/File:Icon_washerwoman.png`

- **Character type listing pages**: Export entire categories (all Townsfolk, all Outsiders, etc.)
  - Can be exported as XML dumps from the wiki
  - Useful for batch processing

### 3.2 XML Dump Export

The wiki supports XML dump exports by character type. This is the most efficient way to get bulk character data:
- One export per character type (Townsfolk, Outsiders, Minions, Demons, Travellers, Fabled, Loric)
- Does NOT include media files directly, but includes media metadata
- Stored directly in `docs/milestones/8 - wiki scraping/` as source material (e.g., `Townsfolk.xml`, `Outsiders.xml`)
- **Note:** XML dumps will be removed from the repo after M8 is complete — they are working artifacts only

### 3.3 Existing Data

- 43 characters already have complete `.ts` files from M6
- Night order positions are embedded in those files and serve as reference for the pattern
- The deleted `nightOrder.json` had order values for all 168 entries — if available in git history, this is a valuable reference for night order positions

---

## 4. Character File Template

Each new character file must follow the M6 pattern established in existing files like `fortuneteller.ts`:

```typescript
// UI/src/data/characters/{type}/{characterid}.ts

import type { CharacterDef } from '@/types/index.ts';

export const characterid: CharacterDef = {
  id: 'characterid',                    // lowercase, no spaces
  name: 'Character Name',              // display name with proper spacing
  type: 'Townsfolk',                   // CharacterType value
  defaultAlignment: 'Good',            // Alignment value
  abilityShort: 'One-line ability description from wiki.',
  abilityDetailed: 'Longer rules text from wiki, if available.',
  wikiLink: 'https://wiki.bloodontheclocktower.com/Character_Name',
  firstNight: {                        // null if no first night action
    order: 42,                         // position in night order
    helpText: 'Full storyteller instructions.',
    subActions: [
      {
        id: 'characterid-fn-1',
        description: 'First instruction step.',
        isConditional: false,
      },
    ],
    choices: [                         // omit if no choices
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
    ],
  },
  otherNights: null,                   // null if no other nights action
  icon: {
    placeholder: '#1976d2',            // type-appropriate color
    // small: '/icons/characters/characteridIcon.png',  // populated after icon download
  },
  reminders: [
    { id: 'characterid-reminder', text: 'Reminder text' },
  ],
  // M6 extensions (include where applicable):
  // setupModification: { description: '...' },
  // storytellerSetup: [{ description: '...', id: '...' }],
  // gameRuleOverrides: [{ description: '...', id: '...' }],
  // jinxes: [{ characterId: 'other', description: '...' }],
};
```

### Naming Conventions

| Field | Convention | Example |
|-------|-----------|---------|
| File name | `{id}.ts` | `washerwoman.ts` |
| Export name | `{id}` (named export) | `export const washerwoman` |
| Character ID | lowercase, no spaces, no hyphens | `'washerwoman'` |
| Sub-action IDs | `{id}-{fn\|on}-{n}` | `'washerwoman-fn-1'` |
| Reminder IDs | `{id}-{reminderName}` | `'washerwoman-townsfolk'` |
| Icon file name | `{id}Icon.png` | `washerwomanIcon.png` |

### Placeholder Colors by Type

| Type | Placeholder Color |
|------|------------------|
| Townsfolk | `#1976d2` |
| Outsider | `#42a5f5` |
| Minion | `#d32f2f` |
| Demon | `#b71c1c` |
| Traveller | `#9c27b0` |
| Fabled | `#ff9800` |
| Loric | `#558b2f` |

---

## 5. Icon Strategy

### 5.1 Sourcing

- Official wiki has PNG icons with transparent backgrounds for every character
- URL pattern: the media page at `https://wiki.bloodontheclocktower.com/File:Icon_{charactername}.png` links to the actual file
- Icons are detailed token art — suitable for display at multiple sizes

### 5.2 Storage

```
UI/public/icons/characters/
├── washerwomanIcon.png
├── librarianIcon.png
├── ...
```

- Store in `UI/public/icons/characters/` so they're served as static assets
- File naming: `{characterId}Icon.png` (matches the character's `id` field)

### 5.3 Integration

Update each character's `icon` field:

```typescript
icon: {
  small: '/icons/characters/washerwomanIcon.png',
  medium: '/icons/characters/washerwomanIcon.png',  // same file initially
  large: '/icons/characters/washerwomanIcon.png',
  placeholder: '#1976d2',
},
```

Initially all three sizes can point to the same PNG. If size-optimized variants are needed later, those can be generated via a build script.

### 5.4 SVG Consideration

SVG versions would be ideal for scalability but the wiki only provides PNGs. Converting complex token art to SVG is non-trivial. **Decision: Use PNGs for now.** If SVG conversion becomes feasible, it can be done as a separate effort.

---

## 6. Scraping Approach

### 6.1 Approach: XML Dumps (Primary) + HTTP Scraping (Icons Only)

1. **XML dumps are the primary source for character data** — user exports them from the wiki (one per character type) and provides them in `docs/milestones/8 - wiki scraping/`
2. **Write a TypeScript (Node.js) processing script** that:
   - Parses XML to extract character data per page
   - Extracts: name, ability text, character type
   - Generates `.ts` character files from a template
   - Generates the updated barrel `index.ts`
3. **Manually review** generated files for accuracy
4. **HTTP scraping is used only for downloading icon PNGs** from wiki media URLs (media files are not included in XML dumps)

> **Why TypeScript?** Python is not installed on this machine. TypeScript stays in-ecosystem with the rest of the project.

### 6.2 HTTP Scraping (Icon Downloads)

- Used specifically for downloading character icon PNG files from the wiki
- URL pattern: `https://wiki.bloodontheclocktower.com/File:Icon_{charactername}.png` → follow to actual media file
- Scripted via Node.js HTTP requests (e.g., `fetch` or `node-fetch`)
- NOT used for character data extraction (XML dumps are more reliable for that)

### 6.3 Night Order Data

The night order positions (`firstNight.order`, `otherNights.order`) are critical. The wiki does **NOT** contain night order data — this information is not present on character pages.

Canonical sources for night order:
- **`nightOrder.json` from git history**: the deleted file had all 168 entries with order values — this is the primary reference
- **Existing 43 character files**: night order positions already embedded in M6 character data
- **Master reference**: `docs/milestones/1 - initial app setup/NightOrder.md` (master data — DO NOT MODIFY)

Night order data is aggregated separately from the official script builder, not from the wiki.

### 6.4 Night Action Help Text & Sub-Actions

For each character with a night action:
- `helpText`: full storyteller instruction text (from wiki or night order reference)
- `subActions`: break `helpText` into individual checkable steps
  - Each step gets an `id` following the `{characterId}-{fn|on}-{n}` pattern
  - Steps starting with "If" get `isConditional: true`

### 6.5 Declarative Choices

For each character with interactive night choices:
- Analyze the `helpText` to determine what choices the storyteller makes
- Create `choices` array entries using `NightChoiceType` values
- Common patterns:
  - "chooses a player" → `{ type: 'player', maxSelections: 1, label: 'Choose a player' }`
  - "chooses 2 players" → `{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }`
  - "nod or shake" → `{ type: 'yesno', maxSelections: 1, label: 'Nod / Shake' }`
  - "good or evil" → `{ type: 'alignment', maxSelections: 1, label: 'Good or Evil' }`
  - "chooses a player & a character" → two entries (player + character)

---

## 7. Phased Execution Plan

### Phase 1: Data Preparation

- Obtain XML dumps from the wiki (user exports, one per character type)
- Place dumps directly in `docs/milestones/8 - wiki scraping/` (e.g., `Townsfolk.xml`, `Outsiders.xml`, etc.)
  - `Townsfolk.xml` and `Outsiders.xml` are already present; user will add remaining types (Minions, Demons, Travellers, Fabled, Loric)
  - XML dumps can be removed from the repo after M8 is complete
- Recover `nightOrder.json` from git history as a reference file (place in `docs/milestones/8 - wiki scraping/`)
- Build a master character list: reconcile wiki characters vs. existing 43 vs. night order entries
- Identify characters needing special attention (Fabled, Loric, Travellers, multi-phase characters)

### Phase 2: Scraping Script

- Write a TypeScript (Node.js) script in `docs/milestones/8 - wiki scraping/` to:
  - Parse XML dumps
  - Extract character data fields
  - Generate `.ts` character files from template
  - Track which characters were generated vs. skipped
- Script lives in the milestone folder (not `UI/scripts/`) since it's milestone-specific and kept for curiosity, not needed by the repo operationally
- Run the script and verify output against a few known characters
- Separate script (or script mode) for downloading icon PNGs from the wiki via HTTP

### Phase 3: Generate Character Files

- Run the generation script for all character types:
  - Townsfolk (~30+ new)
  - Outsiders (~10+ new)
  - Minions (~10+ new)
  - Demons (~10+ new)
  - Travellers (new type — all characters)
  - Fabled (new characters beyond Spirit of Ivory)
  - Loric (new type — all characters)
- Create `UI/src/data/characters/loric/` directory
- Manual review pass: verify generated data accuracy, fix edge cases
- Add declarative `choices` arrays to all characters with night actions
- Populate `wikiLink` on all characters (including existing 43)
- Populate `abilityDetailed` where wiki provides extended rules text

### Phase 4: Update Barrel & Registry

- Update `UI/src/data/characters/index.ts` with all new imports
- Verify `allCharacters` array includes all characters
- Verify `characterMap` correctly indexes all IDs
- Run TypeScript compilation check: `npx tsc --noEmit`

### Phase 5: Download & Integrate Icons

- Download all character icon PNGs from wiki
- Store in `UI/public/icons/characters/` with `{characterId}Icon.png` naming
- Update each character file's `icon` field with the file path
- Verify icons render in the app (Town Square tokens, Player List, etc.)

### Phase 6: M6 Deferred Cleanup

Now that all characters have declarative `choices`:

1. **Remove regex fallback** in `NightFlashcard.tsx` — delete the `parseHelpTextForChoices()` fallback path
2. **Delete `NightChoiceHelper.ts`** — no longer needed
3. **Remove `ParsedChoice` type** from `NightChoiceSelector.tsx`
4. **Remove local `NightChoiceType`** from `NightChoiceSelector.tsx` — import from `types/index.ts` instead
5. **Remove or fix `characters.go`** API endpoint — recommended: remove the endpoint entirely since the API is "dumb"
6. **Update `mockData.ts`** — optionally decouple from real character data (low priority)

### Phase 7: Verification & Documentation

- Run full test suite: `cd UI && npm test`
- Run ESLint: `cd UI && npx eslint .`
- Run TypeScript check: `cd UI && npx tsc --noEmit`
- Run Storybook: verify stories render with new character data
- Manual test: import a script with new characters, verify they display correctly
- Update `docs/progress.md` with M8 completion status
- Create `docs/milestones/8 - wiki scraping/progress.md` recording what was done
- Update `AGENTS.md` character count (43 → total)
- Update `docs/game-model.md` and `docs/ui-architecture.md` if character count references changed

---

## 8. M6 Deferred Cleanup

These items were deferred from M6 and are included in M8 Phase 6. See [`docs/milestones/6 - character restructuring/progress.md`](../6%20-%20character%20restructuring/progress.md) for context.

| Item | File(s) | Action |
|------|---------|--------|
| Regex fallback removal | `NightFlashcard.tsx`, `NightChoiceHelper.ts` | Remove fallback path, delete helper file |
| `ParsedChoice` type | `NightChoiceSelector.tsx` | Remove local type definition |
| Local `NightChoiceType` | `NightChoiceSelector.tsx` | Remove; import from `types/index.ts` |
| Broken API endpoint | `API/internal/handlers/characters.go` | Remove endpoint and route registration |
| Missing `loric/` directory | `UI/src/data/characters/` | Create during Phase 3 |

---

## 9. Characters Requiring Special Attention

### 9.1 Travellers

- Not currently represented in the app's character architecture (only a `.gitkeep` in `traveller/`)
- Travellers have unique rules: join/leave anytime, exile instead of execution, alignment assigned by ST
- Some Travellers have night actions, others don't
- Need to verify the app handles Traveller characters correctly in all views

### 9.2 Fabled

- Only Spirit of Ivory currently exists
- Fabled are **not assigned to players** — they're meta-game adjusters added by the ST
- Fabled characters use `gameRuleOverrides` to describe their effects
- The app's UI for Fabled may need work beyond just adding character files (out of scope for M8 data, but flag for follow-up)

### 9.3 Loric

- New character type not previously implemented
- Loric characters have a mossy green color (`#558b2f`)
- Like Fabled, they can alter game rules — use `gameRuleOverrides`
- Need to create the `loric/` subdirectory and verify `CharacterType.Loric` works end-to-end

### 9.4 Characters with Complex Night Actions

Some characters have unusual night action patterns:
- **Multi-step conditional actions** (e.g., Lunatic: multiple conditional branches)
- **Phase-dependent actions** (e.g., characters whose actions change based on game state)
- **Characters that modify other characters' night actions** (e.g., Philosopher becoming another character)

These should be flagged during generation and manually reviewed.

### 9.5 Characters with Setup Modifications

Characters beyond Baron that modify the player-count distribution need `setupModification` populated:
- **Godfather**: -1 Outsider (or +1 if no Outsiders)
- **Vigormortis**: -1 Outsider
- etc.

---

## 10. Verification Plan

### 10.1 Automated Checks

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript compilation | `cd UI && npx tsc --noEmit` | 0 errors |
| ESLint | `cd UI && npx eslint .` | 0 errors, 0 warnings |
| Vitest | `cd UI && npm test` | All tests pass |
| Character count | Script assertion | Total matches wiki character count |
| Barrel completeness | Script assertion | Every `.ts` file in subdirectories is imported in `index.ts` |

### 10.2 Manual Checks

- Import Trouble Brewing script → all 25 characters display correctly
- Import a Sects & Violets script → all characters display correctly
- Import a Bad Moon Rising script → all characters display correctly
- Night phase flashcards show correct helpText and choices for new characters
- Character icons display in all views (Town Square, Player List, Script Reference, Night Order, Night Flashcards)
- Character Detail Modal shows `abilityDetailed` and `wikiLink` for new characters

---

## 11. Resolved Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | XML dump vs. HTTP scraping? | **Both** — XML dumps for character data, HTTP for icon PNG downloads | XML dumps are easy to obtain; HTTP needed for media files not in dumps |
| 2 | Script language? | **TypeScript (Node.js)** | Python is not installed on this machine; TypeScript stays in-ecosystem |
| 3 | Icon download? | **Automated** (scripted HTTP download) | ~168 characters makes manual download impractical |
| 4 | Update existing 43 characters? | **Yes** — add `wikiLink`, `abilityDetailed`, icons to all characters | All characters should have consistent data quality |
| 5 | Characters not in wiki dumps? | **Note and skip** — move on, address individually later | All characters should be on the wiki; any missing from dumps are edge cases |
| 6 | Keep generation script? | **Yes** — in `docs/milestones/8 - wiki scraping/` | Kept for curiosity; not needed by the repo operationally |
| 7 | Night order source? | **Existing data only** — `nightOrder.json` from git history + existing character files | Wiki does NOT contain night order info; our data is aggregated separately from the official script builder |
