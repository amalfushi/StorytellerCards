# Storyteller Cards — Testing Guidelines

> Reference guide for writing and maintaining tests in this project.

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

The pre-push hook ([`.husky/pre-push`](../.husky/pre-push)) runs **automatically** on `git push`:

1. ✅ Detects UI/API file changes
2. ✅ Runs `npm run test:coverage` (all tests + threshold enforcement)
3. ✅ Auto-commits `coverage-summary.json` if changed
4. ✅ Runs Go tests if API files changed

The pre-commit hook runs lint checks on staged files via Husky.

> **Note:** The pre-push hook does NOT run linting or TypeScript checks — those are the agent's responsibility during development (see below).

## Agent Development Workflow

Before completing any code task (using `attempt_completion`), agents **MUST** run these checks:

1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors required)
2. `cd UI && npx eslint .` — Linting (0 errors required)
3. `cd UI && npm test` — All tests pass

These can be run in parallel for efficiency. All three must pass before the task is considered complete.

The pre-push hook enforces test coverage thresholds automatically, but **linting and TypeScript checks are the agent's responsibility** during development.
