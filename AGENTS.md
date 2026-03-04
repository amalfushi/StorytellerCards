# Storyteller Cards — AI Agent Context

> **Read this first.** This is the primary context file for any AI agent picking up this project.

## Project Overview

**Storyteller Cards** is a mobile-first React + Go application that helps *Blood on the Clocktower* Storytellers manage games. The core feature is **Night Phase Flashcards** — swipeable cards that guide the Storyteller through each character's night action in the correct order.

The app manages a hierarchy: **Sessions** (containers) → **Games** → **Players with Characters from Scripts**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript + Vite 6 + MUI Core (free tier) |
| State | React Context + `useReducer` + `localStorage` (primary), Go API (secondary sync) |
| Testing | Vitest (52 unit tests), Storybook 8 (75+ stories) |
| Code Quality | ESLint 9 flat config + Prettier + Husky (pre-commit lint, pre-push tests) |
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

## Related Documentation

- [Progress Tracking](docs/progress.md) — what's done, what's in progress, what's next
- [Game Data Model](docs/game-model.md) — Session → Game → Player hierarchy and data shapes
- [UI Architecture](docs/ui-architecture.md) — component tree, routes, context providers
- [Night Phase System](docs/night-phase.md) — the core feature, in detail
- [BotC Domain Knowledge](docs/botc-domain.md) — Blood on the Clocktower game rules needed to understand this app

## First Steps on New Machine

1. `cd StorytellerCards && npm install && cd UI && npm install`
2. `cd UI && npx tsc --noEmit` — check for TypeScript compilation errors
3. `cd UI && npx eslint .` — check for lint errors
4. `cd UI && npm test` — check test status
5. `npm run dev` (from `StorytellerCards/`) — run and manually test in browser
6. Read [`progress.md`](docs/progress.md) for what was interrupted and what needs attention
