# Storyteller Cards — UI

A mobile-first React application for Blood on the Clocktower Storytellers. Provides night phase flashcards, player management, script reference, and game state tracking.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

## Getting Started

```bash
cd StorytellerCards/UI
npm install

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Storybook
npm run storybook
```

The dev server starts at **http://localhost:5173**.

## Architecture

```
src/
├── pages/              # Route-level page components
│   ├── HomePage.tsx           # Landing / session list
│   ├── SessionSetupPage.tsx   # Player setup + script import
│   └── GameViewPage.tsx       # Main game view with tabs
├── components/
│   ├── common/         # Shared UI (ErrorBoundary, LoadingState, toggles)
│   ├── NightOrder/     # Night order reference tab
│   ├── NightPhase/     # Flashcard carousel, progress bar, checklists
│   ├── NightHistory/   # Night history drawer & review
│   ├── PhaseBar/       # Phase indicator bar
│   ├── PlayerList/     # Player list management
│   ├── ScriptViewer/   # Script reference cards
│   ├── Timer/          # Day timer FAB + display
│   └── TownSquare/     # Town square layout, player tokens, actions
├── context/            # React context providers
│   ├── GameContext.tsx         # Game state management
│   └── SessionContext.tsx     # Session state management
├── hooks/              # Custom React hooks
│   ├── useApiSync.ts          # API synchronisation
│   ├── useCharacterLookup.ts  # Character data lookup
│   ├── useLocalStorage.ts     # localStorage with debounced persistence
│   ├── useNightOrder.ts       # Night order filtering
│   └── useTimer.ts            # Day timer logic
├── utils/              # Pure utility functions
│   ├── scriptImporter.ts      # Parse BotC script JSON
│   ├── scriptSortRules.ts     # Sort characters by official rules
│   ├── nightOrderFilter.ts    # Filter night order to active script
│   ├── nightHistoryUtils.ts   # Night history summarisation
│   ├── idGenerator.ts         # ID generation
│   └── audioAlarm.ts          # Timer alarm sounds
├── data/               # Static JSON data files
│   ├── characters.json        # Master character definitions
│   └── nightOrder.json        # Master night order
├── types/              # TypeScript type definitions
│   └── index.ts
├── theme/              # MUI theme configuration
│   └── index.ts
└── stories/            # Storybook shared utilities
    ├── decorators.tsx
    └── mockData.ts
```

## Testing

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with their source files using the `.test.ts` / `.test.tsx` suffix:

- `src/utils/*.test.ts` — Pure function unit tests
- `src/hooks/*.test.ts` — React hook tests (using `@testing-library/react`)

### Adding Tests

1. Create a `*.test.ts` file next to the module you want to test
2. Import from `vitest` (`describe`, `it`, `expect`)
3. For React hooks/components, use `@testing-library/react`

## Environment Variables

| Variable       | Description         | Default (dev)           |
| -------------- | ------------------- | ----------------------- |
| `VITE_API_URL` | API server base URL | `http://localhost:3001` |

Configuration files:

- `.env.development` — Local dev defaults (committed)
- `.env.production` — Production values (git-ignored)
- `.env.production.example` — Template for production env

## Component Patterns

- **Functional components** with hooks (no class components)
- **Named exports** for all components and utilities
- **MUI** for all UI primitives (Button, Dialog, Typography, etc.)
- **Context providers** for shared game/session state
- **Co-located stories** (`*.stories.tsx`) for Storybook documentation

## Coding Standards

- TypeScript strict mode
- ESLint + Prettier for formatting
- `const`-based enum objects (erasableSyntaxOnly compatible)
- Path alias `@/` → `src/` in Vitest config
