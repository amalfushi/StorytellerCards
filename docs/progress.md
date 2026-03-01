# Storyteller Cards — Progress Tracking

> Last updated: 2026-03-01

## Milestone Overview

| Milestone | Description | Status | Details |
|-----------|------------|--------|---------|
| M0 | Project scaffolding, data layer, core UI, night flashcards, Go API, polish | ✅ Complete | [details](milestone0/progress.md) |
| M1 | Code quality, testing, dev tooling, documentation | ✅ Complete | [details](milestone0/progress.md) |
| M2 | Bug fixes, character assignment, script importing | ✅ Complete | [details](milestone2/progress.md) |
| M3 | Night phase improvements, token system, script builder, UI polish | ✅ Complete | [details](milestone3/progress.md) |
| M4 | Multi-demon support | 📋 Planned | — |
| M5 | Jinxes | 📋 Planned | — |
| M6 | Character file restructuring (individual .ts files, wiki scraping) | 📋 Planned | — |

## Key Design Decisions

- **Multi-demon support** → deferred to M4
- **Jinxes** → deferred to M5
- **Character file restructuring** (individual .ts files, wiki scraping) → deferred to M6
- **Simple Day/Night toggle** — Dawn/Dusk removed in M3 (don't add value)
- **Drunk vs Poisoned distinguished** — different sources, different clearing logic
- **Exile vs execution** — functionally same but both terms retained

## Verification (as of M3 completion)

- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- Tests: 48/48 passing (5 test files)
