# Storyteller Cards — Progress Tracking

> Last updated: 2026-03-06

## Milestone Overview

| Milestone | Description | Status | Details |
|-----------|------------|--------|---------|
| M0 | Project scaffolding, data layer, core UI, night flashcards, Go API, polish | ✅ Complete | [details](milestones/1%20-%20initial%20app%20setup/progress.md) |
| M1 | Code quality, testing, dev tooling, documentation | ✅ Complete | [details](milestones/1%20-%20initial%20app%20setup/progress.md) |
| M2 | Bug fixes, character assignment, script importing | ✅ Complete | [details](milestones/2%20-%20basic%20botc%20setup/progress.md) |
| M3 | Night phase improvements, token system, script builder, UI polish | ✅ Complete (+ Feedback Rounds 1 & 2) | [details](milestones/3%20-%20tokens,%20breadcrumbs,%20characterModal,%20errorCheckpoints/progress.md) |
| M4 | Multi-demon support | 📋 Planned | — |
| M5 | Jinxes | 📋 Planned | — |
| M6 | Character data restructuring (individual .ts files, declarative night choices) | ✅ Complete | [details](milestones/6 - character restructuring/progress.md) |
| M7 | Testing Improvements | ✅ Complete (Phases 1-5) | [details](milestones/7 - testing improvements/milestone7.md) |
| M8 | Wiki scraping — populate remaining characters + download icons | ✅ Complete (M8.1 + M8.2) | [details](milestones/8%20-%20wiki%20scraping/progress.md) |
| M9 | Testing post character scraping — verify character data integrity & fix test issues | ✅ Complete | [details](milestones/9%20-%20testing%20post%20character%20scraping/progress.md) |
| M10 | Storybook Test Runner | ✅ Complete | [details](milestones/10%20-%20Storybook%20TestRunner/milestone%2010.md) |
| M11 | ScriptBuilder Performance | ✅ Complete | [details](milestones/11%20-%20scriptbuilder-perf/milestone11.md) |
| M12 | Storybook Test Expansion | 📋 Planned | — |
| M13 | Icon Replacement | ✅ Complete | [details](milestones/13%20-%20icon%20replacement/progress.md) |
| M14 | Night Flashcard UX | ✅ Complete | [details](milestones/14%20-%20night%20flashcard%20ux/progress.md) |
| M15 | Day/Night Tab Workflow | ✅ Complete | [details](milestones/15%20-%20day%20night%20tab%20workflow/milestone15.md) |
| M16 | Town Square Polish | ✅ Complete | [details](milestones/16%20-%20townsquare%20polish/milestone16.md) |
| M17 | List Views & Minor Fixes | ✅ Complete | [details](milestones/17%20-%20list%20views%20and%20minor%20fixes/milestone17.md) |

## Key Design Decisions

- **Multi-demon support** → deferred to M4
- **Jinxes** → deferred to M5
- **Character data restructured in M6** — individual `.ts` files per character, night order derived from character definitions via `buildNightOrder()`, declarative `NightChoice` schema on all characters
- **Wiki scraping in M8** — 136 new characters generated from BotC wiki XML dumps + nightOrder.json. 178 character icons downloaded from wiki (M8.2)
- **Simple Day/Night toggle** — Dawn/Dusk removed in M3 (don't add value)
- **Drunk vs Poisoned distinguished** — different sources, different clearing logic
- **Exile vs execution** — functionally same but both terms retained

## Verification (as of M17 Complete)

- TypeScript: 0 errors
- ESLint: 0 errors
- Tests: 2418/2418 passing (55 test files)
- Coverage: Stmts 82.87%, Branch 79.95%, Funcs 74.08%, Lines 84.66% (thresholds enforced)
- Storybook: 18 story files with ~90+ stories including `play()` interaction tests
- Go build: success
- Go tests: all passing
- Characters: 179 total (69 Townsfolk, 23 Outsiders, 27 Minions, 19 Demons, 14 Fabled, 18 Travellers, 9 Loric)
- Character icons: 179/179 downloaded, all rendered via `CharacterIconImage` component
