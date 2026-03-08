import { describe, it, expect } from 'vitest';
import {
  PLAYER_COUNT_DISTRIBUTION,
  getDistribution,
  getDistributionSuggestions,
  getDistributionWarnings,
  DistributionWarningSeverity,
} from './playerCountRules';
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

// ──────────────────────────────────────────────
// M4: Script-aware distribution suggestions
// ──────────────────────────────────────────────

describe('getDistributionSuggestions', () => {
  it('returns empty array for a normal script', () => {
    const suggestions = getDistributionSuggestions(
      ['imp', 'poisoner', 'washerwoman'],
      getDistribution(7),
    );
    expect(suggestions).toEqual([]);
  });

  it('returns Atheist suggestion when script contains atheist', () => {
    const suggestions = getDistributionSuggestions(
      ['atheist', 'washerwoman', 'librarian'],
      getDistribution(7),
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested).toEqual({ demons: 0, minions: 0 });
    expect(suggestions[0].reason).toContain('Atheist');
  });

  it('returns Legion suggestion when script contains legion', () => {
    const base = getDistribution(7); // minions: 1
    const suggestions = getDistributionSuggestions(['legion', 'washerwoman'], base);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested.demons).toBe(2); // minions + 1
    expect(suggestions[0].suggested.minions).toBe(0);
    expect(suggestions[0].reason).toContain('Legion');
  });

  it("returns Lil' Monsta suggestion when script contains lilmonsta", () => {
    const suggestions = getDistributionSuggestions(['lilmonsta', 'poisoner'], getDistribution(7));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested.demons).toBe(0);
    expect(suggestions[0].reason).toContain("Lil' Monsta");
  });

  it('returns multiple suggestions when multiple edge-case characters present', () => {
    const suggestions = getDistributionSuggestions(['atheist', 'legion'], getDistribution(10));
    expect(suggestions).toHaveLength(2);
    const reasons = suggestions.map((s) => s.reason);
    expect(reasons.some((r) => r.includes('Atheist'))).toBe(true);
    expect(reasons.some((r) => r.includes('Legion'))).toBe(true);
  });

  it('Legion suggestion scales with player count (more minions at higher counts)', () => {
    const base10 = getDistribution(10); // minions: 2
    const suggestions = getDistributionSuggestions(['legion'], base10);
    expect(suggestions[0].suggested.demons).toBe(3); // 2 + 1
  });
});

// ──────────────────────────────────────────────
// M4: Distribution warnings
// ──────────────────────────────────────────────

describe('getDistributionWarnings', () => {
  it('returns no warnings for standard distribution', () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 };
    const warnings = getDistributionWarnings(dist, ['imp', 'poisoner']);
    expect(warnings).toEqual([]);
  });

  it("warns about zero demons without Atheist or Lil' Monsta", () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 0, minions: 1, demons: 0 };
    const warnings = getDistributionWarnings(dist, ['poisoner']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe(DistributionWarningSeverity.Warning);
    expect(warnings[0].message).toContain('No Demons');
  });

  it('does not warn about zero demons when Atheist is on script', () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 0, minions: 0, demons: 0 };
    const warnings = getDistributionWarnings(dist, ['atheist']);
    // No "No Demons" warning, no "No Minions" warning (Atheist suppresses both)
    expect(warnings).toEqual([]);
  });

  it("does not warn about zero demons when Lil' Monsta is on script", () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 0, minions: 1, demons: 0 };
    const warnings = getDistributionWarnings(dist, ['lilmonsta', 'poisoner']);
    expect(warnings).toEqual([]);
  });

  it('warns about multiple demons without Legion', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 0, demons: 2 };
    const warnings = getDistributionWarnings(dist, ['imp']);
    const demonWarning = warnings.find((w) => w.message.includes('Multiple Demons'));
    expect(demonWarning).toBeDefined();
    expect(demonWarning!.severity).toBe(DistributionWarningSeverity.Info);
  });

  it('does not warn about multiple demons when Legion is on script', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 0, demons: 3 };
    const warnings = getDistributionWarnings(dist, ['legion']);
    const demonWarning = warnings.find((w) => w.message.includes('Multiple Demons'));
    expect(demonWarning).toBeUndefined();
  });

  it('warns about zero minions without Atheist or Legion', () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 0, minions: 0, demons: 1 };
    const warnings = getDistributionWarnings(dist, ['imp']);
    const minionWarning = warnings.find((w) => w.message.includes('No Minions'));
    expect(minionWarning).toBeDefined();
  });

  it('does not warn about zero minions with Legion', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 0, demons: 3 };
    const warnings = getDistributionWarnings(dist, ['legion']);
    const minionWarning = warnings.find((w) => w.message.includes('No Minions'));
    expect(minionWarning).toBeUndefined();
  });
});
