import { describe, expect, it } from 'vitest';
import { Alignment, type PlayerSeat } from '@/types/index.ts';
import { findLivingNeighbors } from './livingNeighbors.ts';

function seat(seatNumber: number, alive = true, actualAlignment = Alignment.Good): PlayerSeat {
  return {
    seat: seatNumber,
    playerName: `Player ${seatNumber}`,
    characterId: seatNumber === 1 ? 'cultleader' : 'noble',
    alive,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment,
    startingAlignment: actualAlignment,
    activeReminders: [],
    isTraveller: false,
  };
}

describe('findLivingNeighbors', () => {
  it('returns no neighbors when everyone else is dead', () => {
    expect(findLivingNeighbors([seat(1), seat(2, false), seat(3, false)], 1)).toEqual([]);
  });

  it('deduplicates the same neighbor at a two-player table', () => {
    expect(findLivingNeighbors([seat(1), seat(2, true, Alignment.Evil)], 1)).toEqual([
      { seat: 2, playerName: 'Player 2', characterId: 'noble', actualAlignment: Alignment.Evil },
    ]);
  });

  it('walks outward on each side skipping dead players', () => {
    expect(
      findLivingNeighbors([seat(1), seat(2, false), seat(3), seat(4, true, Alignment.Evil)], 1),
    ).toEqual([
      { seat: 4, playerName: 'Player 4', characterId: 'noble', actualAlignment: Alignment.Evil },
      { seat: 3, playerName: 'Player 3', characterId: 'noble', actualAlignment: Alignment.Good },
    ]);
  });
});
