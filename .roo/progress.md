# Storyteller Cards — Progress Tracking

> Last updated: 2026-02-28

## Completed Phases

### Phase 0: Project Scaffolding
Vite + React + TypeScript + MUI + ESLint + Prettier + Husky + Storybook

### Phase 1: Data Layer
- TypeScript types in [`UI/src/types/index.ts`](../UI/src/types/index.ts)
- 43 character definitions in [`UI/src/data/characters.json`](../UI/src/data/characters.json)
- 168 night order entries in [`UI/src/data/nightOrder.json`](../UI/src/data/nightOrder.json)
- Script importer: [`UI/src/utils/scriptImporter.ts`](../UI/src/utils/scriptImporter.ts)
- Night order filter: [`UI/src/utils/nightOrderFilter.ts`](../UI/src/utils/nightOrderFilter.ts)
- Sort rules: [`UI/src/utils/scriptSortRules.ts`](../UI/src/utils/scriptSortRules.ts)
- localStorage hook: [`UI/src/hooks/useLocalStorage.ts`](../UI/src/hooks/useLocalStorage.ts)

### Phase 2: Session & Game Management
- [`SessionContext.tsx`](../UI/src/context/SessionContext.tsx) and [`GameContext.tsx`](../UI/src/context/GameContext.tsx) — Context + useReducer
- [`HomePage.tsx`](../UI/src/pages/HomePage.tsx) — session list, create/delete
- [`SessionSetupPage.tsx`](../UI/src/pages/SessionSetupPage.tsx) — script import, player setup, game creation
- React Router routing in [`App.tsx`](../UI/src/App.tsx)

### Phase 3: Game View Core
[`GameViewPage.tsx`](../UI/src/pages/GameViewPage.tsx) with 4 tabs:
1. **Town Square** — [`TownSquareTab.tsx`](../UI/src/components/TownSquare/TownSquareTab.tsx)
2. **Player List** — [`PlayerListTab.tsx`](../UI/src/components/PlayerList/PlayerListTab.tsx)
3. **Script Reference** — [`ScriptReferenceTab.tsx`](../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx)
4. **Night Order** — [`NightOrderTab.tsx`](../UI/src/components/NightOrder/NightOrderTab.tsx)

Plus [`PhaseBar.tsx`](../UI/src/components/PhaseBar/PhaseBar.tsx) and [`ShowCharactersToggle.tsx`](../UI/src/components/common/ShowCharactersToggle.tsx).

### Phase 4: Night Phase Flashcards
- Swipeable carousel: [`FlashcardCarousel.tsx`](../UI/src/components/NightPhase/FlashcardCarousel.tsx)
- Individual flashcard: [`NightFlashcard.tsx`](../UI/src/components/NightPhase/NightFlashcard.tsx)
- Sub-action checklists: [`SubActionChecklist.tsx`](../UI/src/components/NightPhase/SubActionChecklist.tsx)
- Structural cards: [`StructuralCard.tsx`](../UI/src/components/NightPhase/StructuralCard.tsx)
- Dead player styling, Complete Night flow
- Overlay: [`NightPhaseOverlay.tsx`](../UI/src/components/NightPhase/NightPhaseOverlay.tsx)

### Phase 4b: Storybook Sprint #1
41 stories added.

### Phase 5: Night History
- [`NightHistoryDrawer.tsx`](../UI/src/components/NightHistory/NightHistoryDrawer.tsx)
- [`NightHistoryReview.tsx`](../UI/src/components/NightHistory/NightHistoryReview.tsx) — read-only review with flashcard carousel

### Phase 6: Town Square Visual
- Ovoid/circle layout: [`TownSquareLayout.tsx`](../UI/src/components/TownSquare/TownSquareLayout.tsx)
- Player tokens: [`PlayerToken.tsx`](../UI/src/components/TownSquare/PlayerToken.tsx)
- Add traveller: [`AddTravellerDialog.tsx`](../UI/src/components/TownSquare/AddTravellerDialog.tsx)
- Quick actions: [`PlayerQuickActions.tsx`](../UI/src/components/TownSquare/PlayerQuickActions.tsx)

### Phase 6b: Storybook Sprint #2
25 stories added (total 66).

### Phase 7: Day Timer
- [`DayTimer.tsx`](../UI/src/components/Timer/DayTimer.tsx) — countdown, Web Audio alarm, color-coded progress, auto-pause on phase change
- [`DayTimerFab.tsx`](../UI/src/components/Timer/DayTimerFab.tsx) — FAB trigger + bottom sheet

### Phase 8: Go API
- Chi router, 13 endpoints, JSON file storage, 90-day cleanup, CORS, graceful shutdown
- Entry: [`API/cmd/server/main.go`](../API/cmd/server/main.go)
- Handlers: [`API/internal/handlers/`](../API/internal/handlers/)
- Storage: [`API/internal/storage/filestore.go`](../API/internal/storage/filestore.go)
- Sync hook: [`UI/src/hooks/useApiSync.ts`](../UI/src/hooks/useApiSync.ts)

### Phase 9: Polish
- [`ErrorBoundary.tsx`](../UI/src/components/common/ErrorBoundary.tsx) (class component — the sole exception)
- [`LoadingState.tsx`](../UI/src/components/common/LoadingState.tsx)
- PWA manifest: [`UI/public/manifest.json`](../UI/public/manifest.json)
- ARIA labels, keyboard nav, mobile CSS

---

## Completed Milestone 1 Fixes

- ESLint config fixed (moved `eslintConfigPrettier` out of extends)
- Smart git hooks (detect UI/API changes, run appropriate tools)
- UI unit testing with Vitest (34 tests across 5 files)
- Go API unit testing (storage + handler tests)
- Local dev runner (`concurrently` for UI + API)
- `VITE_API_URL` env variable (`.env.development` + `.env.production.example`)
- READMEs (root + UI + API)
- VS Code `tasks.json` + `launch.json` (12 tasks, 6 launch configs)
- Consolidated `.gitignore` (single file at root)
- All ESLint errors fixed (0 errors, 0 warnings)

## Completed Milestone 2 Fixes

- **M2-1**: Fixed nested button warning in `HomePage` (`IconButton` outside `CardActionArea`)
- **M2-2**: Character assignment before first night (random + manual, player count distribution table)
  - [`CharacterAssignmentDialog.tsx`](../UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx)
  - [`characterAssignment.ts`](../UI/src/utils/characterAssignment.ts)
  - [`playerCountRules.ts`](../UI/src/data/playerCountRules.ts)
- **M2-3**: Show `abilityShort` on `NightFlashcard`
- **M2-4**: Fixed `SubActionChecklist` indentation (If at same level, continuations indented)
- **M2-5**: Script importing working + 18 new characters added + unknown character fallbacks

---

## In Progress — Milestone 3

Source: [`milestone3.md`](../milestone3.md)

### ⚠️ IMPORTANT: Interrupted Mid-Subtask

The M3 work was interrupted during implementation. Some files were created but may have **TypeScript errors, incomplete implementations, or missing integrations**. Before doing anything else:

1. Run `cd UI && npx tsc --noEmit` — check for compilation errors
2. Run `cd UI && npx eslint .` — check for lint errors
3. Run `cd UI && npm test` — check test status
4. Manually test the app in browser

### Partially Done (files exist, need verification)

| ID | Description | File(s) | Status |
|----|-------------|---------|--------|
| M3-10 | Night choice dropdowns | [`NightChoiceSelector.tsx`](../UI/src/components/NightPhase/NightChoiceSelector.tsx), [`NightChoiceHelper.ts`](../UI/src/components/NightPhase/NightChoiceHelper.ts) | Files created, may be incomplete |
| M3-12 | Token system | [`TokenManager.tsx`](../UI/src/components/TownSquare/TokenManager.tsx) | File created, may be incomplete |
| M3-8 | Character detail modal | [`CharacterDetailModal.tsx`](../UI/src/components/common/CharacterDetailModal.tsx) | File created, may be incomplete |
| M3-13 | Script builder | [`ScriptBuilder.tsx`](../UI/src/components/ScriptBuilder/ScriptBuilder.tsx) | File created, may be incomplete |

### Not Started (or status unknown)

| ID | Description | Notes |
|----|-------------|-------|
| M3-6 | Player list column reorder + alignment mismatch border on type pill | New column order: Seat, Player, Type, CharIcon, Character, abilityShort, Alive, Alignment, Ghost Vote. Evil Townsfolk gets red border on blue pill, etc. |
| M3-3 | Night flashcards filter to in-game characters only + dead player desaturated bg | Currently shows all script characters; should only show assigned characters |
| M3-7 | Pagination dots larger and clickable (jump to card) | Applies to flashcard carousel AND night history review |
| M3-11 | Night history should be editable (not truly read-only) | Need to allow fixing misclicks in past night records |
| M3-5 | Move night flashcards button from lower-right FAB to header bar | Currently covers "add player" button |
| M3-9 | Kill player from Town Square modal | Add kill option to the modal that opens when clicking a player tile |
| M3-4 | Remove Dawn/Dusk from phase bar | Dawn and Dusk phases are unnecessary for running the game |
| M3-1 | Fix h6-inside-h2 DOM nesting warning in dialogs | MUI DialogTitle renders `<h2>`, inner Typography renders `<h6>` |
