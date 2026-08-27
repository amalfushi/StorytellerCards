# Milestone 29 — Bluff Improvements & Player Show Screen Framework

## Status: ✅ Complete

**Completed:** 2026-03-11

### Summary

Extended the demon bluff system with Lunatic support and built a general-purpose "Player Show Screen" framework for showing fullscreen information to players during the night phase.

### Key Changes

**Lunatic Bluff Support:**
- Added `Game.lunaticBluffs?: string[]` field and `SET_LUNATIC_BLUFFS` reducer action
- Extended `DemonBluffSelection` with `variant` prop ('demon' | 'lunatic') — lunatic variant shows all good characters (not restricted to not-in-play)
- Added conditional lunatic bluff selection step in pre-game setup flow (after demon bluffs, only when Lunatic is in-play)
- Lunatic's first-night flashcard displays assigned bluffs inline and opens them in the private player show screen

**PlayerActionsModal Bluff Wiring:**
- Wired bluff props (`demonBluffs`, `bluffCharacters`, `availableBluffCharacters`, `onChangeBluff`) from `TownSquareTab` and `PlayerListTab` to `PlayerActionsModal`
- Added `bluffLabel` prop for dynamic section title ("Demon Bluffs" vs "Lunatic Bluffs")
- Bluff section now appears for both Demon and Lunatic players in the actions modal

**Player Show Screen Framework:**
- `PlayerShowScreen` — fullscreen overlay component with two variants:
  - `bluffs`: "These characters are not in play." heading, smaller
    bluff-sharing guidance, and large character icons (112px)
  - `text`: Large centered text message
- `PlayerShowDrawer` — bottom drawer triggered from each NightFlashcard's "📱 Show Player" button:
  - "Show Bluffs" option (only for demons/lunatics with bluffs)
  - "Custom Message" — text field with save/clear, opens fullscreen when shown
- Added fullscreen expand buttons on the Demon and Lunatic bluff displays

**Custom Player Messages:**
- Added `Game.customPlayerMessages?: Record<string, string>` (keyed by characterId)
- `SET_CUSTOM_PLAYER_MESSAGE` and `CLEAR_CUSTOM_PLAYER_MESSAGE` reducer actions
- Messages persist across nights within the same game session via localStorage
- Storyteller can edit/clear messages from the PlayerShowDrawer

**Milestone 43 follow-up:**
- Drafted Demon and Lunatic bluffs are copied to the assigned player's
  per-player bluff record.
- Lunatic night flashcards prefer per-player bluffs and fall back to the
  game-level `lunaticBluffs` list for existing games.

### Files Changed

| File | Change |
|------|--------|
| `UI/src/types/index.ts` | Added `lunaticBluffs`, `customPlayerMessages` to Game |
| `UI/src/context/GameContext.tsx` | Added 4 new reducer actions + context methods |
| `UI/src/components/Setup/DemonBluffSelection.tsx` | Added `variant` prop |
| `UI/src/pages/GameViewPage.tsx` | Added lunatic bluff selection step |
| `UI/src/components/TownSquare/TownSquareTab.tsx` | Wired bluff props to PlayerActionsModal |
| `UI/src/components/PlayerList/PlayerListTab.tsx` | Wired bluff props to PlayerActionsModal |
| `UI/src/components/TownSquare/PlayerActionsModal.tsx` | Added `bluffLabel` prop |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Added lunatic bluffs, Show Player button/drawer |
| `UI/src/components/NightPhase/StructuralCard.tsx` | Added fullscreen button on bluff display |
| `UI/src/components/NightPhase/FlashcardCarousel.tsx` | Pass-through for new props |
| `UI/src/components/NightPhase/NightTabPanel.tsx` | Compute lunatic bluffs + custom messages |

### Files Created

| File | Purpose |
|------|---------|
| `UI/src/components/NightPhase/PlayerShowScreen.tsx` | Fullscreen overlay for player info |
| `UI/src/components/NightPhase/PlayerShowDrawer.tsx` | Bottom drawer with show options |
| `UI/src/components/NightPhase/PlayerShowScreen.test.tsx` | Tests (10 tests) |
| `UI/src/components/NightPhase/PlayerShowDrawer.test.tsx` | Tests (14 tests) |

### Test Results
- **3894 tests** across **72 test files** — all passing
- **39 new tests** added (10 PlayerShowScreen, 14 PlayerShowDrawer, 7 GameContext, 6 DemonBluffSelection, 2 StructuralCard)
- 0 TypeScript errors, 0 ESLint errors

---

## Task List

- [x] Add `lunaticBluffs` to Game type + GameContext
- [x] Add `customPlayerMessages` to Game type + GameContext
- [x] Extend DemonBluffSelection with variant prop
- [x] Add lunatic bluff selection step in pre-game setup
- [x] Wire bluff props into PlayerActionsModal from TownSquareTab & PlayerListTab
- [x] Create PlayerShowScreen component (bluffs + text variants)
- [x] Create PlayerShowDrawer component (bottom sheet with options)
- [x] Add lunatic bluff display on first-night flashcard
- [x] Add fullscreen buttons to Demon and Lunatic bluff displays
- [x] Add "Show Player" button on NightFlashcard
- [x] Write tests for all new components and features
- [x] Create milestone documentation
