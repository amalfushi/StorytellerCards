# Milestone 3 — Progress

> Night phase improvements, token system, script builder, UI polish.
>
> Requirements: [`milestone3.md`](milestone3.md)

---

## Completed Items

All 13 M3 items completed. Verification: **0 TypeScript errors, 0 ESLint errors/warnings, 48/48 tests passing across 5 test files, dev server running and functional.**

| ID | Description | Details |
|----|-------------|---------|
| M3-1 | Fix h6-inside-h2 DOM nesting warning | Already fixed from prior work — all `DialogTitle` `Typography` elements already had `component="span"`. No code changes needed. |
| M3-3 | Night flashcards filter to assigned characters + dead player styling | [`nightOrderFilter.ts`](../../UI/src/utils/nightOrderFilter.ts) updated with optional `players?: PlayerSeat[]` param; filters to characters assigned to actual players. [`useNightOrder.ts`](../../UI/src/hooks/useNightOrder.ts) passes players through. [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) applies desaturated backgrounds for dead players via targeted CSS. 5 new tests added to [`nightOrderFilter.test.ts`](../../UI/src/utils/nightOrderFilter.test.ts) — total 11. |
| M3-4 | Remove Dawn/Dusk from Phase type | `Dawn` and `Dusk` removed from `Phase` const in [`types/index.ts`](../../UI/src/types/index.ts) — now only `Day` and `Night`. Updated stories, decorators, JSDoc comments. |
| M3-5 | Move night flashcards button to header bar | Already moved from prior work. Bug fix: uncommented `setOverlayVisible(true)` in [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) useEffect, later refactored to `dismissed` flag pattern with `queueMicrotask`. |
| M3-6 | Player list column reorder + alignment mismatch | Column order already correct. Refined alignment mismatch logic to use `actualAlignment !== defaultAlignment`. Added EvilTownsfolk and GoodDemon stories in [`PlayerRow.stories.tsx`](../../UI/src/components/PlayerList/PlayerRow.stories.tsx) with mock data. |
| M3-7 | Pagination dots improvements | Enlarged dots with 8px gap. Condensed worm pattern for 10+ entries via `dotScale()` helper in [`NightProgressBar.tsx`](../../UI/src/components/NightPhase/NightProgressBar.tsx). Improved aria-labels, focus-visible styling. Added Clickable and CondensedWorm stories in [`NightProgressBar.stories.tsx`](../../UI/src/components/NightPhase/NightProgressBar.stories.tsx). |
| M3-8 | Character icon → detail modal on all screens | [`CharacterDetailModal.tsx`](../../UI/src/components/common/CharacterDetailModal.tsx) wired to 5 screens: Town Square via [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx), Player List via [`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx), Script Reference, Night Order via [`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx), Night Flashcards via [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx). All use `stopPropagation` to prevent parent click handlers. 9 stories in [`CharacterDetailModal.stories.tsx`](../../UI/src/components/common/CharacterDetailModal.stories.tsx). Detailed Rules section always renders heading with fallback text. |
| M3-9 | Kill/resurrect from Town Square | Already existed in [`PlayerQuickActions.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.tsx). Fixed `ghostVoteUsed` management in [`TownSquareTab.tsx`](../../UI/src/components/TownSquare/TownSquareTab.tsx) `handleToggleAlive` — explicitly sets `ghostVoteUsed: false` on both kill and resurrect. Added DeadPlayerGhostVoteUsed story in [`PlayerQuickActions.stories.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.stories.tsx). |
| M3-10 | Night choice dropdowns | [`NightChoiceHelper.ts`](../../UI/src/components/NightPhase/NightChoiceHelper.ts) rewritten to support compound choices via `parseHelpTextForChoices()` returning `ParsedChoice[]`. [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) updated for multiple selectors. Handles complex patterns like "chooses a player & a character". [`NightChoiceSelector.tsx`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) renders dropdowns. |
| M3-11 | Night history editing | Night history was already editable from prior work. Added `mergeNightHistoryEntry()` and `findNightHistoryIndex()` utilities in [`nightHistoryUtils.ts`](../../UI/src/utils/nightHistoryUtils.ts). 9 new tests added — total 15 in [`nightHistoryUtils.test.ts`](../../UI/src/utils/nightHistoryUtils.test.ts). Edit icon added to [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) entries. |
| M3-12 | Token system | [`TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) completely rewritten with: `TokenBadges` component for visual display using atan2 center-facing positioning around player tokens with alternating clockwise/counterclockwise fan-out; `TokenManager` dialog with Drunk/Poisoned toggles, character-specific reminder tokens, custom text tokens. Integrated into [`TownSquareTab.tsx`](../../UI/src/components/TownSquare/TownSquareTab.tsx) with characterDef lookup. |
| M3-13 | Script builder | [`ScriptBuilder.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.tsx) rewritten with: author field, two-tab Browse/Selection layout, composition count chips showing Townsfolk/Outsider/Minion/Demon counts, proper sorting via `sortScriptCharacters()`, state reset on dialog close via `queueMicrotask`, validation and proper ID generation. |

### Key Design Decisions Captured During M3

- **Multi-demon support** → deferred to Milestone 4
- **Jinxes** → deferred to Milestone 5
- **Character file restructuring** (individual .ts files, wiki scraping) → deferred to Milestone 6
- **Simple Day/Night toggle** — Dawn/Dusk removed as they don't add value to ST workflow
- **Drunk vs Poisoned must be distinguished** — different sources, different clearing logic
- **Exile is functionally same as execution** but both terms retained in the UI
