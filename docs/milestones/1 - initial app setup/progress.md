# Milestone 0 + 1 — Progress

> Covers the initial build (Phases 0–9) and Milestone 1 (code quality, testing, dev tooling).
>
> Requirements: [`architecture-plan.md`](architecture-plan.md), [`StoryTellerCards-InitialPrompt.md`](StoryTellerCards-InitialPrompt.md)

---

## Phase 0: Project Scaffolding

Vite + React + TypeScript + MUI + ESLint + Prettier + Husky + Storybook

## Phase 1: Data Layer

- TypeScript types in [`types/index.ts`](../../UI/src/types/index.ts)
- 43 character definitions in [`characters.json`](../../UI/src/data/characters.json)
- 168 night order entries in [`nightOrder.json`](../../UI/src/data/nightOrder.json)
- Script importer: [`scriptImporter.ts`](../../UI/src/utils/scriptImporter.ts)
- Night order filter: [`nightOrderFilter.ts`](../../UI/src/utils/nightOrderFilter.ts)
- Sort rules: [`scriptSortRules.ts`](../../UI/src/utils/scriptSortRules.ts)
- localStorage hook: [`useLocalStorage.ts`](../../UI/src/hooks/useLocalStorage.ts)

## Phase 2: Session & Game Management

- [`SessionContext.tsx`](../../UI/src/context/SessionContext.tsx) and [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) — Context + useReducer
- [`HomePage.tsx`](../../UI/src/pages/HomePage.tsx) — session list, create/delete
- [`SessionSetupPage.tsx`](../../UI/src/pages/SessionSetupPage.tsx) — script import, player setup, game creation
- React Router routing in [`App.tsx`](../../UI/src/App.tsx)

## Phase 3: Game View Core

[`GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx) with 4 tabs:
1. **Town Square** — [`TownSquareTab.tsx`](../../UI/src/components/TownSquare/TownSquareTab.tsx)
2. **Player List** — [`PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx)
3. **Script Reference** — [`ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx)
4. **Night Order** — [`NightOrderTab.tsx`](../../UI/src/components/NightOrder/NightOrderTab.tsx)

Plus [`PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx) and [`ShowCharactersToggle.tsx`](../../UI/src/components/common/ShowCharactersToggle.tsx).

## Phase 4: Night Phase Flashcards

- Swipeable carousel: [`FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx)
- Individual flashcard: [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx)
- Sub-action checklists: [`SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx)
- Structural cards: [`StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx)
- Dead player styling, Complete Night flow
- Overlay: [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx)

## Phase 4b: Storybook Sprint #1

41 stories added.

## Phase 5: Night History

- [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx)
- [`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx) — read-only review with flashcard carousel

## Phase 6: Town Square Visual

- Ovoid/circle layout: [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx)
- Player tokens: [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx)
- Add traveller: [`AddTravellerDialog.tsx`](../../UI/src/components/TownSquare/AddTravellerDialog.tsx)
- Quick actions: [`PlayerQuickActions.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.tsx)

## Phase 6b: Storybook Sprint #2

25 stories added (total 66).

## Phase 7: Day Timer

- [`DayTimer.tsx`](../../UI/src/components/Timer/DayTimer.tsx) — countdown, Web Audio alarm, color-coded progress, auto-pause on phase change
- [`DayTimerFab.tsx`](../../UI/src/components/Timer/DayTimerFab.tsx) — FAB trigger + bottom sheet

## Phase 8: Go API

- Chi router, 13 endpoints, JSON file storage, 90-day cleanup, CORS, graceful shutdown
- Entry: [`main.go`](../../API/cmd/server/main.go)
- Handlers: [`handlers/`](../../API/internal/handlers/)
- Storage: [`filestore.go`](../../API/internal/storage/filestore.go)
- Sync hook: [`useApiSync.ts`](../../UI/src/hooks/useApiSync.ts)

## Phase 9: Polish

- [`ErrorBoundary.tsx`](../../UI/src/components/common/ErrorBoundary.tsx) (class component — the sole exception)
- [`LoadingState.tsx`](../../UI/src/components/common/LoadingState.tsx)
- PWA manifest: [`manifest.json`](../../UI/public/manifest.json)
- ARIA labels, keyboard nav, mobile CSS

---

## Milestone 1: Code Quality, Testing & Dev Tooling

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
