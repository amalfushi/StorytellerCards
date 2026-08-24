# Milestone 43 Progress

## Current status

**In progress — foundation implemented**

The exhaustive regular-character audit and milestone design are complete. The
first implementation slice adds a canonical exceptional-character draft-rule
registry and a pure, memoized feasibility engine.

## Completed

- Audited all 138 regular Townsfolk, Outsiders, Minions, and Demons.
- Classified count modifiers, setup modes, dependencies, incompatibilities,
  repeated roles, hidden identities, information rules, and seating rules.
- Documented the approved exact-solver and weighted-generation hybrid.
- Added canonical rules for the initial set of exceptional characters.
- Added exact completion, legal candidate, and mulligan candidate helpers.
- Added focused tests for counts, modifiers, modes, dependencies, duplicates,
  incompatibilities, deterministic candidate ordering, and mulligan exclusion.

## Next

1. Extend property coverage across representative scripts and player counts.
2. Add persistent draft state to the game and API models.
3. Build the Storyteller draft board and candidate setup ensemble.
4. Add the private three-column player draft and mandatory mulligan flow.
5. Add constrained post-draft seating and ordered setup disclosures.
