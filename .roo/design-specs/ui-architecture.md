# UI Architecture

## Routes

Defined in [`App.tsx`](../../UI/src/App.tsx):

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | [`HomePage`](../../UI/src/pages/HomePage.tsx) | Session list, create/delete sessions |
| `/session/:sessionId` | [`SessionSetupPage`](../../UI/src/pages/SessionSetupPage.tsx) | Script import, player setup, create games |
| `/session/:sessionId/game/:gameId` | [`GameViewPage`](../../UI/src/pages/GameViewPage.tsx) | Active game — the main view |

All routes are wrapped in [`ErrorBoundary`](../../UI/src/components/common/ErrorBoundary.tsx).

## Provider Hierarchy

```
BrowserRouter
└── SessionProvider (SessionContext)
    └── Routes
        └── GameProvider (GameContext)  ← wraps GameViewPage
            └── GameViewPage
```

- [`SessionContext.tsx`](../../UI/src/context/SessionContext.tsx) — manages all sessions, persists to localStorage + API sync
- [`GameContext.tsx`](../../UI/src/context/GameContext.tsx) — manages the active game state, reducer pattern

## GameViewPage Layout

[`GameViewPage.tsx`](../../UI/src/pages/GameViewPage.tsx) is the core of the app:

```
┌─────────────────────────────┐
│ AppBar (title, history btn) │
├─────────────────────────────┤
│ PhaseBar (Day/Night toggle) │
├─────────────────────────────┤
│ ShowCharactersToggle        │
├─────────────────────────────┤
│                             │
│   Tab Content (one of 4):   │
│   - Town Square             │
│   - Player List             │
│   - Script Reference        │
│   - Night Order             │
│                             │
├─────────────────────────────┤
│ BottomNavigation (4 tabs)   │
├─────────────────────────────┤
│ DayTimerFab (floating)      │
└─────────────────────────────┘
```

### PhaseBar
[`PhaseBar.tsx`](../../UI/src/components/PhaseBar/PhaseBar.tsx) — toggles between Day/Night (Dawn/Dusk being removed per M3-4).

### ShowCharactersToggle
[`ShowCharactersToggle.tsx`](../../UI/src/components/common/ShowCharactersToggle.tsx) — hides character info during Day phase so players can't see secrets on the Storyteller's device.

## The 4 Tabs

### 1. Town Square
- [`TownSquareTab.tsx`](../../UI/src/components/TownSquare/TownSquareTab.tsx) — container
- [`TownSquareLayout.tsx`](../../UI/src/components/TownSquare/TownSquareLayout.tsx) — ovoid/circle arrangement of player tokens
- [`PlayerToken.tsx`](../../UI/src/components/TownSquare/PlayerToken.tsx) — individual token showing name, character, alive/dead
- [`PlayerQuickActions.tsx`](../../UI/src/components/TownSquare/PlayerQuickActions.tsx) — popup modal on token tap
- [`AddTravellerDialog.tsx`](../../UI/src/components/TownSquare/AddTravellerDialog.tsx) — add mid-game travellers
- [`TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) — reminder token placement (M3-12, partially complete)

### 2. Player List
- [`PlayerListTab.tsx`](../../UI/src/components/PlayerList/PlayerListTab.tsx) — table of all players
- [`PlayerRow.tsx`](../../UI/src/components/PlayerList/PlayerRow.tsx) — individual row
- [`PlayerEditDialog.tsx`](../../UI/src/components/PlayerList/PlayerEditDialog.tsx) — edit player details
- Column order (planned M3-6): Seat, Player, Type, CharIcon, Character, abilityShort, Alive, Alignment, Ghost Vote

### 3. Script Reference
- [`ScriptReferenceTab.tsx`](../../UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) — scrollable list of script characters
- [`CharacterCard.tsx`](../../UI/src/components/ScriptViewer/CharacterCard.tsx) — character info card

### 4. Night Order
- [`NightOrderTab.tsx`](../../UI/src/components/NightOrder/NightOrderTab.tsx) — filtered night order for current script
- [`NightOrderEntry.tsx`](../../UI/src/components/NightOrder/NightOrderEntry.tsx) — single entry row

## Night Phase Overlay

Triggered from the Night Order tab (currently a FAB, moving to header bar per M3-5):
- [`NightPhaseOverlay.tsx`](../../UI/src/components/NightPhase/NightPhaseOverlay.tsx) — full-screen overlay
- [`FlashcardCarousel.tsx`](../../UI/src/components/NightPhase/FlashcardCarousel.tsx) — swipeable card stack
- [`NightFlashcard.tsx`](../../UI/src/components/NightPhase/NightFlashcard.tsx) — individual flashcard
- [`SubActionChecklist.tsx`](../../UI/src/components/NightPhase/SubActionChecklist.tsx) — checkable instruction steps
- [`StructuralCard.tsx`](../../UI/src/components/NightPhase/StructuralCard.tsx) — Dusk/Dawn/MinionInfo/DemonInfo cards
- [`NightProgressBar.tsx`](../../UI/src/components/NightPhase/NightProgressBar.tsx) — progress indicator
- [`NightChoiceSelector.tsx`](../../UI/src/components/NightPhase/NightChoiceSelector.tsx) — dropdown for player/character selection (M3-10, partially complete)

## Night History Drawer

- [`NightHistoryDrawer.tsx`](../../UI/src/components/NightHistory/NightHistoryDrawer.tsx) — side drawer listing past nights
- [`NightHistoryReview.tsx`](../../UI/src/components/NightHistory/NightHistoryReview.tsx) — read-only flashcard review (becoming editable per M3-11)

## Day Timer

- [`DayTimerFab.tsx`](../../UI/src/components/Timer/DayTimerFab.tsx) — floating action button that opens timer
- [`DayTimer.tsx`](../../UI/src/components/Timer/DayTimer.tsx) — countdown timer, Web Audio alarm, color-coded progress bar, auto-pause on phase change

## Character Assignment

- [`CharacterAssignmentDialog.tsx`](../../UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx) — dialog for assigning characters before first night (random + manual)
- [`characterAssignment.ts`](../../UI/src/utils/characterAssignment.ts) — assignment logic

## Character Detail Modal

- [`CharacterDetailModal.tsx`](../../UI/src/components/common/CharacterDetailModal.tsx) — popup showing full character rules (M3-8, partially complete). Should open when clicking any character icon.

## Script Builder

- [`ScriptBuilder.tsx`](../../UI/src/components/ScriptBuilder/ScriptBuilder.tsx) — create scripts in-app instead of importing JSON (M3-13, partially complete)

## Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useCharacterLookup` | [`useCharacterLookup.ts`](../../UI/src/hooks/useCharacterLookup.ts) | Character ID → CharacterDef lookup map |
| `useNightOrder` | [`useNightOrder.ts`](../../UI/src/hooks/useNightOrder.ts) | Filtered night order for active script |
| `useTimer` | [`useTimer.ts`](../../UI/src/hooks/useTimer.ts) | Countdown timer logic |
| `useLocalStorage` | [`useLocalStorage.ts`](../../UI/src/hooks/useLocalStorage.ts) | Persistent state in localStorage |
| `useApiSync` | [`useApiSync.ts`](../../UI/src/hooks/useApiSync.ts) | Sync localStorage state with Go API |

## Theme

MUI theme customization in [`UI/src/theme/index.ts`](../../UI/src/theme/index.ts).
