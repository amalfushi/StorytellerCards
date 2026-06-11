import { describe, it, expect } from 'vitest';
import {
  getAdjacentSeats,
  areSeatsAdjacent,
  areSeatsInLine,
  getSeatingWarnings,
  getMarionetteValidSeats,
} from '@/utils/seatingConstraints.ts';
import type { PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

function makeState(characterId = ''): PlayerGameState {
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    tokens: [],
  };
}

function makeSeating(
  count: number,
  assignments: Record<number, string> = {},
): { slots: Slot[]; playerState: Record<PlayerId, PlayerGameState> } {
  const slots: Slot[] = [];
  const playerState: Record<PlayerId, PlayerGameState> = {};
  for (let seat = 1; seat <= count; seat += 1) {
    const playerId = `player-${seat}`;
    slots.push({ kind: 'seat', id: `slot-${seat}`, playerId });
    playerState[playerId] = makeState(assignments[seat] ?? '');
  }
  return { slots, playerState };
}

describe('getAdjacentSeats', () => {
  it('returns neighbors for middle seat', () => {
    expect(getAdjacentSeats(3, 5)).toEqual([2, 4]);
  });

  it('wraps around for seat 1', () => {
    expect(getAdjacentSeats(1, 5)).toEqual([5, 2]);
  });

  it('wraps around for last seat', () => {
    expect(getAdjacentSeats(5, 5)).toEqual([4, 1]);
  });

  it('handles single seat', () => {
    expect(getAdjacentSeats(1, 1)).toEqual([1, 1]);
  });
});

describe('areSeatsAdjacent', () => {
  it('returns true for adjacent seats', () => {
    expect(areSeatsAdjacent(1, 2, 5)).toBe(true);
    expect(areSeatsAdjacent(2, 1, 5)).toBe(true);
  });

  it('returns true for wrapping adjacency', () => {
    expect(areSeatsAdjacent(1, 5, 5)).toBe(true);
    expect(areSeatsAdjacent(5, 1, 5)).toBe(true);
  });

  it('returns false for non-adjacent seats', () => {
    expect(areSeatsAdjacent(1, 3, 5)).toBe(false);
    expect(areSeatsAdjacent(2, 4, 5)).toBe(false);
  });
});

describe('areSeatsInLine', () => {
  it('single seat is always in line', () => {
    expect(areSeatsInLine([3], 5)).toBe(true);
  });

  it('two adjacent seats are in line', () => {
    expect(areSeatsInLine([2, 3], 5)).toBe(true);
  });

  it('three consecutive seats are in line', () => {
    expect(areSeatsInLine([2, 3, 4], 8)).toBe(true);
  });

  it('non-consecutive seats are not in line', () => {
    expect(areSeatsInLine([1, 3, 5], 8)).toBe(false);
  });

  it('wrapping consecutive seats are in line', () => {
    expect(areSeatsInLine([7, 8, 1], 8)).toBe(true);
  });

  it('all seats filled is always in line', () => {
    expect(areSeatsInLine([1, 2, 3, 4, 5], 5)).toBe(true);
  });

  it('empty array is in line', () => {
    expect(areSeatsInLine([], 5)).toBe(true);
  });
});

describe('getSeatingWarnings', () => {
  it('returns empty array when no special characters are assigned', () => {
    const { slots, playerState } = makeSeating(5);
    expect(getSeatingWarnings(slots, playerState)).toHaveLength(0);
  });

  it('warns when Marionette is not adjacent to a Demon', () => {
    const { slots, playerState } = makeSeating(5, {
      1: 'imp',
      3: 'marionette',
      4: 'washerwoman',
    });

    const marionetteWarning = getSeatingWarnings(slots, playerState).find(
      (warning) => warning.characterId === 'marionette',
    );

    expect(marionetteWarning).toBeDefined();
    expect(marionetteWarning?.message).toContain('Marionette');
    expect(marionetteWarning?.message).toContain('Demon');
  });

  it('does not warn when Marionette is adjacent to a Demon', () => {
    const { slots, playerState } = makeSeating(5, { 1: 'imp', 2: 'marionette' });
    const marionetteWarning = getSeatingWarnings(slots, playerState).find(
      (warning) => warning.characterId === 'marionette',
    );
    expect(marionetteWarning).toBeUndefined();
  });

  it('does not warn when Marionette is not in play', () => {
    const { slots, playerState } = makeSeating(5, { 1: 'imp', 2: 'poisoner' });
    expect(getSeatingWarnings(slots, playerState)).toHaveLength(0);
  });

  it('warns when Lord of Typhon evil characters are not in a line', () => {
    const { slots, playerState } = makeSeating(8, {
      1: 'lordoftyphon',
      3: 'poisoner',
      5: 'baron',
    });

    const typhonWarning = getSeatingWarnings(slots, playerState).find(
      (warning) => warning.characterId === 'lordoftyphon',
    );

    expect(typhonWarning).toBeDefined();
    expect(typhonWarning?.message).toContain('continuous line');
  });

  it('does not warn when Lord of Typhon evil characters are in a line', () => {
    const { slots, playerState } = makeSeating(8, {
      3: 'poisoner',
      4: 'lordoftyphon',
      5: 'baron',
    });

    const lineWarning = getSeatingWarnings(slots, playerState).find(
      (warning) =>
        warning.characterId === 'lordoftyphon' && warning.message.includes('continuous line'),
    );

    expect(lineWarning).toBeUndefined();
  });

  it('ignores unoccupied seats for constraint checks', () => {
    const { slots, playerState } = makeSeating(4, { 1: 'imp', 2: 'marionette' });
    const sparseSlots = slots.map((slot) =>
      slot.kind === 'seat' && slot.id === 'slot-4' ? { ...slot, playerId: null } : slot,
    );

    expect(getSeatingWarnings(sparseSlots, playerState)).toHaveLength(0);
  });
});

describe('getMarionetteValidSeats', () => {
  it('returns empty when no demons are assigned', () => {
    const { slots, playerState } = makeSeating(5);
    expect(getMarionetteValidSeats(slots, playerState)).toEqual([]);
  });

  it('returns adjacent display seats when a demon is assigned', () => {
    const { slots, playerState } = makeSeating(5, { 3: 'imp' });
    expect(getMarionetteValidSeats(slots, playerState)).toEqual([2, 4]);
  });

  it('wraps around for demon at display seat 1', () => {
    const { slots, playerState } = makeSeating(5, { 1: 'imp' });
    expect(getMarionetteValidSeats(slots, playerState)).toEqual([2, 5]);
  });

  it('excludes seats already occupied by evil characters', () => {
    const { slots, playerState } = makeSeating(5, { 3: 'imp', 4: 'poisoner' });
    const valid = getMarionetteValidSeats(slots, playerState);
    expect(valid).not.toContain(4);
    expect(valid).toContain(2);
  });
});
