/**
 * Default factory helpers for the new M41 per-player game state.
 *
 * Mirrors the defaults previously inlined on `PlayerSeat` rows when adding a new
 * player to a game (see legacy `GameContext.addPlayer`).
 */

import { Alignment, type PlayerGameState } from '../../types/index.ts';

/** Construct a fresh, "empty" per-player state for a newly-added participant. */
export function makeDefaultPlayerGameState(): PlayerGameState {
  return {
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    tokens: [],
    apparentCharacterId: '',
    alignmentHistory: [],
    // gainedAbility is intentionally omitted; set when a Cannibal/Philo/etc fires.
  };
}
