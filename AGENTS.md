# Storyteller Cards — AI Agent Context

> **Read this first.** This is the primary context file for any AI agent picking up this project.

## ⚠️ MANDATORY FIRST STEP — Run Before Anything Else

> **Every agent, every task, every time.** Before reading files, analyzing code, running builds, linting, testing, or performing any other operation, you **MUST** install dependencies first.

```bash
npm run install:all
```

This is a monorepo that uses **git worktrees** for development. Freshly checked-out worktrees will **not** have `node_modules` installed in either the root or `UI/` directory. Running any build, lint, or test command without installing first will fail and waste tokens diagnosing missing-dependency errors.

The `install:all` script (defined in the root [`package.json`](package.json)) runs `npm install` at the root, `npm install` in `UI/`, and `go mod download` in `API/` — all in one command.

**Do not skip this step. Do not defer this step. Run it immediately upon starting any new task.**

## Project Overview

**Storyteller Cards** is a mobile-first React + Go application that helps *Blood on the Clocktower* Storytellers manage games. The core feature is **Night Phase Flashcards** — swipeable cards that guide the Storyteller through each character's night action in the correct order.

The app manages a hierarchy: **Sessions** (containers) → **Games** → **Players with Characters from Scripts**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript + Vite 6 + MUI Core (free tier) |
| State | React Context + `useReducer` + `localStorage` (primary), Go API (secondary sync) |
| Testing | Vitest (2460 tests across 57 files), Storybook 8 (~90+ stories with `play()` interaction tests) |
| Code Quality | ESLint 9 flat config + Prettier + Husky (pre-commit lint, pre-push tests + coverage) |
| API | Go + Chi router, JSON file storage, 90-day auto-cleanup |
| PWA | `manifest.json`, icons, mobile meta tags |

## How to Run

```bash
cd StorytellerCards
npm install && cd UI && npm install && cd ..
npm run dev          # UI (localhost:5173) + API (localhost:3001)
npm test             # Run all tests
cd UI && npm run storybook  # Storybook (localhost:6006)
```

## Key Design Decisions

- **All functional components** — no class components except [`ErrorBoundary`](UI/src/components/common/ErrorBoundary.tsx)
- **Named exports only** — no default exports anywhere
- **`as const` objects instead of `enum`** — due to `tsconfig` `erasableSyntaxOnly` setting. See [`types/index.ts`](UI/src/types/index.ts) for examples
- **Character IDs**: lowercase, no spaces (e.g., `"nodashii"`, `"fanggu"`, `"highpriestess"`)
- **Day/Night visibility toggle**: Day view hides character info from players; Night view shows everything
- **Night flashcard sub-actions**: individual checkmarks per instruction step, reset each night
- **Night history**: every completed night saved for review
- **Characters**: individual `.ts` files in [`UI/src/data/characters/`](UI/src/data/characters/index.ts) (179 characters), organized by type subdirectory (`townsfolk/`, `outsider/`, `minion/`, `demon/`, `fabled/`, `traveller/`, `loric/`), accessed via barrel export
- **Night order**: derived from character files via [`buildNightOrder()`](UI/src/data/characters/_nightOrder.ts) — no separate master JSON file
- **Night choices**: declarative `NightChoice` schema on `NightAction.choices` — all characters have explicit choices arrays
- **Scripts**: JSON arrays — `[{id: "_meta", name, author}, "characterid1", "characterid2", ...]`
- **Unknown characters**: handled with `getFallbackCharacter()` fallback (shows `<TODO>` for missing data)
- **No Redux** — hooks + Context only
- **No Bootstrap** — MUI Core only

## Color Scheme

| Type | Color | Hex |
|------|-------|-----|
| Townsfolk | Blue | `#1976d2` |
| Outsider | Light Blue | `#42a5f5` |
| Minion | Red | `#d32f2f` |
| Demon | Dark Red | `#b71c1c` |
| Traveller | Split blue/red | `#1976d2` (good) / `#d32f2f` (evil) |
| Fabled | Orange-gold gradient | `#ff9800` → `#ffd54f` |
| Loric | Mossy green | `#558b2f` |

See [`characterTypeColor.ts`](UI/src/components/common/characterTypeColor.ts) for the implementation.

## User Preferences

- **Mobile-first** (phone primary, tablet secondary)
- Game state is secret during Day phase (`ShowCharactersToggle`)
- The user is a C# developer learning Go, familiar with React/TypeScript
- Prefers efficiency — batch multiple small fixes into single tasks
- **Master data files must NEVER be modified**: `Boozling.json`, `NightOrder.md`, `ScriptSortOrder.md`, `Boozling.pdf`

## Key Files to Read First

| File | Purpose |
|------|---------|
| [`docs/milestones/1 - initial app setup/architecture-plan.md`](docs/milestones/1 - initial app setup/architecture-plan.md) | Full architecture design |
| [`UI/src/types/index.ts`](UI/src/types/index.ts) | All TypeScript types |
| [`UI/src/context/GameContext.tsx`](UI/src/context/GameContext.tsx) | Game state management |
| [`UI/src/context/SessionContext.tsx`](UI/src/context/SessionContext.tsx) | Session state management |
| [`UI/src/data/characters/index.ts`](UI/src/data/characters/index.ts) | Character registry barrel (179 characters) |
| [`UI/src/data/characters/_nightOrder.ts`](UI/src/data/characters/_nightOrder.ts) | Night order derivation + structural entries |
| [`docs/milestones/3 - tokens, breadcrumbs, characterModal, errorCheckpoints/milestone3.md`](docs/milestones/3 - tokens, breadcrumbs, characterModal, errorCheckpoints/milestone3.md) | Current pending feedback items |

## Testing Requirements

### Policy: Every File Gets Tests
- Every new `.ts` or `.tsx` file must have a corresponding `.test.ts` or `.test.tsx` file with meaningful tests
- Every milestone must include tests for its changes, or confirm existing tests cover the changes
- Run `cd UI && npm test` before completing any code task — all tests must pass

### Exceptions
- Individual character data files in `UI/src/data/characters/` — covered by the structural validation test in [`characterData.test.ts`](UI/src/data/characters/characterData.test.ts) which auto-validates all characters
- Pure re-export barrel files (e.g., `index.ts` that only re-exports)
- Character `setupModification`/`storytellerSetup` behavior tests — deferred until those fields have game-state actions

### Test Patterns
- **Unit tests**: `vitest` with `jsdom` environment, `@testing-library/react` for components
- **Factory helpers**: Create `make*()` functions for test data (see existing tests for patterns)
- **Context testing**: Use `renderHook()` with Provider wrapper for hook/context tests
- **Component testing**: Basic render test + key props test + interaction tests for interactive components
- **Character validation**: The structural validation test in `characterData.test.ts` dynamically validates all characters — adding new characters automatically includes them

### Storybook Requirements
- Visual components must have Storybook stories (`.stories.tsx`)
- Interactive components should have `play()` interaction tests in stories
- Use responsive viewport variants for layout-critical components
- Stories should have JSDoc comments explaining each scenario

### Running Tests
| Command | Purpose |
|---------|---------|
| `cd UI && npm test` | Run all tests (fast, no coverage) |
| `cd UI && npm run test:watch` | Watch mode (development) |
| `cd UI && npm run test:coverage` | Run with coverage report + threshold enforcement (pre-push) |
| `cd UI && npx tsc --noEmit` | TypeScript compilation check (0 errors required) |
| `cd UI && npx eslint .` | Lint check (0 errors required) |
| `cd UI && npx storybook dev` | Run Storybook for visual testing |

### Development Checklist

Before completing any code task (using `attempt_completion`), agents **MUST** run and pass all four:

0. `npm run install:all` — Install all dependencies (must be the first action on any new task)
1. `cd UI && npx tsc --noEmit` — TypeScript compilation (0 errors)
2. `cd UI && npx eslint .` — Linting (0 errors)
3. `cd UI && npm test` — All tests pass

The pre-push hook enforces test coverage thresholds automatically, but **linting and TypeScript checks are the agent's responsibility** during development. See [`docs/testing.md`](docs/testing.md) for full details.

### Coverage Thresholds
Coverage is enforced via `vitest.config.ts` thresholds and the pre-push hook:
- Statements: 77% (baseline: 82.87%)
- Branches: 74% (baseline: 79.95%)
- Functions: 69% (baseline: 74.08%)
- Lines: 79% (baseline: 84.66%)

See [`docs/testing.md`](docs/testing.md) for comprehensive testing guidelines.

### Current Test Stats (as of M16 Complete)
- **2460 tests** across **57 test files** — all passing
- **18 story files** with **~90+ stories** including `play()` interaction tests
- **0 TypeScript errors**, **0 ESLint errors**

## Documentation Maintenance

### Policy: Keep Docs Updated After Every Milestone
When completing a milestone or significant task, agents **must** update the relevant documentation before finishing:

1. **Milestone doc** (`docs/milestones/<N> - <name>/milestone<N>.md`) — Add or update a `## Status: ✅ Complete` section at the top with:
   - Completion date
   - Brief summary of what was implemented
   - Key evidence (files changed, features added)

2. **Progress tracker** ([`docs/progress.md`](docs/progress.md)) — Update the milestone table:
   - Change status from `📋 Planned` or `🔄 In Progress` to `✅ Complete`
   - Add a link to the milestone doc in the Details column
   - Update the "Verification" section test counts if they changed
   - If the task is medium to large or complex, create a progress.md in the milestone folder to go into further details without bloating the [`docs/progress.md`](docs/progress.md).

3. **AGENTS.md stats** — If test counts, file counts, or coverage thresholds changed, update the relevant numbers in:
   - **Tech Stack** table (test count)
   - **Current Test Stats** section
   - **Coverage Thresholds** section (if thresholds were adjusted)

**Do not defer documentation updates.** They must be part of the same task or PR that completes the milestone work.

## Related Documentation

- [Progress Tracking](docs/progress.md) — what's done, what's in progress, what's next
- [Game Data Model](docs/game-model.md) — Session → Game → Player hierarchy and data shapes
- [UI Architecture](docs/ui-architecture.md) — component tree, routes, context providers
- [Night Phase System](docs/night-phase.md) — the core feature, in detail
- [BotC Domain Knowledge](docs/botc-domain.md) — Blood on the Clocktower game rules needed to understand this app

## First Steps on New Machine

1. `npm run install:all` — **mandatory first step**, installs root + UI + API dependencies (see [⚠️ MANDATORY FIRST STEP](#️-mandatory-first-step--run-before-anything-else) above)
2. `cd UI && npx tsc --noEmit` — check for TypeScript compilation errors
3. `cd UI && npx eslint .` — check for lint errors
4. `cd UI && npm test` — check test status
5. `npm run dev` (from `StorytellerCards/`) — run and manually test in browser
6. Read [`progress.md`](docs/progress.md) for what was interrupted and what needs attention
