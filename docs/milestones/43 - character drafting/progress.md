# Milestone 43 Progress

## Current status

**Complete — ready for deployment and playtesting**

Character drafting is now integrated into regular game setup as well as the
standalone simulator. Draft progress persists on the game and through the Go
API, player-visible identities remain separate from actual roles, and completed
drafts atomically assign characters before entering an explicit randomized
seating review.

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
- Persisted hidden type plans for every unresolved player in secret modes.
  Plans regenerate after each selection and variable setup choice so the
  remaining rolls track the updated expected character counts.
- Added the reusable three-column slot-machine presentation and mandatory
  one-column mulligan flow.
- Added `/tools/character-draft` with official base scripts, custom JSON import,
  player-count and setup-mode controls, simulated choices, and Storyteller
  diagnostics.
- Excluded Travellers, Fabled, and Loric characters from all draft pools.
- Added persisted TypeScript and Go draft-state models and API roundtrip support.
- Added the regular-game setup choice, Storyteller board, and private
  physical-device handoff.
- Replaced fixed draft order with Storyteller-selected player pills. Undrafted
  players remain grey, the active player uses their stable session color, and
  completed players use the selected character type color.
- Strengthened private handoff with a full-screen opaque blurred backdrop,
  prominent player-color identification, and short ability descriptions for
  every offered and mulligan character.
- Reduced repeated wheel content and removed forced synchronous layout before
  spins. Private rolls now use white wheel surfaces, equal-height white ability
  panels, and separate explicit selection buttons against a black handoff.
- Removed React state updates from active wheel animation, memoized wheel trees,
  and added transition-cancellation and timeout settlement. A browser that
  omits `transitionend` can no longer leave the draft permanently spinning.
- Constrained every wheel, ability panel, and selection button to the same
  responsive 320px column width.
- Kept the mandatory mulligan result visible until the player explicitly
  accepts it.
- Added advisory setup-count chips. Variable setup modifiers and the desired
  Village Idiot copy count are requested only after the relevant character is
  selected, and further drafting pauses until the Storyteller chooses a
  still-feasible value.
- Added exact Village Idiot copy-target feasibility, a sequential three-player
  repeated-draft test, and increased follow-on presentation preference after a
  Village Idiot is selected.
- Corrected advisory Summoner counts to add one Townsfolk and remove the
  starting Demon.
- Moved slot-machine landing away from the terminal repeated strip so late
  script characters such as Lord of Typhon no longer make following rows
  briefly disappear.
- Added actual/apparent identity masking for Drunk, Lunatic, and Marionette.
- Made Marionette participation an explicit persisted Minion roll: one primary
  Minion player and one script Minion are selected at draft creation. A
  Marionette result forces that player's main illusion offer; any other result
  excludes Marionette from the game instead of repeatedly placing it in
  disposable mulligan slots.
- Applied that roll in open presentation mode as well as secret-type modes,
  reserved its future Minion slot against other players' choices, and displayed
  the affected player's warning icon immediately when the draft is generated.
- Applied the same controlled frequency model to Drunk and Lunatic. The draft
  conceptually draws and persists one unique script Outsider per Outsider slot,
  matching normal bag inclusion probability. Hidden results reserve distinct
  primary Outsider players and may coexist; unselected hidden Outsiders are
  excluded. Later count modifiers extend the persisted draw without rerolling
  earlier results. Existing single-roll drafts migrate without changing their
  original result.
- Changed hidden-role offers into complete forced illusions: all three choices
  and the mulligan are unique randomized apparent identities that secretly
  resolve to the same actual role. Drunk sees only Townsfolk, Lunatic sees only
  Demons, and Marionette sees only Townsfolk or Outsiders; Drunk and Lunatic
  are excluded from Marionette's pool, and Lunatic is excluded from Drunk's.
- Extended the standalone simulator with an explicit hidden-character test for
  Drunk, Lunatic, and Marionette. It forces the selected role into Player 1's
  offer while exercising the production Storyteller warning, private handoff,
  and secret actual-character resolution flow. Apparent choices are sampled
  randomly rather than taking the first eligible characters in script order.
- Added prominent Storyteller-board warnings for false-identity offers. The
  affected player pill carries a warning icon, while the active **Drafting
  now** panel uses blaring error styling and shows the hidden character's icon
  plus its actual-versus-apparent identity. Private handoff remains one click,
  and the player roller never renders the hidden identity.
- Blocked drafts when a hidden role cannot be given a safe, unique false
  identity instead of exposing its actual role.
- Added atomic final assignment, setup-only Lil' Monsta tracking, and Atheist
  bluff-flow handling.
- Added representative persisted-flow coverage for Legion, Summoner, and Lil'
  Monsta.
- Added constrained randomized seating for Marionette, Lord of Typhon, and No
  Dashii, with secret manual repair fallback.
- Added an explicit post-draft seating review and editable Town Square step.
  Demon bluffs do not open until the Storyteller confirms the final seating.
- Added full assigned-character portraits, actual/apparent labels flanked by
  seating reorder controls, and constrained re-randomization to the editable
  seating review.
- Consolidated the duplicate pre-game character actions to one
  **Select Characters** action.
- Gated Kazali in production and the simulator until its hidden post-draft
  Minion-conversion workflow exists.
- Preserved the existing setup checklist, first-night reveal flow, Lunatic
  bluff flow, and mandatory seating confirmation after draft completion.
- Added a regular-game lifecycle test covering Storyteller-selected turns,
  private handoff, mulligan animation and acceptance, reload/resume, final
  assignment, persistence, editable randomized-seating review, seating
  confirmation, and delayed Demon bluffs.
- Added a seven-player Boozling regression that carries a draft through all
  seven legal selections without blocking.
- Fixed a saved-game corruption path where pre-generated unresolved offers
  were implicitly promoted after another player resolved. Drafts now require
  an explicitly active player, regenerate that player's offer against all
  committed characters, and reject stale offers during resolution. This
  prevents duplicate unique characters and excess Demons from bypassing the
  exact-feasibility solver.
- Bound each private handoff to its active player and draft revision. If local
  or remote synchronization replaces that offer while the handoff is open,
  stale callbacks now close safely with a Storyteller warning instead of
  throwing or resolving against another player. Resolution is also locked
  after the first submission.
- Made API data-root discovery independent of whether the server starts from
  the repository root, `API`, or `API/cmd/server`, with an explicit
  `STORYTELLER_DATA_DIR` override for deployments.
- Corrected the primary VS Code Chrome launch to start the root full-stack
  task instead of Vite alone. UI-only and full-stack Go-debug launches remain
  available under explicit names.
- Removed the Game View fallback that silently substituted the entire
  character registry when a script request failed. Character setup now stops
  with an actionable error instead of creating an invalid oversized draft.
- Added an explicit no-script drafting mode that uses every regular character
  while preserving the load error for games that reference a missing script.
  Empty blocked drafts created by the old no-script behavior recover
  automatically when reopened with the feasible full registry.
- Added a private post-selection confirmation screen showing only the player's
  apparent character. The Storyteller board remains hidden until the player
  explicitly confirms that the device is being handed back.
- Kept controlled hidden-character reservations pinned to the exact legal
  completion profile during replanning. Future count modifiers such as
  Godfather can no longer make a pending Lunatic lose its Outsider type plan
  or disappear from the Storyteller warning when another player is selected.
- Added a deployable script catalog split into `production` and `test`.
  Production contains the three official base scripts and milestone scripts;
  integration-only scripts live under `test`. Production lookup takes
  precedence while legacy flat script files remain readable.
- Passed 4,350 UI tests with 3 skipped across 99 discovered files, 231 Storybook interaction tests
  across 29 files, the full Go API suite, app TypeScript check, Vite
  production build, and the complete drafting lifecycle E2E path.

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
