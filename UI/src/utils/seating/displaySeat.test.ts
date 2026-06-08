import { describe, expect, it } from 'vitest';

import type { Slot } from '../index.ts';
import { buildDisplaySeatNumberMap, displaySeatNumber, seatCount } from './displaySeat.ts';

const seat = (id: string): Slot => ({ kind: 'seat', id, playerId: null });
const spacer = (id: string): Slot => ({ kind: 'spacer', id });
const storyteller = (id: string): Slot => ({ kind: 'storyteller', id });

describe('buildDisplaySeatNumberMap', () => {
  it('numbers seats 1..N skipping spacers and storyteller markers', () => {
    const slots: Slot[] = [seat('a'), spacer('sp'), seat('b'), storyteller('st'), seat('c')];
    const map = buildDisplaySeatNumberMap(slots);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
    expect(map.get('c')).toBe(3);
    expect(map.has('sp')).toBe(false);
    expect(map.has('st')).toBe(false);
  });

  it('returns an empty map when there are no seats', () => {
    const slots: Slot[] = [spacer('sp'), storyteller('st')];
    expect(buildDisplaySeatNumberMap(slots).size).toBe(0);
  });
});

describe('displaySeatNumber', () => {
  it('returns the 1-based number for a seat', () => {
    const slots: Slot[] = [seat('a'), spacer('sp'), seat('b')];
    expect(displaySeatNumber(slots, 'b')).toBe(2);
  });

  it('returns null for spacer/storyteller/missing ids', () => {
    const slots: Slot[] = [seat('a'), spacer('sp')];
    expect(displaySeatNumber(slots, 'sp')).toBeNull();
    expect(displaySeatNumber(slots, 'nope')).toBeNull();
  });
});

describe('seatCount', () => {
  it('counts only seat slots', () => {
    const slots: Slot[] = [seat('a'), spacer('sp'), seat('b'), storyteller('st'), seat('c')];
    expect(seatCount(slots)).toBe(3);
  });

  it('returns 0 when empty', () => {
    expect(seatCount([])).toBe(0);
  });
});
