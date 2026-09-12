# Milestone 45 — Traveller Seat Management

## Status: ✅ Complete

**Implementation date:** 2026-09-11

Traveller arrival and departure are once again clear, persistent Game View
workflows. A Storyteller can add an existing roster player or create a
roster-only identity, choose any Traveller with script Travellers listed first,
set alignment, and place the Traveller into an empty or new seat. A departing
Traveller can leave an empty seat behind or remove the occupied seat entirely.
These operations work before or during a game without changing the session's
default lineup.

## Goal

Restore the Traveller lifecycle that became difficult to discover after the
legacy Town Square add-player control was removed during seating-model
integration. Keep Traveller membership game-specific while preserving stable
session identities and flexible seat management.

## Design

### Arrival

The Game View AppBar provides a persistent **Add Traveller** action independent
of the selected tab, seating edit mode, or game phase. The dialog supports:

- Selecting an existing roster player who is not already in the game.
- Creating a new session identity without adding that player to the default
  lineup or seating template.
- Selecting only Traveller characters.
- Listing script Travellers first in script order, then all remaining
  Travellers alphabetically.
- Showing each Traveller's icon and short ability description.
- Excluding Traveller characters that are already in play.
- Choosing Good or Evil alignment.
- Selecting any empty seat, with the first empty seat as the default, or adding
  a new seat when needed.

`GameContext.addTraveller` validates and applies participant membership,
character state, alignment, and seat occupancy atomically.

### Departure

Traveller actions in both Town Square and Players views provide two explicit
choices:

- **Remove Traveller** removes game membership and character state while
  preserving the now-empty seat.
- **Remove Traveller and Seat** removes game membership, character state, and
  the occupied seat.

Both choices preserve the session roster identity so a Traveller can return
later.

### Persistence

Session persistence now tracks the session objects that actually changed
instead of syncing only `activeSessionId`. Exact remote snapshots are still
suppressed to avoid API echoes, but a local edit batched with hydration—or an
edit made after a route reload with no active session—is pushed normally.

## Task List

- [x] Investigate residual Traveller arrival and departure workflows.
- [x] Add a persistent Traveller arrival action to Game View.
- [x] Support existing roster players and inline roster-only identities.
- [x] Restrict character selection to Travellers.
- [x] Prioritize script Travellers before remaining Travellers.
- [x] Show Traveller icons and short descriptions in the character picker.
- [x] Prevent multiple players from selecting the same Traveller character.
- [x] Support explicit Good and Evil alignment.
- [x] Fill an empty seat or append a new seat.
- [x] Support departure with either seat preservation or seat removal.
- [x] Keep Traveller membership game-specific and preserve roster identities.
- [x] Fix session synchronization for local edits immediately after hydration.
- [x] Add unit, component, Storybook, and lifecycle E2E coverage.

## Validation

- [x] ESLint: 0 errors.
- [x] Application TypeScript compilation: 0 errors.
- [x] Vite production build: successful.
- [x] UI unit tests: 4,385 passed and 3 skipped across 101 discovered test files.
- [x] Storybook interaction tests: 233 stories across 30 story files.
- [x] Traveller lifecycle Playwright scenario, including API persistence and
  reload restoration.

## Acceptance Criteria

- [x] Add Traveller remains visible from Game View before and during play.
- [x] A Traveller can use an existing roster identity or a newly created one.
- [x] Inline Traveller creation does not modify the default lineup or template.
- [x] Script Travellers appear first and all other Travellers remain available.
- [x] Traveller options show an icon and short ability description.
- [x] Traveller characters already in play cannot be selected again.
- [x] A Traveller can occupy an existing empty seat or a newly appended seat.
- [x] A Traveller can leave while preserving or removing the occupied seat.
- [x] A departed Traveller can return using the preserved roster identity.
- [x] Arrival and departure persist through the Go API and page reloads.
