# Storyteller Cards

**Blood on the Clocktower Storyteller helper** — a mobile-first web app that guides Storytellers through night phases, tracks game state, and manages player seating.

## Quick Start

```bash
cd StorytellerCards
npm install          # install concurrently (root)
cd UI && npm install # install UI dependencies
cd ..

npm run dev          # starts both UI (Vite) and API (Go) concurrently
```

The UI runs at **http://localhost:5173** and the API at **http://localhost:3001**.

## Monorepo Structure

```
StorytellerCards/
├── UI/              # React + TypeScript + Vite frontend
├── API/             # Go (Chi) REST API backend
├── .husky/          # Git hooks (pre-commit, pre-push)
├── package.json     # Root scripts (dev, test via concurrently)
└── README.md        # This file
```

## Tech Stack

| Layer    | Technology                                       |
|----------|--------------------------------------------------|
| Frontend | React 19, TypeScript, Vite 7, MUI 7              |
| Backend  | Go 1.25, Chi v5, JSON file-based storage          |
| Testing  | Vitest + Testing Library (UI), Go `testing` (API) |
| Tooling  | ESLint, Prettier, Husky, lint-staged, Storybook   |

## Scripts

| Command          | Description                                     |
|------------------|-------------------------------------------------|
| `npm run dev`    | Start UI dev server + API server concurrently   |
| `npm run dev:ui` | Start only the UI dev server                    |
| `npm run dev:api`| Start only the Go API server                    |
| `npm test`       | Run UI + API tests concurrently                 |
| `npm run test:ui`| Run only UI tests (Vitest)                      |
| `npm run test:api`| Run only Go tests                              |

## Git Hooks

- **pre-commit**: Detects which directories (UI/API) have staged changes and runs lint-staged or `go vet` accordingly.
- **pre-push**: Detects which directories have changes and runs the appropriate test suites before pushing.

## Sub-READMEs

- [UI README](UI/README.md) — React app architecture, components, testing
- [API README](API/README.md) — Go API endpoints, storage, deployment
