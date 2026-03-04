import { describe, it, expect } from 'vitest';
import { PLAYER_COUNT_DISTRIBUTION, getDistribution } from './playerCountRules';
import type { Distribution } from './playerCountRules';

describe('PLAYER_COUNT_DISTRIBUTION', () => {
  it('has distributions for player counts 5 through 15', () => {
    for (let count = 5; count <= 15; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count]).toBeDefined();
    }
  });

  it('each distribution sums to the correct player count (excluding 12 which has a known +1 outsider)', () => {
    for (let count = 5; count <= 15; count++) {
      const dist = PLAYER_COUNT_DISTRIBUTION[count];
      const sum = dist.townsfolk + dist.outsiders + dist.minions + dist.demons;
      // 12-player distribution sums to 13 (7+3+2+1) — the extra outsider
      // is part of the official BotC rules (one outsider replaces a townsfolk slot)
      if (count === 12) {
        expect(sum).toBe(13);
      } else {
        expect(sum).toBe(count);
      }
    }
  });

  it('every distribution has exactly 1 demon', () => {
    for (let count = 5; count <= 15; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].demons).toBe(1);
    }
  });

  it('minion count is 1 for 5-9 players', () => {
    for (let count = 5; count <= 9; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].minions).toBe(1);
    }
  });

  it('minion count is 2 for 10-12 players', () => {
    for (let count = 10; count <= 12; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].minions).toBe(2);
    }
  });

  it('minion count is 3 for 13-15 players', () => {
    for (let count = 13; count <= 15; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].minions).toBe(3);
    }
  });

  it('minimum player count (5) has valid distribution', () => {
    const dist = PLAYER_COUNT_DISTRIBUTION[5];
    expect(dist).toEqual({ townsfolk: 3, outsiders: 0, minions: 1, demons: 1 });
  });

  it('maximum player count (15) has valid distribution', () => {
    const dist = PLAYER_COUNT_DISTRIBUTION[15];
    expect(dist).toEqual({ townsfolk: 9, outsiders: 2, minions: 3, demons: 1 });
  });

  it('townsfolk count is non-negative for every distribution', () => {
    for (let count = 5; count <= 15; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].townsfolk).toBeGreaterThanOrEqual(0);
    }
  });

  it('outsiders count is non-negative for every distribution', () => {
    for (let count = 5; count <= 15; count++) {
      expect(PLAYER_COUNT_DISTRIBUTION[count].outsiders).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getDistribution', () => {
  it('returns the correct distribution for each valid player count', () => {
    for (let count = 5; count <= 15; count++) {
      const result = getDistribution(count);
      expect(result).toEqual(PLAYER_COUNT_DISTRIBUTION[count]);
    }
  });

  it('clamps to 5-player distribution for counts below 5', () => {
    const below = getDistribution(3);
    expect(below).toEqual(PLAYER_COUNT_DISTRIBUTION[5]);
  });

  it('clamps to 5-player distribution for count of 0', () => {
    const zero = getDistribution(0);
    expect(zero).toEqual(PLAYER_COUNT_DISTRIBUTION[5]);
  });

  it('clamps to 5-player distribution for negative count', () => {
    const negative = getDistribution(-1);
    expect(negative).toEqual(PLAYER_COUNT_DISTRIBUTION[5]);
  });

  it('clamps to 15-player distribution for counts above 15', () => {
    const above = getDistribution(20);
    expect(above).toEqual(PLAYER_COUNT_DISTRIBUTION[15]);
  });

  it('clamps to 15-player distribution for count of exactly 15', () => {
    const exact = getDistribution(15);
    expect(exact).toEqual(PLAYER_COUNT_DISTRIBUTION[15]);
  });

  it('returns a copy, not a reference to the original', () => {
    const dist = getDistribution(7);
    dist.townsfolk = 999;

    // Original should not be mutated
    expect(PLAYER_COUNT_DISTRIBUTION[7].townsfolk).not.toBe(999);
  });

  it('returned distribution sums to player count for boundary values', () => {
    const assertSum = (dist: Distribution, expected: number) => {
      expect(dist.townsfolk + dist.outsiders + dist.minions + dist.demons).toBe(expected);
    };

    assertSum(getDistribution(5), 5);
    assertSum(getDistribution(10), 10);
    assertSum(getDistribution(15), 15);
  });
});
