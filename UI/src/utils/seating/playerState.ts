/**
 * Default factory helpers for the new M41 per-player game state.
 *
 * Mirrors the defaults previously inlined on `PlayerSeat` rows when adding a new
 * player to a game (see legacy `GameContext.addPlayer`).
 */

import { Alignment, type PlayerGameState, type PlayerId } from '../../types/index.ts';

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

function comparablePlayerState(state: PlayerGameState) {
  return {
    characterId: state.characterId ?? '',
    alive: state.alive,
    ghostVoteUsed: state.ghostVoteUsed,
    visibleAlignment: state.visibleAlignment,
    actualAlignment: state.actualAlignment,
    startingAlignment: state.startingAlignment,
    activeReminders: state.activeReminders ?? [],
    tokens: state.tokens ?? [],
    apparentCharacterId: state.apparentCharacterId ?? '',
    alignmentHistory: state.alignmentHistory ?? [],
    gainedAbility: state.gainedAbility ?? null,
  };
}

/** Compare player state while treating API-omitted empty optional fields as defaults. */
export function arePlayerStatesEqual(
  left: Record<PlayerId, PlayerGameState>,
  right: Record<PlayerId, PlayerGameState>,
): boolean {
  const comparableEntries = (state: Record<PlayerId, PlayerGameState>) =>
    Object.entries(state)
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      .map(([playerId, playerState]) => [playerId, comparablePlayerState(playerState)]);

  return JSON.stringify(comparableEntries(left)) === JSON.stringify(comparableEntries(right));
}
