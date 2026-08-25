# Milestone 43 Progress

## Current status

**Implementation complete — ready for deployment and playtesting**

Character drafting is now integrated into regular game setup as well as the
standalone simulator. Draft progress persists on the game and through the Go
API, player-visible identities remain separate from actual roles, and completed
drafts atomically assign characters and randomize seating.

The supported deployment scope includes Standard, Atheist, Legion, Lil'
Monsta, and Summoner setups. Kazali remains intentionally unavailable because
its hidden post-draft Minion-conversion phase is not implemented.

## Completed

- Audited all 138 regular Townsfolk, Outsiders, Minions, and Demons.
- Classified count modifiers, setup modes, dependencies, incompatibilities,
  repeated roles, hidden identities, information rules, and seating rules.
- Documented the approved exact-solver and weighted-generation hybrid.
- Added canonical rules for the initial set of exceptional characters.
- Added exact completion, legal candidate, and mulligan candidate helpers.
- Added focused tests for counts, modifiers, modes, dependencies, duplicates,
  incompatibilities, deterministic candidate ordering, and mulligan exclusion.
- Added adaptive generation: three choices plus mulligan when possible, reduced
  choices under solver pressure, and one mandatory character as the final
  legal fallback.
- Added open, secret-single-type, and secret-two-type presentation modes.
- Added the reusable three-column slot-machine presentation and mandatory
  one-column mulligan flow.
- Added `/tools/character-draft` with official base scripts, custom JSON import,
  player-count and setup-mode controls, simulated choices, and Storyteller
  diagnostics.
- Excluded Travellers, Fabled, and Loric characters from all draft pools.
- Added persisted TypeScript and Go draft-state models and API roundtrip support.
- Added the regular-game setup choice, Storyteller board, and private
  physical-device handoff.
- Added actual/apparent identity masking for Drunk, Lunatic, and Marionette.
- Blocked drafts when a hidden role cannot be given a safe, unique false
  identity instead of exposing its actual role.
- Added atomic final assignment, setup-only Lil' Monsta tracking, and Atheist
  bluff-flow handling.
- Added representative persisted-flow coverage for Legion, Summoner, and Lil'
  Monsta.
- Added constrained randomized seating for Marionette, Lord of Typhon, and No
  Dashii, with secret manual repair fallback.
- Consolidated the duplicate pre-game character actions to one
  **Select Characters** action.
- Gated Kazali in production and the simulator until its hidden post-draft
  Minion-conversion workflow exists.
- Preserved the existing setup checklist, first-night reveal flow, Lunatic
  bluff flow, and mandatory seating confirmation after draft completion.
- Added a regular-game lifecycle test covering private handoff, mulligan
  animation, reload/resume, final assignment, persistence, and continuation to
  Demon bluffs.
- Passed the focused UI suite (150 tests), Storybook interaction tests and
  production build, full Go API suite, app TypeScript build, and both drafting
  and manual-selection lifecycle E2E paths.

## Known deployment boundaries

- Lil' Monsta with Marionette falls back to secret Storyteller seating repair
  because no player is the Demon until the Lil' Monsta babysitter is chosen.
- Kazali is excluded from draft-mode selectors rather than offering a partial
  or misleading workflow.
- The root aggregate build still reports the repository's pre-existing
  `vitest.config.ts` project-configuration type errors; the app TypeScript and
  Vite builds pass independently.

## Next

1. Deploy and playtest the supported modes.
2. Playtest offer-information leakage before adopting any deferred
   entropy/deadline controls.
3. Design Kazali's hidden conversion workflow before enabling it.
4. Consider persisting a Lil' Monsta babysitter assignment if automatic
   Marionette seating is required for that combination.
