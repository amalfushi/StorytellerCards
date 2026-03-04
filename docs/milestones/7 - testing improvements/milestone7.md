# Milestone 7 — Testing Improvements

## Overview

Milestone 7 transforms Storyteller Cards from a project with ad-hoc test coverage into one with a **test-driven development culture**. The project currently has 52 unit tests across 5 files — all pure utility/hook tests with zero component tests — and ~75+ Storybook stories that are visual-only with no `play()` interaction tests.

### Goals

1. **TDD Culture** — Establish testing as a first-class part of every development cycle, not an afterthought
2. **Comprehensive Test Coverage** — Backfill tests for all existing logic, contexts, and components
3. **Storybook Advancement** — Unlock a11y testing, responsive viewports, interaction tests, and richer controls
4. **Agent Autonomy Through Testing** — Give AI agents confidence to make changes by providing a safety net of tests that catch regressions immediately

---

## Current Issues

### Storybook-Vitest Addon Timeout Error

The `@storybook/addon-vitest` (v10.2.8) fails to start with a 30-second timeout error. This prevents running Storybook-based tests via `vitest --project=storybook`.

```
Storybook Tests error details

Error

Failed to start test runner process

Aborting test runner process because it took longer than 30 seconds to start.

Error: Aborting test runner process because it took longer than 30 seconds to start.
    at file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:405:7
    at new Promise (<anonymous>)
    at bootTestRunner (file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:400:17)
    at runTestRunner (file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:431:108)
    at file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:473:10
    at file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6848:21
    at Array.forEach (<anonymous>)
    at _UniversalStore.emitToListeners (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6847:69)
    at _UniversalStore.handleChannelEvents (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6910:10)
    at file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:78:10
    at Array.forEach (<anonymous>)
    at Channel.handleEvent (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:77:48)
    at ServerChannelTransport.handler (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:26:36)
    at WebSocket.<anonymous> (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6948:23)
    at WebSocket.emit (node:events:508:28)
    at Receiver.receiverOnMessage (D:\StorytellerCards\UI\node_modules\ws\lib\websocket.js:1225:20)
    at Receiver.emit (node:events:508:28)
    at Receiver.dataMessage (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:596:14)
    at Receiver.getData (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:496:10)
    at Receiver.startLoop (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:167:16)
    at Receiver._write (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:94:10)
    at writeOrBuffer (node:internal/streams/writable:570:12)
    at _write (node:internal/streams/writable:499:10)
    at Writable.write (node:internal/streams/writable:508:10)
    at Socket.socketOnData (D:\StorytellerCards\UI\node_modules\ws\lib\websocket.js:1360:35)
    at Socket.emit (node:events:508:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23)


Troubleshoot: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/?renderer=react&ref=ui#what-happens-if-vitest-itself-has-an-error
```

### Additional Infrastructure Issues

- **`@testing-library/jest-dom` installed but not wired** — The package is in `devDependencies` but there is no vitest setup file that imports it, so custom matchers like `toBeInTheDocument()` are unavailable
- **`@storybook/addon-a11y` installed but disabled** — Configured as `a11y: { test: 'todo' }` in [`.storybook/preview.tsx`](UI/.storybook/preview.tsx:14), meaning a11y violations are not flagged
- **Code coverage configured but not enforced** — [`vitest.config.ts`](UI/vitest.config.ts) has `coverage.provider: 'v8'` but no threshold settings
- **No responsive/viewport testing** in Storybook
- **Zero tests for critical logic**: `GameContext`, `SessionContext`, `buildNightOrder()`, `characterAssignment.ts`, `NightChoiceHelper.ts`, `playerCountRules.ts`
- **Zero component tests** — all 52 existing tests are pure utility/hook tests

---

## Phase 1 — Fix Broken Infrastructure 🔨 Execute Now

### P1-1: Wire `@testing-library/jest-dom` into Vitest Setup

**Problem**: `@testing-library/jest-dom` is installed (`^6.9.1`) but never imported in test setup. Component tests cannot use matchers like `toBeInTheDocument()`, `toHaveTextContent()`, etc.

**Tasks**:
1. Create [`UI/src/test/setup.ts`](UI/src/test/setup.ts) with:
   ```typescript
   import '@testing-library/jest-dom/vitest';
   ```
2. Update [`UI/vitest.config.ts`](UI/vitest.config.ts) — add `setupFiles` to the test config:
   ```typescript
   test: {
     globals: true,
     environment: 'jsdom',
     pool: 'vmForks',
     include: ['src/**/*.test.{ts,tsx}'],
     setupFiles: ['./src/test/setup.ts'],
     coverage: {
       provider: 'v8',
       reporter: ['text', 'lcov'],
     },
   },
   ```
3. Verify with a quick test that `expect(element).toBeInTheDocument()` works

---

### P1-2: Enable Storybook A11y Testing

**Problem**: [`UI/.storybook/preview.tsx`](UI/.storybook/preview.tsx:14) has `a11y: { test: 'todo' }`, which disables a11y violation reporting.

**Tasks**:
1. Change `a11y.test` from `'todo'` to `'error-only'` in [`.storybook/preview.tsx`](UI/.storybook/preview.tsx:14):
   ```typescript
   a11y: {
     test: 'error-only',
   },
   ```
   This will flag serious a11y violations as errors while not failing on warnings/informational items.
2. Run Storybook and verify a11y panel shows results for existing stories
3. Fix any critical a11y violations surfaced in existing stories

---

### P1-3: Investigate & Fix Storybook-Vitest Addon Timeout

**Problem**: `@storybook/addon-vitest` (v10.2.8) throws a 30-second timeout error when Storybook boots (see [Current Issues](#storybook-vitest-addon-timeout-error) above).

**Tasks** (timeboxed to 30 minutes):
1. Check for known issues with `@storybook/addon-vitest@10.2.8` + `vitest@4.0.18` compatibility
2. Verify [`UI/.storybook/vitest.setup.ts`](UI/.storybook/vitest.setup.ts) is correctly configured
3. Try common fixes:
   - Ensure `vitest` workspace/project config for storybook is correct
   - Check if `@vitest/browser-playwright` (currently installed) conflicts with jsdom environment
   - Try increasing the timeout or adjusting addon config
4. **If not resolved within 30 minutes**: Document findings and defer to a future task. The addon is not blocking unit tests or story development — only the in-Storybook test runner integration.

**Current config files involved**:
- [`UI/.storybook/main.ts`](UI/.storybook/main.ts) — addon registration
- [`UI/.storybook/vitest.setup.ts`](UI/.storybook/vitest.setup.ts) — project annotations setup
- [`UI/vitest.config.ts`](UI/vitest.config.ts) — vitest configuration
- [`UI/package.json`](UI/package.json) — dependency versions

---

## Phase 2 — Storybook Enhancements 🔨 Execute Now

### P2-1: Configure Viewport Presets for Responsive Testing

**Problem**: No viewport configuration exists. The app is mobile-first but stories only render at default desktop width.

**Tasks**:
1. Add viewport parameters to [`.storybook/preview.tsx`](UI/.storybook/preview.tsx):
   ```typescript
   viewport: {
     options: {
       mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
       tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
       desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
     },
   },
   ```
2. Set default viewport to `mobile` since the app is mobile-first

---

### P2-2: Add Responsive Story Variants

**Problem**: Mobile-critical components have no stories showing how they render at different breakpoints.

**Target components** (these are the most layout-sensitive):
- [`TownSquareLayout.tsx`](UI/src/components/TownSquare/TownSquareLayout.tsx) — token ring layout changes drastically by screen size
- [`PlayerListTab.tsx`](UI/src/components/PlayerList/PlayerListTab.tsx) — list density differs on mobile vs tablet
- [`NightFlashcard.tsx`](UI/src/components/NightPhase/NightFlashcard.tsx) — card sizing and swipe behavior
- [`PhaseBar.tsx`](UI/src/components/PhaseBar/PhaseBar.tsx) — top bar layout

**Tasks**:
1. For each target component, add story variants with viewport parameters:
   ```typescript
   export const Mobile: Story = {
     parameters: { viewport: { defaultViewport: 'mobile' } },
   };
   export const Tablet: Story = {
     parameters: { viewport: { defaultViewport: 'tablet' } },
   };
   ```
2. Ensure stories have meaningful props/data to show realistic content at each breakpoint

---

### P2-3: Add `play()` Interaction Tests to Existing Stories

**Problem**: All ~75+ stories are visual-only. Interactive components have no automated interaction testing.

**Target components** (components with user interactions that should be tested):

| Component | Story File | Interactions to Test |
|-----------|-----------|---------------------|
| `ShowCharactersToggle` | [`ShowCharactersToggle.stories.tsx`](UI/src/components/common/ShowCharactersToggle.stories.tsx) | Toggle on/off, verify state change |
| `SubActionChecklist` | [`SubActionChecklist.stories.tsx`](UI/src/components/NightPhase/SubActionChecklist.stories.tsx) | Check/uncheck items, verify completion state |
| `PhaseBar` | [`PhaseBar.stories.tsx`](UI/src/components/PhaseBar/PhaseBar.stories.tsx) | Click phase buttons, verify active state |
| `PlayerQuickActions` | [`PlayerQuickActions.stories.tsx`](UI/src/components/TownSquare/PlayerQuickActions.stories.tsx) | Click action buttons, verify callbacks |
| `AddTravellerDialog` | [`AddTravellerDialog.stories.tsx`](UI/src/components/TownSquare/AddTravellerDialog.stories.tsx) | Open dialog, select traveller, confirm |
| `DayTimer` | [`DayTimer.stories.tsx`](UI/src/components/Timer/DayTimer.stories.tsx) | Start/stop/reset timer, verify display |

**Tasks**:
1. Import `@storybook/test` utilities (`expect`, `userEvent`, `within`, `fn`) in each story file
2. Add `play()` functions that simulate user interactions and assert expected outcomes
3. Example pattern:
   ```typescript
   export const ToggleInteraction: Story = {
     play: async ({ canvasElement }) => {
       const canvas = within(canvasElement);
       const toggle = canvas.getByRole('checkbox');
       await userEvent.click(toggle);
       await expect(toggle).toBeChecked();
     },
   };
   ```

---

### P2-4: Enhance Controls & ArgTypes

**Problem**: Stories use basic controls. Components with numeric props, enum-like props, or complex configuration lack interactive exploration tools.

**Tasks**:
1. Add **sliders** for numeric props where ranges make sense:
   - `TownSquareLayout` — seat count (5–20)
   - `DayTimer` — timer duration (30–300 seconds)
   - `NightProgressBar` — current/total steps
2. Add **select dropdowns** for enum-like props:
   - Character type (`Townsfolk`, `Outsider`, `Minion`, `Demon`, `Traveller`, `Fabled`)
   - Game phase (`Day`, `Night`)
   - Night phase (`FirstNight`, `OtherNight`)
3. Add **boolean toggles** for visibility/state props:
   - `showCharacters` on relevant components
   - `isAlive`/`isDead` on player components
4. Add descriptive `argTypes` with `description`, `table.category`, and `control` configuration
5. Focus on components that would benefit most from interactive exploration in Storybook

---

## Phase 3 — Unit Test Backfill 🔨 Execute Now

### Phase 3a — High Priority Logic Tests

These are the core logic files that have zero test coverage and are critical to the app's correctness.

---

#### P3-1: `buildNightOrder()` — Night Order Derivation

**File**: [`UI/src/data/characters/_nightOrder.ts`](UI/src/data/characters/_nightOrder.ts)  
**Test file**: `UI/src/data/characters/_nightOrder.test.ts`

**Test cases**:
- Returns correct first night order for a given set of characters
- Returns correct other night order for a given set of characters
- Includes structural entries (MINION_INFO, DEMON_INFO, DUSK, DAWN) at correct positions
- Handles characters with no night action (excluded from order)
- Handles characters with only first night or only other night
- Handles empty character list
- Order is deterministic (same input → same output)
- Characters with same night order number are handled consistently

---

#### P3-2: `GameContext.tsx` Reducer — Game State Management

**File**: [`UI/src/context/GameContext.tsx`](UI/src/context/GameContext.tsx)  
**Test file**: `UI/src/context/GameContext.test.tsx`

**Test cases**:
- All dispatch action types produce correct state transitions
- `ADD_PLAYER` / `REMOVE_PLAYER` — player list updates
- `ASSIGN_CHARACTER` / `UNASSIGN_CHARACTER` — character assignment state
- `SET_SCRIPT` — script loading and character availability
- `ADVANCE_PHASE` / `SET_PHASE` — phase transitions (Day ↔ Night)
- `UPDATE_NIGHT_ACTION` — sub-action checklist state
- `COMPLETE_NIGHT` — night history creation
- `localStorage` persistence — state saved on changes, restored on init
- Initial state shape is correct
- Reducer handles unknown action types gracefully
- Edge cases: duplicate player names, re-assigning characters, empty scripts

---

#### P3-3: `SessionContext.tsx` Reducer — Session State Management

**File**: [`UI/src/context/SessionContext.tsx`](UI/src/context/SessionContext.tsx)  
**Test file**: `UI/src/context/SessionContext.test.tsx`

**Test cases**:
- `CREATE_SESSION` — new session with correct shape
- `DELETE_SESSION` — removes session, handles last-session deletion
- `SET_ACTIVE_SESSION` — switches active session
- `ADD_GAME` / `REMOVE_GAME` — game ID management within session
- `localStorage` persistence — sessions saved/restored
- Edge cases: creating session with duplicate name, deleting active session

---

#### P3-4: `characterAssignment.ts` — Random Character Assignment

**File**: [`UI/src/utils/characterAssignment.ts`](UI/src/utils/characterAssignment.ts)  
**Test file**: `UI/src/utils/characterAssignment.test.ts`

**Test cases**:
- Assigns characters to all players
- Respects character type distribution rules (correct Townsfolk/Outsider/Minion/Demon counts)
- Never assigns same character to two players
- Only assigns characters from the active script
- Handles scripts with exactly enough characters
- Handles scripts with more characters than players (selection)
- Handles edge case of too few characters for player count
- Baron's `setupModification` (extra Outsiders) is respected if implemented
- Result includes correct alignment based on character type

---

#### P3-5: `NightChoiceHelper.ts` — Night Choice Parsing

**File**: [`UI/src/components/NightPhase/NightChoiceHelper.ts`](UI/src/components/NightPhase/NightChoiceHelper.ts)  
**Test file**: `UI/src/components/NightPhase/NightChoiceHelper.test.ts`

**Test cases**:
- `parseHelpTextForChoices()` extracts choices from help text patterns
- Regex patterns correctly identify player-selection choices
- Regex patterns correctly identify yes/no choices
- Regex patterns correctly identify multi-option choices
- Handles help text with no choices (returns empty/null)
- Handles malformed help text gracefully
- Works with actual character help text samples (Fortune Teller, Empath, etc.)

---

#### P3-6: `playerCountRules.ts` — Player Distribution Rules

**File**: [`UI/src/data/playerCountRules.ts`](UI/src/data/playerCountRules.ts)  
**Test file**: `UI/src/data/playerCountRules.test.ts`

**Test cases**:
- Returns correct Townsfolk/Outsider/Minion/Demon counts for each valid player count (5–20)
- Edge case: minimum player count (5)
- Edge case: maximum player count (15 or 20, depending on implementation)
- Handles out-of-range player counts (returns error/default)
- Teensyville rules (if applicable)
- Distribution totals equal the player count

---

#### P3-7: Character Data Structural Validation

**Test file**: `UI/src/data/characters/characters.test.ts`

A single test file that validates ALL character data files in the registry. Must scale to 165+ characters as more are added.

**Test cases** (iterate over all characters from the registry):
- Every character has all required fields: `id`, `name`, `characterType`, `defaultAlignment`
- `id` matches filename convention (lowercase, no spaces)
- `characterType` is a valid `CharacterType` value
- `defaultAlignment` is consistent with `characterType` (Townsfolk/Outsider → Good, Minion/Demon → Evil)
- Night order numbers (if present) have no duplicates across characters for the same phase (firstNight / otherNight)
- `reminders` array exists (can be empty)
- `ability` text is non-empty
- Characters with `nightAction` have valid night order numbers
- No duplicate character IDs across the entire registry
- Character count matches expected total (currently 43, will grow)

**Note**: Individual `setupModification` / `storytellerSetup` behavioral tests are deferred until those fields have game-state actions implemented.

---

### Phase 3b — Comprehensive Component Tests

Every component gets at minimum:
- ✅ **Basic render test** — does it render without crashing with required props
- ✅ **Key props test** — do different prop values produce expected output
- ✅ **Interaction test** (interactive components only) — clicks, toggles, form submissions

All component test files follow the naming convention `ComponentName.test.tsx` and live alongside their component file.

#### Common Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `CharacterAssignmentDialog` | [`CharacterAssignmentDialog.tsx`](UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx) | `CharacterAssignmentDialog.test.tsx` | Dialog open/close, character selection, confirmation |
| `CharacterDetailModal` | [`CharacterDetailModal.tsx`](UI/src/components/common/CharacterDetailModal.tsx) | `CharacterDetailModal.test.tsx` | Modal display, character info rendering, close behavior |
| `characterTypeColor` | [`characterTypeColor.ts`](UI/src/components/common/characterTypeColor.ts) | `characterTypeColor.test.ts` | Pure function — returns correct colors for each character type |
| `ErrorBoundary` | [`ErrorBoundary.tsx`](UI/src/components/common/ErrorBoundary.tsx) | `ErrorBoundary.test.tsx` | Catches errors, renders fallback UI, logs error info |
| `LoadingState` | [`LoadingState.tsx`](UI/src/components/common/LoadingState.tsx) | `LoadingState.test.tsx` | Renders spinner, shows loading text |
| `ShowCharactersToggle` | [`ShowCharactersToggle.tsx`](UI/src/components/common/ShowCharactersToggle.tsx) | `ShowCharactersToggle.test.tsx` | Toggle state, callback invocation |
| `TokenChips` | [`TokenChips.tsx`](UI/src/components/common/TokenChips.tsx) | `TokenChips.test.tsx` | Renders chips for tokens, correct colors |

#### Night History Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `NightHistoryDrawer` | [`NightHistoryDrawer.tsx`](UI/src/components/NightHistory/NightHistoryDrawer.tsx) | `NightHistoryDrawer.test.tsx` | Drawer open/close, history list rendering |
| `NightHistoryReview` | [`NightHistoryReview.tsx`](UI/src/components/NightHistory/NightHistoryReview.tsx) | `NightHistoryReview.test.tsx` | Displays completed night data |

#### Night Order Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `NightOrderEntry` | [`NightOrderEntry.tsx`](UI/src/components/NightOrder/NightOrderEntry.tsx) | `NightOrderEntry.test.tsx` | Renders character night entry, status indicators |
| `NightOrderTab` | [`NightOrderTab.tsx`](UI/src/components/NightOrder/NightOrderTab.tsx) | `NightOrderTab.test.tsx` | Tab rendering, order list display |

#### Night Phase Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `FlashcardCarousel` | [`FlashcardCarousel.tsx`](UI/src/components/NightPhase/FlashcardCarousel.tsx) | `FlashcardCarousel.test.tsx` | Swipe navigation, card rendering, position tracking |
| `NightChoiceSelector` | [`NightChoiceSelector.tsx`](UI/src/components/NightPhase/NightChoiceSelector.tsx) | `NightChoiceSelector.test.tsx` | Choice display, selection handling |
| `NightFlashcard` | [`NightFlashcard.tsx`](UI/src/components/NightPhase/NightFlashcard.tsx) | `NightFlashcard.test.tsx` | Card content rendering, action display |
| `NightPhaseOverlay` | [`NightPhaseOverlay.tsx`](UI/src/components/NightPhase/NightPhaseOverlay.tsx) | `NightPhaseOverlay.test.tsx` | Overlay display, dismiss behavior |
| `NightProgressBar` | [`NightProgressBar.tsx`](UI/src/components/NightPhase/NightProgressBar.tsx) | `NightProgressBar.test.tsx` | Progress calculation, visual state |
| `StructuralCard` | [`StructuralCard.tsx`](UI/src/components/NightPhase/StructuralCard.tsx) | `StructuralCard.test.tsx` | Renders DUSK/DAWN/INFO structural cards |
| `SubActionChecklist` | [`SubActionChecklist.tsx`](UI/src/components/NightPhase/SubActionChecklist.tsx) | `SubActionChecklist.test.tsx` | Check/uncheck items, completion callback |

#### Phase Bar

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `PhaseBar` | [`PhaseBar.tsx`](UI/src/components/PhaseBar/PhaseBar.tsx) | `PhaseBar.test.tsx` | Phase display, button interactions, active state |

#### Player List Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `PlayerEditDialog` | [`PlayerEditDialog.tsx`](UI/src/components/PlayerList/PlayerEditDialog.tsx) | `PlayerEditDialog.test.tsx` | Form fields, validation, save/cancel |
| `PlayerListTab` | [`PlayerListTab.tsx`](UI/src/components/PlayerList/PlayerListTab.tsx) | `PlayerListTab.test.tsx` | Player list rendering, add/remove actions |
| `PlayerRow` | [`PlayerRow.tsx`](UI/src/components/PlayerList/PlayerRow.tsx) | `PlayerRow.test.tsx` | Player info display, action buttons |

#### Script Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `ScriptBuilder` | [`ScriptBuilder.tsx`](UI/src/components/ScriptBuilder/ScriptBuilder.tsx) | `ScriptBuilder.test.tsx` | Script creation, character selection |
| `CharacterCard` | [`CharacterCard.tsx`](UI/src/components/ScriptViewer/CharacterCard.tsx) | `CharacterCard.test.tsx` | Character display, type-based styling |
| `ScriptReferenceTab` | [`ScriptReferenceTab.tsx`](UI/src/components/ScriptViewer/ScriptReferenceTab.tsx) | `ScriptReferenceTab.test.tsx` | Script display, character list |

#### Timer Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `DayTimer` | [`DayTimer.tsx`](UI/src/components/Timer/DayTimer.tsx) | `DayTimer.test.tsx` | Timer display, start/stop/reset |
| `DayTimerFab` | [`DayTimerFab.tsx`](UI/src/components/Timer/DayTimerFab.tsx) | `DayTimerFab.test.tsx` | FAB rendering, click to open timer |

#### Town Square Components

| Component | File | Test File | Priority Notes |
|-----------|------|-----------|---------------|
| `AddTravellerDialog` | [`AddTravellerDialog.tsx`](UI/src/components/TownSquare/AddTravellerDialog.tsx) | `AddTravellerDialog.test.tsx` | Dialog flow, traveller selection, confirmation |
| `PlayerQuickActions` | [`PlayerQuickActions.tsx`](UI/src/components/TownSquare/PlayerQuickActions.tsx) | `PlayerQuickActions.test.tsx` | Action buttons, callback invocation |
| `PlayerToken` | [`PlayerToken.tsx`](UI/src/components/TownSquare/PlayerToken.tsx) | `PlayerToken.test.tsx` | Token display, alive/dead states, character info |
| `TokenManager` | [`TokenManager.tsx`](UI/src/components/TownSquare/TokenManager.tsx) | `TokenManager.test.tsx` | Token state management, position updates |
| `TownSquareLayout` | [`TownSquareLayout.tsx`](UI/src/components/TownSquare/TownSquareLayout.tsx) | `TownSquareLayout.test.tsx` | Ring layout rendering, responsive behavior |
| `TownSquareTab` | [`TownSquareTab.tsx`](UI/src/components/TownSquare/TownSquareTab.tsx) | `TownSquareTab.test.tsx` | Tab rendering, town square display |

---

## Phase 4 — Medium Priority Utils & Hooks ✅ Complete

These utilities and hooks have lower risk but should still be tested for completeness.

### P4-1: `idGenerator.ts`

**File**: [`UI/src/utils/idGenerator.ts`](UI/src/utils/idGenerator.ts)  
**Test file**: `UI/src/utils/idGenerator.test.ts`  
**Scope**: ID uniqueness, format validation, collision resistance

### P4-2: `audioAlarm.ts`

**File**: [`UI/src/utils/audioAlarm.ts`](UI/src/utils/audioAlarm.ts)  
**Test file**: `UI/src/utils/audioAlarm.test.ts`  
**Scope**: Requires browser Audio API mocking. Test play/stop/volume behavior, error handling for unsupported browsers.

### P4-3: `useCharacterLookup.ts`

**File**: [`UI/src/hooks/useCharacterLookup.ts`](UI/src/hooks/useCharacterLookup.ts)  
**Test file**: `UI/src/hooks/useCharacterLookup.test.ts`  
**Scope**: Returns correct character data for valid IDs, handles unknown IDs with fallback, memoization behavior.

### P4-4: `useNightOrder.ts`

**File**: [`UI/src/hooks/useNightOrder.ts`](UI/src/hooks/useNightOrder.ts)  
**Test file**: `UI/src/hooks/useNightOrder.test.ts`  
**Scope**: Returns filtered/ordered night order for active game, recalculates on character changes.

### P4-5: `useTimer.ts`

**File**: [`UI/src/hooks/useTimer.ts`](UI/src/hooks/useTimer.ts)  
**Test file**: `UI/src/hooks/useTimer.test.ts`  
**Scope**: Timer start/stop/reset, countdown accuracy (with fake timers), alarm trigger at zero.

### P4-6: `useApiSync.ts`

**File**: [`UI/src/hooks/useApiSync.ts`](UI/src/hooks/useApiSync.ts)  
**Test file**: `UI/src/hooks/useApiSync.test.ts`  
**Scope**: API call mocking, sync trigger conditions, error handling, retry behavior.

---

## Phase 5 — Coverage Enforcement & Policy ✅ Complete

### P5-1: Configure Coverage Thresholds

**File**: [`UI/vitest.config.ts`](UI/vitest.config.ts)

Add coverage thresholds starting at a conservative baseline, then ratchet up as coverage improves:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: {
    statements: 60,
    branches: 50,
    functions: 60,
    lines: 60,
  },
},
```

**Strategy**: Set initial thresholds at or slightly above current coverage. After each milestone, increase thresholds to the new baseline so coverage never regresses.

---

### P5-2: Add Coverage Check to CI/Pre-Push Hook

**File**: [`UI/package.json`](UI/package.json) scripts + [`.husky/`](.husky/) hooks

- Add `test:coverage` to the pre-push hook so coverage is checked before every push
- Ensure CI pipeline (when added) runs `npm run test:coverage`
- Coverage failures should block the push/merge

---

### P5-3: Create Testing Guidelines Document

**File**: `docs/testing.md`

Contents:
- **When to write unit tests vs. stories vs. both**
  - Pure functions/utils → unit tests only
  - Visual components with no interaction → Storybook stories only
  - Interactive components → both unit tests AND stories with `play()` functions
  - Context/reducer logic → unit tests only
  - Hooks → unit tests with `renderHook`
- **Test file naming conventions**
  - Unit tests: `*.test.ts` / `*.test.tsx` (colocated with source file)
  - Stories: `*.stories.tsx` (colocated with component)
- **Testing patterns**
  - Factory functions for creating test data (players, games, sessions)
  - Mock patterns for contexts (`GameContext`, `SessionContext`)
  - `renderHook` from `@testing-library/react` for custom hooks
  - `render` + `screen` + `userEvent` for component tests
  - `vi.fn()` for callback props, `vi.spyOn()` for module mocking
- **Storybook story patterns**
  - CSF3 format (named exports, `Meta`/`StoryObj` types)
  - `play()` functions for interaction testing
  - Controls configuration with argTypes
  - Viewport variants for responsive testing
- **Character data testing approach**
  - Structural validation test covers all characters automatically
  - Individual behavioral tests only for characters with game-state-affecting `setupModification` / `storytellerSetup`
- **Coverage expectations per file type**
  - Utils/pure functions: 90%+
  - Context reducers: 85%+
  - Components: 70%+
  - Hooks: 80%+

---

### P5-4: Update `AGENTS.md` with Testing Requirements

**File**: [`AGENTS.md`](AGENTS.md)

Add a new **Testing Requirements** section:

- Every new `.ts`/`.tsx` file **must** have a corresponding test file
- Every milestone **must** include tests for its changes
- **Exceptions**:
  - Individual character data files (covered by structural validation in `characters.test.ts`)
  - Pure re-export barrel files (`index.ts` that only re-export)
- Storybook stories **required** for all visual components
- `play()` interaction tests **required** for interactive components
- **Run `npm test` before completing any code task** — all tests must pass
- Character `setupModification` / `storytellerSetup` with game-state actions require individual behavioral tests
- When adding new characters, run `characters.test.ts` to validate structural integrity

---

## Execution Status Tracking

| Task ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| **P1-1** | Wire `@testing-library/jest-dom` into vitest setup | ✅ Complete | Created `UI/src/test/setup.ts`, updated `vitest.config.ts` |
| **P1-2** | Enable Storybook a11y testing | ✅ Complete | Changed `a11y.test` from `'todo'` to `'error-only'` |
| **P1-3** | Investigate Storybook-Vitest addon timeout | ⚠️ Deferred | Root cause: `@storybook/addon-vitest@10.2.8` incompatible with Vitest 4's project system. Addon searches for deprecated `vitest.workspace.ts`. Will be resolved in future addon release. |
| **P2-1** | Configure viewport presets | ✅ Complete | 4 viewports configured (Mobile/Mobile Large/Tablet/Desktop) |
| **P2-2** | Add responsive story variants | ✅ Complete | 6 new responsive stories |
| **P2-3** | Add `play()` interaction tests | ✅ Complete | 7 new play() stories across 6 components |
| **P2-4** | Enhance controls/argTypes | ✅ Complete | Range sliders and controls added to 3 story files |
| **P3-1** | Test `buildNightOrder()` | ✅ Complete | 17 tests |
| **P3-2** | Test `GameContext` reducer | ✅ Complete | 60 tests |
| **P3-3** | Test `SessionContext` reducer | ✅ Complete | 42 tests |
| **P3-4** | Test `characterAssignment.ts` | ✅ Complete | 17 tests |
| **P3-5** | Test `NightChoiceHelper.ts` | ✅ Complete | 34 tests |
| **P3-6** | Test `playerCountRules.ts` | ✅ Complete | 18 tests |
| **P3-7** | Character data structural validation | ✅ Complete | 397 tests (scales automatically to 165+ chars) |
| **P3b-common** | Component tests — Common (6 files) | ✅ Complete | 57 tests (characterTypeColor, LoadingState, ErrorBoundary, ShowCharactersToggle, CharacterDetailModal, TokenChips) |
| **P3b-nightphase** | Component tests — Night Phase (7 files) | ✅ Complete | 97 tests (SubActionChecklist, StructuralCard, NightProgressBar, NightFlashcard, NightChoiceSelector, FlashcardCarousel, NightPhaseOverlay) |
| **P3b-nighthistory-nightorder** | Component tests — Night History + Night Order (4 files) | ✅ Complete | 40 tests (NightHistoryDrawer, NightHistoryReview, NightOrderEntry, NightOrderTab) |
| **P3b-phasebar-playerlist** | Component tests — PhaseBar + Player List (3 files) | ✅ Complete | 49 tests (PhaseBar, PlayerRow, PlayerEditDialog, PlayerListTab) |
| **P3b-scriptbuilder-scriptviewer-timer** | Component tests — Script + Timer (5 files) | ✅ Complete | 60 tests (CharacterCard, ScriptReferenceTab, ScriptBuilder, DayTimer, DayTimerFab) |
| **P3b-townsquare** | Component tests — Town Square (6 files) | ✅ Complete | 76 tests (PlayerToken, PlayerQuickActions, AddTravellerDialog, TokenManager, TownSquareLayout, TownSquareTab) |
| **P3b-assignment-pages** | Component tests — Assignment + Pages (4 files) | ✅ Complete | 61 tests (CharacterAssignmentDialog, HomePage, SessionSetupPage, GameViewPage) |
| **P4-1** | Test `idGenerator.ts` | ✅ Complete | 6 tests |
| **P4-2** | Test `audioAlarm.ts` | ✅ Complete | 14 tests |
| **P4-3** | Test `useCharacterLookup.ts` | ✅ Complete | 8 tests |
| **P4-4** | Test `useNightOrder.ts` | ✅ Complete | 14 tests |
| **P4-5** | Test `useTimer.ts` | ✅ Complete | 27 tests |
| **P4-6** | Test `useApiSync.ts` | ✅ Complete | 22 tests |
| **P5-1** | Configure coverage thresholds | ✅ Complete | Baseline: Stmts 82.87%, Branch 79.95%, Funcs 74.08%, Lines 84.66%. Thresholds set ~5% below: 77/74/69/79 |
| **P5-2** | Add coverage to CI/pre-push | ✅ Complete | Pre-push hook updated to use `npm run test:coverage` |
| **P5-3** | Create `docs/testing.md` | ✅ Complete | Comprehensive testing guidelines with real code examples |
| **P5-4** | Update documentation | ✅ Complete | Updated milestone7.md, progress.md, AGENTS.md with final stats (1187 tests, 54 files) |

---

## Success Criteria

### Phases 1-3 (Complete)

All of the following are true as of M7 Phases 1-3 completion:

- [x] **Infrastructure**: `@testing-library/jest-dom` wired into vitest setup and working
- [x] **A11y**: Storybook a11y testing active (`a11y.test: 'error-only'`)
- [x] **Storybook-Vitest**: Investigated and documented with deferral rationale (addon incompatible with Vitest 4's project system)
- [x] **Viewports**: Responsive viewport presets configured (Mobile, Mobile Large, Tablet, Desktop)
- [x] **Responsive stories**: Viewport variants added for 6 responsive stories
- [x] **Interaction tests**: `play()` functions added to 7 stories across 6 components
- [x] **Enhanced controls**: Range sliders and controls added to 3 story files
- [x] **Night order tests**: `buildNightOrder()` fully tested (17 tests)
- [x] **Context tests**: Both `GameContext` (60 tests) and `SessionContext` (42 tests) reducers fully tested
- [x] **Utility tests**: `characterAssignment` (17), `NightChoiceHelper` (34), `playerCountRules` (18) fully tested
- [x] **Character validation**: Structural validation test covering all 43 characters, scalable to 165+ (397 tests)
- [x] **Component tests**: Every component listed in Phase 3b has at least a basic render test (440 tests across 35 files)
- [x] **All tests passing**: `npm test` exits cleanly with 0 failures — 1096 tests across 48 files
- [x] **Phases 4-5 documented**: Fully specified for future execution with no ambiguity

### Phases 4-5 (Complete)

- [x] **Medium-priority utils/hooks tests**: `idGenerator` (6), `audioAlarm` (14), `useCharacterLookup` (8), `useNightOrder` (14), `useTimer` (27), `useApiSync` (22) — 91 tests across 6 files
- [x] **Coverage thresholds**: Configured in `vitest.config.ts` — Stmts 77%, Branch 74%, Funcs 69%, Lines 79% (baseline ~5% above thresholds)
- [x] **Coverage in CI/pre-push**: Pre-push hook updated to run `npm run test:coverage` instead of `npm test`
- [x] **Testing guidelines doc**: Created comprehensive `docs/testing.md` with real code examples
- [x] **All tests passing**: 1187 tests across 54 test files — 0 failures
- [x] **ScriptBuilder fix**: Removed `queueMicrotask` anti-pattern, replaced with ref-based previous-state tracking to eliminate race conditions under coverage
