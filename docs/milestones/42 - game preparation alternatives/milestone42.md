# Milestone 42 — Option 3: Town Square Edit Seating

## Status: ✅ Complete

**Completion date:** 2026-08-23

**Summary:** Option 3 is implemented as the selected game-preparation workflow.
The Town Square now has an explicit
Edit Seating mode with draft/review/save safety, mobile tap controls alongside
dragging, participant parking, focused player participation/assignment, and
separate character selection/assignment entry points. First Night now enforces
valid game-specific seating and concise confirmation without making earlier
planning invasive.

**Decision status:** Option 3 was selected as the most intuitive of the four M42
alternatives and promoted from prototype to the completed implementation.

See [`proposal.md`](proposal.md) for the four evaluated alternatives, Mermaid
flows, comparison matrix, and final decision record.

## Product behavior

- [x] Keep session roster, game participants, selected characters, character assignments, and seating distinct.
- [x] Persist an explicit session default lineup for new games while preserving per-game divergence.
- [x] Allow game creation, participation, character selection, and assignment without valid seating.
- [x] Require valid seating only for the first transition into live play/Night flashcards.
- [x] Confirm valid inherited seating once per game before first start.
- [x] Route invalid first-start seating directly to Town Square Edit Seating.
- [x] Invalidate pre-game confirmation after lineup or seating changes.
- [x] Keep active-game seating corrections outside the pre-game gate.
- [x] Preserve session-template/other-game propagation controls.

## Option 3 UX

- [x] Add a visually distinct Edit Seating action directly on Town Square.
- [x] Support seat reorder, add/remove seats and spacers, storyteller marker, parking, and seat assignment.
- [x] Provide touch-safe clockwise/counterclockwise controls as a drag alternative.
- [x] Open a focused bottom sheet when a roster player is selected.
- [x] Manage game participation, Traveller status, and assignment from the focused sheet.
- [x] Keep Character Selection a separate preparation action.
- [x] Stage changes locally and require review/save before they become live.
- [x] Keep the editor usable before play and for corrections during play.

## Verification

- [x] Seating validation utility covers empty, duplicate, non-participant, and missing-roster cases.
- [x] Context tests cover participant inheritance, atomic draft save, confirmation invalidation, and active-game correction behavior.
- [x] Component tests cover draft safety, focused participation, assignment, and preparation-stage navigation.
- [x] Storybook includes a mobile editor story and focused-sheet interaction test.
- [x] Lifecycle E2E covers invalid seating repair and first-start confirmation.
- [x] Full-stack lifecycle E2E covers session seating, game inheritance, apply-to-all propagation, game-only overrides, API-backed refresh, and game-specific Travellers.
- [x] API-restored player state preserves sibling-game propagation until the storyteller makes a meaningful lineup or player-state change.
- [x] API synchronization accepts successful 204 No Content deletion responses without attempting JSON parsing.
- [x] TypeScript, ESLint, UI unit, Storybook interaction, API, roundtrip, and lifecycle E2E checks pass.

## Code review follow-ups

- [x] Propagate seating drafts only to compatible, unstarted sibling games.
- [x] Disable sibling propagation whenever the draft changes participants or player state.
- [x] Prevent Character Assignment until Character Selection has created a non-empty game pool.
- [x] Clear stale apparent-character state when focused assignment leaves a concealment role.
- [x] Replace implicit previous-game lineup inheritance with editable persisted `defaultParticipantIds`.
- [x] Preserve target participants, parked players, and player state when applying seating templates.
- [x] Prevent individual and bulk template application from rewriting any started game.
- [x] Share assignment copy limits with the focused Town Square player sheet.
- [x] Offer script Traveller roles when the focused participant is a Traveller.
