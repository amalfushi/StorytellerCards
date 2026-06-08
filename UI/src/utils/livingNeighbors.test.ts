import { describe, expect, it } from 'vitest';
import type { Player, PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import { findLivingNeighbors } from './livingNeighbors.ts';

function makeState(
  characterId: string,
  alive = true,
  actualAlignment: Alignment = Alignment.Good,
): PlayerGameState {
  return {
    characterId,
    alive,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment,
    startingAlignment: actualAlignment,
    activeReminders: [],
    tokens: [],
  };
}

function makeTable(
  players: Array<{
    id: PlayerId;
    name: string;
    characterId: string;
    alive?: boolean;
    alignment?: Alignment;
  }>,
): { slots: Slot[]; playerState: Record<PlayerId, PlayerGameState>; sessionPlayers: Player[] } {
  return {
    slots: players.map((player, index) => ({
      kind: 'seat',
      id: `slot-${index + 1}`,
      playerId: player.id,
    })),
    playerState: Object.fromEntries(
      players.map((player) => [
        player.id,
        makeState(player.characterId, player.alive ?? true, player.alignment ?? Alignment.Good),
      ]),
    ),
    sessionPlayers: players.map((player) => ({ id: player.id, name: player.name })),
  };
}

describe('findLivingNeighbors', () => {
  it('returns no neighbors when everyone else is dead', () => {
    const { slots, playerState, sessionPlayers } = makeTable([
      { id: 'player-1', name: 'Player 1', characterId: 'cultleader' },
      { id: 'player-2', name: 'Player 2', characterId: 'noble', alive: false },
      { id: 'player-3', name: 'Player 3', characterId: 'noble', alive: false },
    ]);

    expect(findLivingNeighbors(slots, playerState, sessionPlayers, 'player-1')).toEqual([]);
  });

  it('deduplicates the same neighbor at a two-player table', () => {
    const { slots, playerState, sessionPlayers } = makeTable([
      { id: 'player-1', name: 'Player 1', characterId: 'cultleader' },
      { id: 'player-2', name: 'Player 2', characterId: 'noble', alignment: Alignment.Evil },
    ]);

    expect(findLivingNeighbors(slots, playerState, sessionPlayers, 'player-1')).toEqual([
      {
        playerId: 'player-2',
        displaySeat: 2,
        playerName: 'Player 2',
        characterId: 'noble',
        actualAlignment: Alignment.Evil,
      },
    ]);
  });

  it('walks outward on each side skipping dead players', () => {
    const { slots, playerState, sessionPlayers } = makeTable([
      { id: 'player-1', name: 'Player 1', characterId: 'cultleader' },
      { id: 'player-2', name: 'Player 2', characterId: 'noble', alive: false },
      { id: 'player-3', name: 'Player 3', characterId: 'noble' },
      { id: 'player-4', name: 'Player 4', characterId: 'noble', alignment: Alignment.Evil },
    ]);

    expect(findLivingNeighbors(slots, playerState, sessionPlayers, 'player-1')).toEqual([
      {
        playerId: 'player-4',
        displaySeat: 4,
        playerName: 'Player 4',
        characterId: 'noble',
        actualAlignment: Alignment.Evil,
      },
      {
        playerId: 'player-3',
        displaySeat: 3,
        playerName: 'Player 3',
        characterId: 'noble',
        actualAlignment: Alignment.Good,
      },
    ]);
  });

  it('returns no neighbors when the source player is not seated', () => {
    const { slots, playerState, sessionPlayers } = makeTable([
      { id: 'player-1', name: 'Player 1', characterId: 'cultleader' },
      { id: 'player-2', name: 'Player 2', characterId: 'noble' },
    ]);

    expect(findLivingNeighbors(slots, playerState, sessionPlayers, 'player-99')).toEqual([]);
  });
});
