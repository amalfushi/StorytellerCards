# Milestone 43 Progress

## Current status

**In progress — standalone simulator implemented**

The exhaustive regular-character audit and milestone design are complete. The
foundation now includes the exceptional-character rules, exact feasibility
engine, reusable draft-session workflow, and standalone simulator.

## Completed

- Audited all 138 regular Townsfolk, Outsiders, Minions, and Demons.
- Classified count modifiers, setup modes, dependencies, incompatibilities,
  repeated roles, hidden identities, information rules, and seating rules.
- Documented the approved exact-solver and weighted-generation hybrid.
- Added canonical rules for the initial set of exceptional characters.
- Added exact completion, legal candidate, and mulligan candidate helpers.
- Added focused tests for counts, modifiers, modes, dependencies, duplicates,
  incompatibilities, deterministic candidate ordering, and mulligan exclusion.
- Added reusable generation of three distinct choices plus a distinct
  precomputed mulligan, with explicit diagnostics when four legal branches are
  unavailable.
- Added the reusable three-column slot-machine presentation and mandatory
  one-column mulligan flow.
- Added `/tools/character-draft` with official base scripts, custom JSON import,
  player-count and setup-mode controls, simulated choices, and Storyteller
  diagnostics.

## Next

1. Extend property coverage across representative scripts and player counts.
2. Add persistent draft state to the game and API models.
3. Build the Storyteller draft board and candidate setup ensemble.
4. Integrate the reusable draft presentation into the private game workflow.
5. Add constrained post-draft seating and ordered setup disclosures.
