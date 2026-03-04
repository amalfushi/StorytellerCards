# Milestone 8 — Wiki Scraping Progress

> Status: ✅ M8.1 + M8.2 Complete

## Summary

Populated all remaining BotC characters from wiki XML dumps, updated existing characters with `wikiLink` and `abilityDetailed`, completed deferred M6 cleanup.

## M8.1 — Character Data Population

### What Was Done

1. **Recovered `nightOrder.json`** from git commit `847b332~1` → saved to `docs/milestones/6 - character restructuring/nightOrder.json` for historical reference and as canonical source for night order positions and help text.

2. **Created generation scripts** in `docs/milestones/8 - wiki scraping/`:
   - `generateCharacters.mjs` — Parses 7 MediaWiki XML dump files, cross-references `nightOrder.json` for night actions, generates individual `.ts` character files conforming to the `CharacterDef` interface.
   - `updateExistingCharacters.mjs` — Adds `wikiLink` and `abilityDetailed` fields to the 43 pre-existing character files.

3. **Generated 136 new character files** across all type directories:
   | Type | Pre-existing | New | Total |
   |------|-------------|-----|-------|
   | Townsfolk | 21 | 48 | 69 |
   | Outsider | 8 | 15 | 23 |
   | Minion | 8 | 19 | 27 |
   | Demon | 5 | 14 | 19 |
   | Fabled | 1 | 13 | 14 |
   | Traveller | 0 | 18 | 18 |
   | Loric | 0 | 9 | 9 |
   | **Total** | **43** | **136** | **179** |

4. **Updated 43 existing character files** — added `wikiLink` (to BotC wiki) and `abilityDetailed` (extended rules/nuances from wiki "How to Run" sections).

5. **Regenerated barrel export** `UI/src/data/characters/index.ts` — all 179 characters organized by type category.

6. **Created `loric/` directory** with 9 new Loric character files.

### Data Extracted Per Character

Each generated character file includes:
- `id`, `name`, `type`, `defaultAlignment` — from wiki XML
- `abilityShort` — character ability quote from wiki Summary section
- `abilityDetailed` — extended How to Run rules text (bullet points)
- `wikiLink` — direct link to BotC wiki page
- `firstNight` / `otherNights` — from `nightOrder.json` (order, helpText, subActions, choices)
- `icon` — placeholder color based on character type
- `reminders` — reminder tokens extracted from wiki How to Run sections
- `jinxes` — jinx interactions extracted from wiki `{{Jinx|...}}` templates
- `setupModifications` — detected from ability text patterns like `[+1 Outsider]`

### Bug Fixes During Generation

- Fixed 3 files with unescaped apostrophes in `wikiLink` URLs (Lil' Monsta, Hell's Librarian, Devil's Advocate) — URL-encoded as `%27`
- Fixed `banshee.ts` — `abilityShort` had raw wiki HTML/markup leaked in; replaced with clean ability text
- Fixed `lilmonsta.ts` — truncated `abilityShort` completed with full ability text

## M6 Deferred Cleanup (Completed)

| Item | What Changed |
|------|-------------|
| Remove `NightChoiceHelper.ts` regex fallback | Deleted file. `NightFlashcard.tsx` now uses only declarative `choices` arrays (line 66). |
| Remove `ParsedChoice` / local `NightChoiceType` | Removed from `NightChoiceSelector.tsx`. `NightChoiceType` now imported from `@/types/index.ts`. |
| Remove `characters.go` API endpoint | Deleted `API/internal/handlers/characters.go`. Removed `charPath`, handler init, and `/api/characters` route from `main.go`. Removed unused `path/filepath` import. |
| Create `loric/` directory | Created with 9 Loric characters. |

## M8.2 — Character Icons ✅

### What Was Done

1. **Created icon download scripts** in `docs/milestones/8 - wiki scraping/`:
   - `testIconUrl.mjs` — Explored wiki API patterns to discover correct icon filename format
   - `downloadIcons.mjs` — Batch downloads character icon PNGs from BotC wiki via MediaWiki API. Resolves icon URLs in batches of 50, downloads with 200ms rate limiting. Supports `--dry-run` flag.
   - `updateIconPaths.mjs` — Updates all character `.ts` files to add `small`, `medium`, `large` icon paths pointing to downloaded PNGs.

2. **Wiki icon URL discovery**:
   - Wiki icons use character IDs directly: `File:Icon {characterId}.png` (e.g., `File:Icon fortuneteller.png`)
   - MediaWiki API batch endpoint resolves actual download URLs: `api.php?action=query&titles=...&prop=imageinfo&iiprop=url&format=json`
   - Batches of 50 titles per request (4 batches for 179 characters)

3. **Downloaded 179 character icon PNGs** to `UI/public/icons/characters/`:
   - Total size: ~26 MB
   - File naming: `{characterId}Icon.png` (e.g., `chefIcon.png`, `impIcon.png`)
   - 178 resolved via MediaWiki API batch endpoint; `bigwig` downloaded directly from known wiki URL

4. **Updated all 179 character `.ts` files** with icon paths:
   - Added `small`, `medium`, `large` fields all pointing to `/icons/characters/{id}Icon.png`
   - All files maintain existing `placeholder` color as fallback

## Verification

- TypeScript: 0 errors (`npx tsc --noEmit`)
- ESLint: 0 errors (`npx eslint .`)
- Vitest: 52/52 tests passing
- Go build: success (`go build ./...`)
- Go tests: all passing (`go test ./...`)
- esbuild: no scan errors
