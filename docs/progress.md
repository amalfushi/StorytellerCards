# Storyteller Cards — Progress Tracking

> Last updated: 2026-03-04

## Milestone Overview

| Milestone | Description | Status | Details |
|-----------|------------|--------|---------|
| M0 | Project scaffolding, data layer, core UI, night flashcards, Go API, polish | ✅ Complete | [details](milestones/1 - initial app setup/progress.md) |
| M1 | Code quality, testing, dev tooling, documentation | ✅ Complete | [details](milestones/1 - initial app setup/progress.md) |
| M2 | Bug fixes, character assignment, script importing | ✅ Complete | [details](milestones/2 - basic botc setup/progress.md) |
| M3 | Night phase improvements, token system, script builder, UI polish | ✅ Complete (+ Feedback Rounds 1 & 2) | [details](milestones/3 - tokens, breadcrumbs, characterModal, errorCheckpoints/progress.md) |
| M4 | Multi-demon support | 📋 Planned | — |
| M5 | Jinxes | 📋 Planned | — |
| M6 | Character data restructuring (individual .ts files, declarative night choices) | ✅ Complete | [details](milestones/6 - character restructuring/progress.md) |
| M7 | Testing Improvements | ✅ Complete (Phases 1-5) | [details](milestones/7 - testing improvements/milestone7.md) |

## Key Design Decisions

- **Multi-demon support** → deferred to M4
- **Jinxes** → deferred to M5
- **Character data restructured in M6** — individual `.ts` files per character, night order derived from character definitions via `buildNightOrder()`, declarative `NightChoice` schema replaces regex parsing
- **Simple Day/Night toggle** — Dawn/Dusk removed in M3 (don't add value)
- **Drunk vs Poisoned distinguished** — different sources, different clearing logic
- **Exile vs execution** — functionally same but both terms retained

## Verification (as of M7 Complete)

- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- Tests: 1187/1187 passing (54 test files)
- Coverage: Stmts 82.87%, Branch 79.95%, Funcs 74.08%, Lines 84.66% (thresholds enforced)
- Storybook: 17 story files with ~80+ stories including `play()` interaction tests
