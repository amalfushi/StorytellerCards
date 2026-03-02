# Milestone 3 — Progress

> Night phase improvements, token system, script builder, UI polish.
>
> Requirements: [`milestone3.md`](milestone3.md) | Feedback: [`Feedback.md`](Feedback.md)

---

## Status: ✅ Complete (M3 items + Feedback Round 1 + Feedback Round 2)

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

---

## Feedback Round 1 ✅

All Round 1 feedback items completed. See [`Feedback.md`](Feedback.md) for original feedback.

Items addressed: Storybook night progress bar fix, NightHistory breadcrumb dot sizing & unification, PlayerList strikethrough & traveller story, PlayerToken sizing & font scaling & transparent alignment backgrounds, TownSquareLayout worst-case stories, live testing fixes (checkbox jump, arrow sizing, night action box positioning, night history filtering to in-play characters only).

---

## Feedback Round 2 ✅

All Round 2 feedback items (F3-11 through F3-19) completed. See [`Feedback.md`](Feedback.md) for original feedback.

| ID | Description | Details |
|----|-------------|---------|
| F3-11 | Traveller transparent split bg in full info view | [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) updated with transparent split background for Traveller cards in full info mode. |
| F3-12 | Traveller cards text cut off fix | Added `minHeight` to prevent text truncation on Traveller character cards. |
| F3-13 | Day view travellers show split red/blue colors | Traveller cards always display split red/blue colors regardless of Day/Night phase since Traveller identity is public knowledge. |
| F3-14 | Max 1 drunk + 1 poisoned token per player | [`TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) enforces toggle behavior — adding Drunk/Poisoned removes existing one first. |
| F3-15 | Up to 10 custom tokens with limit enforcement | Custom token limit enforced at 10 per player with UI feedback when limit reached. |
| F3-16 | Storybook stories for tokens | Added token stories to [`PlayerToken.stories.tsx`](../../UI/src/components/TownSquare/PlayerToken.stories.tsx), [`TownSquareLayout.stories.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.stories.tsx), [`PlayerRow.stories.tsx`](../../UI/src/components/PlayerList/PlayerRow.stories.tsx), and [`NightFlashcard.stories.tsx`](../../UI/src/components/NightPhase/NightFlashcard.stories.tsx). |
| F3-17 | Player list shows active tokens | [`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) displays active tokens via [`TokenChips`](../../UI/src/components/common/TokenChips.tsx) component. |
| F3-18 | Night flashcards show active tokens | [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) displays active tokens via [`TokenChips`](../../UI/src/components/common/TokenChips.tsx) near the ability description. |
| F3-19 | Night history shows tokens from that night | [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) displays `tokenSnapshot` from [`NightHistoryEntry`](../../UI/src/types/index.ts) to show tokens that were active during each historical night. |
