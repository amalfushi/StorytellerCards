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
npm run install:all   # Install root + UI + API dependencies
npm run dev           # UI (localhost:5173) + API (localhost:3001)
npm test              # Run all tests
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

Before completing any code task, agents **MUST** ensure all quality checks pass. Many of these are automated by git hooks — understand what's automated so you don't waste time running checks manually.

#### Automated by Git Hooks (do NOT run manually)

These run automatically and will block your commit/push if they fail:

| Hook | What It Does | When |
|------|-------------|------|
| **Pre-commit** | `lint-staged` (ESLint fix + Prettier on staged `.ts`/`.tsx` files) | Every `git commit` |
| **Pre-commit** | `tsc --noEmit` (TypeScript compilation check) | Every `git commit` with UI changes |
| **Pre-commit** | `go vet` | Every `git commit` with API changes |
| **Pre-push** | `npm run test:coverage` (all tests + coverage threshold enforcement) | Every `git push` |
| **Pre-push** | Auto-commits `coverage-final.json` if changed | Every `git push` |

> ❌ Do **not** manually run `npm run test:coverage` — the pre-push hook does this.
> ❌ Do **not** manually commit `coverage-final.json` — the pre-push hook auto-commits it.
> ❌ Do **not** manually run `go vet` — the pre-commit hook does this.

#### What Agents Should Do During Development

1. `npm run install:all` — **First action on any new task** (mandatory)
2. `cd UI && npm test` — Run frequently as a **fast sanity check** during development to catch regressions early. This is the fast no-coverage version. The pre-push hook will run the full coverage version automatically.

> **There is no GitHub Actions CI.** All quality gates are local git hooks only. Do not look for or reference CI status on PRs.

### Coverage Thresholds
Coverage is enforced via `vitest.config.ts` thresholds and the pre-push hook:
- Statements: 77% (baseline: 82.87%)
- Branches: 74% (baseline: 79.95%)
- Functions: 69% (baseline: 74.08%)
- Lines: 79% (baseline: 84.66%)

See [`docs/testing.md`](docs/testing.md) for comprehensive testing guidelines.

### Current Test Stats (as of M18 Complete)
- **2515 tests** across **57 test files** — all passing
- **18 story files** with **~93+ stories** including `play()` interaction tests
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

## Parallel Agent Workflow

This project supports **multiple agents working on different milestones in parallel** using git worktrees. Each milestone gets its own worktree, branch, and PR.

### Worktree Setup

Each milestone should be developed in its own worktree to avoid interfering with other agents:

```bash
# From the main checkout directory (e.g., D:\StorytellerCards\StorytellerCards)
git worktree add ../worktree-m18 -b m18/traveller-fabled-loric main
cd ../worktree-m18
npm run install:all    # MANDATORY — worktrees start without node_modules
```

- **Worktree directory**: `../worktree-m<N>` (sibling of main checkout)
- **Branch**: created automatically from `main` by the `git worktree add` command
- Always run `npm run install:all` immediately after creating a worktree

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Milestone work | `m<N>/<kebab-case-description>` | `m18/traveller-fabled-loric` |
| Docs-only changes | `docs/<description>` | `docs/update-progress` |
| Bug fixes | `fix/<description>` | `fix/night-card-index` |

### PR Workflow

1. **One milestone = one branch = one PR** — do not combine milestones
2. Push branch to remote: `git push -u origin m<N>/<branch-name>`
3. Create PR with title: `feat(M<N>): <Short Description>`
   - Example: `feat(M18): Traveller, Fabled & Loric Integration`
4. PR body should reference the milestone doc: `See docs/milestones/<N>/milestone<N>.md`
5. PRs target `main`

### Cleaning Up Worktrees

After a PR is merged:

```bash
# From the main checkout
git worktree remove ../worktree-m18
git branch -d m18/traveller-fabled-loric
```

## Conflict Avoidance

When multiple agents work in parallel, merge conflicts are inevitable on certain files. Follow these guidelines to minimize them.

### High-Conflict Files

These files are commonly touched by every milestone and are the primary source of merge conflicts:

| File | Why It Conflicts | Mitigation |
|------|-----------------|------------|
| `AGENTS.md` | Test stats, coverage thresholds updated per milestone | Update stats in a single block at the end; keep changes minimal |
| `docs/progress.md` | Milestone status table | Only update your milestone's row + verification section |
| `UI/src/types/index.ts` | New types added per milestone | **Append new types at the end of the file** — never insert in the middle |
| `UI/src/context/GameContext.tsx` | New reducer actions per milestone | **Add new actions at the end of the switch statement** |
| `UI/src/pages/GameViewPage.tsx` | Top-level orchestrator, new tabs/views | Coordinate with other agents if touching this file |
| `UI/coverage/coverage-final.json` | Auto-generated on every push | Always conflicts — resolve by accepting either version and re-pushing |

### Milestone-Level Documentation Strategy

To minimize conflicts on shared documentation files:

1. **Each milestone MUST have its own `progress.md`** in `docs/milestones/<N> - <name>/progress.md` for granular status updates. This is conflict-free since each milestone has its own folder.
2. **Root `docs/progress.md`** should only receive a **single row update** to the milestone table + minimal verification stat changes. Keep this minimal to reduce conflicts.
3. **All documentation updates** (milestone docs, progress, AGENTS.md stats) **MUST be part of the same branch/PR** as the milestone work — no follow-up PRs.

### General Conflict Reduction Rules

- **Don't modify files outside your milestone's scope** — if a file isn't listed in your milestone plan, don't touch it
- **Append-only edits** on shared files — add new types, actions, and entries at the end rather than inserting in the middle
- **Pull latest `main` and rebase** before creating a PR: `git pull --rebase origin main`
- **Conflict resolution**: if conflicts occur on PR merge, the human will resolve them — agents should not force-push or rebase shared branches without coordination
