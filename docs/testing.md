# Storyteller Cards — Testing Guidelines

> Reference guide for writing and maintaining tests in this project.

## Test Suites Catalog

This project has **six** distinct test suites. Each covers a different layer.
**Run the right suite for the code you touched** — pre-push hooks only cover the fast suites.

| # | Suite | Command (from repo root) | What it covers | When to run | Pre-push hook? | Runtime |
|---|-------|---------------------------|----------------|-------------|----------------|---------|
| 1 | **UI unit** | `npm run test:ui` | All `*.test.ts(x)` under `UI/src/` — components, hooks, reducers, utils, character data validation | After any UI change | ✅ (when UI/ changed) | ~30s |
| 2 | **UI storybook interaction** | `npm run test:storybook` | All `*.stories.tsx` `play()` functions + a11y rules — runs real components in a Chromium browser | After any visual/component change | ✅ (when UI/ changed) | ~50s |
| 3 | **API unit** | `npm run test:api` | `go test ./...` — Go handlers, services, persistence helpers | After any API change | ✅ (when API/ changed) | ~5s |
| 4 | **API roundtrip** | `cd API && go test ./internal/handlers/ -run Roundtrip` | JSON model fidelity: marshal → unmarshal cycle preserves every field. Catches drift between Go structs and the on-disk session/game JSON | After any change to `Game`/`Session`/`Player` structs or character data shape | ✅ (when API/ changed) | ~2s |
| 5 | **Playwright E2E — lifecycle** | `npm run test:e2e` | Session/game CRUD, page navigation, basic state persistence. Requires UI + API booted (config auto-starts them) | After changes to routing, session lifecycle, persistence | ❌ (too slow) | ~30s |
| 6 | **Playwright E2E — sync** | `npm run test:e2e:sync` | Cross-device SSE sync — two browser contexts mutate the same game and verify real-time propagation | After changes to SSE, event broadcasting, or any cross-device state | ❌ (slow + occasional flakes) | ~60s |
| 7 | **Playwright E2E — journey** | `npm run test:e2e:journey` | Full game playthrough end-to-end (multiple days/nights, character abilities). Longest, highest signal | Before releasing a milestone | ❌ (~3min, has known timing issues) | ~3min |
| ★ | **Everything** | `npm run test:all` | Runs suites 1–6 sequentially (skips slow journey suite) | Before PR merge, after large refactors | — | ~3min |

**Integration combo** (`npm run test:integration`) is a convenience that chains roundtrip + every Playwright project. Slower than `test:all`; useful when investigating cross-stack regressions.

### Triggering the right suite

| You touched… | Run at minimum… |
|---|---|
| A React component (`*.tsx`) | unit + storybook |
| A reducer or context | unit |
| A `data/characters/*.ts` file | unit (auto-validated) + roundtrip if shape changed |
| A Go handler or model | api + roundtrip |
| Session / game JSON shape | api + roundtrip + lifecycle E2E |
| SSE / event publishing | api + sync E2E |
| Night phase / character ability flow | unit + storybook + lifecycle E2E (journey before release) |

### Why the hook doesn't cover Playwright

E2E suites need a real browser (Chromium download ~120 MB), boot UI+API, and take 30s–3min each. Running them per push would block developer flow. The expectation is:
- **Hook** catches unit-level regressions in <60 s
- **PR author** runs the relevant E2E suite manually before requesting review
- **CI** (when set up) runs `test:all` against every PR

If you change session lifecycle, SSE, or full-game flows and skip the matching E2E suite, expect regressions to land. See the M39 milestone for context on why this catalog exists.

---

## Test Stack

| Tool | Purpose |
|------|---------|
| [Vitest](https://vitest.dev/) | Test runner + assertion library |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | Component rendering + interaction |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | DOM assertion matchers (`toBeInTheDocument()`, etc.) |
| [Storybook 8](https://storybook.js.org/) | Visual component testing + interaction tests |

## When to Write Tests

### Unit Tests (`*.test.ts` / `*.test.tsx`)

- **Every** new `.ts` or `.tsx` file gets a corresponding test file
- Pure functions: test inputs → outputs, edge cases, error handling
- Hooks: test with `renderHook()` + `act()`, mock dependencies
- Context/Reducers: test every action type with state assertions
- Components: render test + props test + interaction tests

### Storybook Stories (`*.stories.tsx`)

- Visual components that render UI must have stories
- Interactive components should have `play()` interaction tests
- Layout-critical components need responsive viewport variants
- Stories serve as living documentation — each gets a JSDoc comment

### Exceptions

- Individual character data files in `UI/src/data/characters/` — covered by the structural validation test in [`characterData.test.ts`](../UI/src/data/characters/characterData.test.ts) which auto-validates all characters
- Pure barrel re-export files (e.g., `index.ts` that only re-exports)
- `setupModification`/`storytellerSetup` behavior — deferred until those fields have game-state actions

## Test File Patterns

### Naming

- `MyComponent.tsx` → `MyComponent.test.tsx` (same directory)
- `myUtil.ts` → `myUtil.test.ts` (same directory)

### Structure

Tests follow a consistent `describe`/`it` pattern with setup via `beforeEach` and factory helpers:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MyComponent {...defaultProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    render(<MyComponent {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });
});
```

### Factory Helpers

Create `make*()` functions for test data to avoid repetitive object construction. This pattern is used extensively throughout the project:

```typescript
// From GameContext.test.tsx

const makePlayer = (overrides: Partial<PlayerSeat> = {}): PlayerSeat => ({
  seat: 1,
  playerName: 'Alice',
  characterId: 'imp',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Evil,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
  ...overrides,
});

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'test-game',
  sessionId: 'test-session',
  scriptId: 'test-script',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  nightHistory: [],
  players: [],
  ...overrides,
});
```

For night order entries, use lightweight builder functions:

```typescript
// From nightOrderFilter.test.ts

function structural(id: string): NightOrderEntry {
  return {
    order: 0,
    type: 'structural',
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    helpText: `${id} help text`,
    subActions: [],
  };
}

function character(id: string, order = 0): NightOrderEntry {
  return {
    order,
    type: 'character',
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    helpText: `${id} help text`,
    subActions: [],
  };
}
```

### Context Testing

Use `renderHook()` with a Provider wrapper for hook/context tests:

```typescript
// From GameContext.test.tsx

import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider, useGame } from './GameContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

function renderGameHook() {
  return renderHook(() => useGame(), { wrapper });
}

// Usage in tests:
it('loads a game into state', () => {
  const { result } = renderGameHook();

  act(() => {
    result.current.loadGame(makeGame({ id: 'game-1' }));
  });

  expect(result.current.state.game?.id).toBe('game-1');
});
```

### Component Testing

Use `render` + `screen` + `fireEvent` for component tests:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('renders without crashing', () => {
  const { container } = render(<MyComponent open={true} onClose={vi.fn()} />);
  expect(container).toBeTruthy();
});

it('shows title text', () => {
  render(<MyComponent open={true} onClose={vi.fn()} />);
  expect(screen.getByText('My Title')).toBeInTheDocument();
});

it('calls onClose when cancel button is clicked', () => {
  const onClose = vi.fn();
  render(<MyComponent open={true} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

### Mocking

- `vi.fn()` for callbacks and spy functions
- `vi.mock()` for module-level mocking
- `vi.useFakeTimers()` for timer-dependent code (e.g., `useTimer`)
- `vi.stubGlobal()` for browser APIs (`AudioContext`, `fetch`)
- `localStorage.clear()` in `beforeEach` for storage-dependent tests

```typescript
// Timer mocking (from useTimer.test.ts)
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

// Browser API mocking (from audioAlarm.test.ts)
beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext);
});

// localStorage cleanup (from GameContext.test.tsx)
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

## Storybook Patterns

### CSF3 Format

All stories use Storybook's CSF3 format with `Meta` and `StoryObj` types:

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Category/MyComponent',
  component: MyComponent,
  args: {
    // Default args for all stories
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** JSDoc comment explaining the scenario. */
export const Default: Story = {
  args: {
    // Story-specific args
  },
};
```

### `play()` Interaction Tests

Interactive components include `play()` functions using `within`, `userEvent`, and `expect` from `storybook/test`:

```typescript
import { within, userEvent, expect } from 'storybook/test';

/** Clicking the toggle switches from day → night mode. */
export const ToggleClick: Story = {
  decorators: [withMockGameContext({ showCharacters: false })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggleButton = canvas.getByRole('button', { name: /show character info/i });
    await expect(toggleButton).toBeInTheDocument();
    await userEvent.click(toggleButton);
    const hiddenButton = canvas.getByRole('button', { name: /hide character info/i });
    await expect(hiddenButton).toBeInTheDocument();
  },
};
```

### Responsive Variants

Layout-critical components include viewport variants using `parameters.viewport`:

```typescript
/** Mobile viewport — compact layout. */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
};

/** Tablet viewport — wider layout. */
export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
};
```

Available viewports: `mobile` (375×667), `mobileLarge` (414×896), `tablet` (768×1024), `desktop` (1280×800).

### Controls / ArgTypes

Use `argTypes` for interactive exploration with range sliders and select dropdowns:

```typescript
const meta = {
  // ...
  argTypes: {
    currentIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'Index of the currently active night order card',
    },
    totalCards: {
      control: { type: 'range', min: 1, max: 25, step: 1 },
      description: 'Total number of cards in the night order',
    },
    characterType: {
      control: 'select',
      options: ['Townsfolk', 'Outsider', 'Minion', 'Demon'],
      description: 'The type of character',
    },
  },
} satisfies Meta<typeof MyComponent>;
```

## Integration & E2E Testing (Playwright)

### Three Testing Levels

Storyteller Cards uses a **three-level integration testing strategy** to catch bugs at system boundaries — where unit tests can't reach:

| Level | What | Speed | Command |
|-------|------|-------|---------|
| **Level 1** — Go Model Roundtrip | PUT maximal game/session state to the API, GET back, deep-compare all fields. Catches Go struct fields silently dropping data on JSON roundtrip. | ~2s | `cd API && go test ./internal/handlers/ -run Roundtrip -v` |
| **Level 2** — Playwright Game Lifecycle | Full UI workflow: create session → create game → import script → add players → complete night phase. Asserts API state matches at each step. | ~30s | `npm run test:e2e` |
| **Level 3** — Playwright Cross-Device Sync | Two isolated browser contexts sharing the same API. Validates SSE sync, self-echo prevention, and bidirectional state propagation. | ~60s | `npm run test:e2e:sync` |

### Running E2E Tests

```bash
# Run lifecycle tests only (Level 2)
npm run test:e2e

# Run sync tests only (Level 3)
npm run test:e2e:sync

# Run all Playwright E2E tests (Levels 2 + 3)
npm run test:e2e:all

# Run all integration tests (Go roundtrip + all Playwright E2E)
npm run test:integration
```

### Running Headed / Debug Mode

```bash
# Watch the browser while tests run
cd UI && npx playwright test --config=e2e/playwright.config.ts --headed

# Slow down interactions (useful for debugging visual flows)
cd UI && npx playwright test --config=e2e/playwright.config.ts --headed --slowmo=500

# Step through tests interactively with Playwright Inspector
cd UI && npx playwright test --config=e2e/playwright.config.ts --debug
```

### Test Fixture Script

The E2E tests use a minimal fixture script at [`UI/e2e/fixtures/test-script.json`](../UI/e2e/fixtures/test-script.json) containing a small set of Trouble Brewing characters (Washerwoman, Librarian, Investigator, Chef, Empath, Imp, Poisoner). This keeps tests fast and deterministic.

### Playwright Configuration

- **Browser**: Chromium only (mobile-first app, no cross-browser matrix needed)
- **Dev server**: Automatically starts `npm run dev` (Vite + Go API) before tests run
- **Base URL**: `http://localhost:5173`
- **Projects**: `lifecycle` (game-lifecycle.spec.ts) and `sync` (cross-device-sync.spec.ts)
- **Config location**: [`UI/e2e/playwright.config.ts`](../UI/e2e/playwright.config.ts)

## Coverage

### Running Coverage

```bash
cd UI && npm run test:coverage
```

This generates both a text report (console) and an LCOV report (for IDE integration).

### Thresholds

Coverage thresholds are enforced in [`vitest.config.ts`](../UI/vitest.config.ts). The pre-push hook runs `npm run test:coverage` automatically, which checks thresholds and blocks pushes if they're not met.

Current thresholds (set ~5% below baseline):

| Metric | Threshold | Baseline (2026-03-04) |
|--------|-----------|----------------------|
| Statements | 77% | 82.87% |
| Branches | 74% | 79.95% |
| Functions | 69% | 74.08% |
| Lines | 79% | 84.66% |

### Coverage Expectations by File Type

| File Type | Target |
|-----------|--------|
| Utils / Pure functions | 90%+ |
| Hooks | 80%+ |
| Context / Reducers | 80%+ |
| Components | 70%+ |
| Pages | 60%+ |

## Running Tests

| Command | Purpose |
|---------|---------|
| `cd UI && npm test` | Run all tests once |
| `cd UI && npm run test:watch` | Watch mode (development) |
| `cd UI && npm run test:coverage` | With coverage report + threshold check |
| `cd UI && npx storybook dev` | Storybook dev server |
| `cd UI && npx storybook build --test` | Build Storybook for testing |

## CI / Pre-push Checklist

The git hooks ([`.husky/`](../.husky/)) run **automatically**:

### Pre-commit (on `git commit`):
1. ✅ Detects UI/API file changes
2. ✅ Runs `lint-staged` (ESLint + Prettier on staged `.ts`/`.tsx` files)
3. ✅ Runs `tsc --noEmit` (TypeScript compilation check)
4. ✅ Runs `go vet` if API files changed

### Pre-push (on `git push`):
1. ✅ Detects UI/API file changes
2. ✅ Runs `npm run test:coverage` (all tests + threshold enforcement)
3. ✅ Auto-commits `coverage-final.json` if changed
4. ✅ Runs Go tests if API files changed

## Agent Development Workflow

Before completing any code task (using `attempt_completion`), agents **MUST** ensure all quality checks pass. Most checks are automated by git hooks:

### Automated by Git Hooks

| Hook | Check | When |
|------|-------|------|
| Pre-commit | `lint-staged` (ESLint fix + Prettier) on staged `.ts`/`.tsx` | Every commit with UI changes |
| Pre-commit | `tsc --noEmit` (TypeScript compilation) | Every commit with UI changes |
| Pre-commit | `go vet` | Every commit with API changes |
| Pre-push | `npm run test:coverage` (all tests + coverage thresholds) | Every push |
| Pre-push | Auto-commits `coverage-final.json` | Every push |

### During Development

Run `cd UI && npm test` frequently as a fast sanity check to catch regressions early. The pre-push hook runs the full coverage version automatically.

> **There is no GitHub Actions CI.** All quality gates are local git hooks only.
