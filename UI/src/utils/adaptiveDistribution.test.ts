import { describe, it, expect } from 'vitest';
import { calculateAdaptiveTargets } from '@/utils/adaptiveDistribution.ts';
import type { AdaptiveTargets } from '@/utils/adaptiveDistribution.ts';

// ── Helpers ──

/** Shorthand to extract just the numeric distribution */
function dist(t: AdaptiveTargets) {
  return {
    townsfolk: t.townsfolk,
    outsiders: t.outsiders,
    minions: t.minions,
    demons: t.demons,
  };
}

function modifierIds(t: AdaptiveTargets) {
  return t.modifiers.map((m) => m.characterId);
}

// ── Tests ──

describe('calculateAdaptiveTargets', () => {
  // ──────────────────────────────────────────
  // Normal distribution (no modifiers)
  // ──────────────────────────────────────────

  describe('normal distribution (no setup-affecting characters)', () => {
    it('returns standard 5-player distribution', () => {
      const result = calculateAdaptiveTargets(5, []);
      expect(dist(result)).toEqual({ townsfolk: 3, outsiders: 0, minions: 1, demons: 1 });
      expect(result.total).toBe(5);
      expect(result.modifiers).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('returns standard 7-player distribution', () => {
      const result = calculateAdaptiveTargets(7, ['washerwoman', 'empath', 'monk']);
      expect(dist(result)).toEqual({ townsfolk: 5, outsiders: 0, minions: 1, demons: 1 });
      expect(result.total).toBe(7);
    });

    it('returns standard 10-player distribution', () => {
      const result = calculateAdaptiveTargets(10, []);
      expect(dist(result)).toEqual({ townsfolk: 7, outsiders: 0, minions: 2, demons: 1 });
      expect(result.total).toBe(10);
    });

    it('returns standard 15-player distribution', () => {
      const result = calculateAdaptiveTargets(15, []);
      expect(dist(result)).toEqual({ townsfolk: 9, outsiders: 2, minions: 3, demons: 1 });
      expect(result.total).toBe(15);
    });
  });

  // ──────────────────────────────────────────
  // Baron: +2 Outsiders
  // ──────────────────────────────────────────

  describe('Baron (+2 Outsiders)', () => {
    it('adds 2 outsiders and removes 2 townsfolk for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['baron']);
      expect(dist(result)).toEqual({ townsfolk: 3, outsiders: 3, minions: 1, demons: 1 });
      expect(result.total).toBe(8);
      expect(modifierIds(result)).toContain('baron');
    });

    it('works for 5 players (0 base outsiders → 2)', () => {
      const result = calculateAdaptiveTargets(5, ['baron']);
      expect(result.outsiders).toBe(2);
      expect(result.townsfolk).toBe(1);
    });
  });

  // ──────────────────────────────────────────
  // Fang Gu: +1 Outsider
  // ──────────────────────────────────────────

  describe('Fang Gu (+1 Outsider)', () => {
    it('adds 1 outsider for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['fanggu']);
      expect(result.outsiders).toBe(2);
      expect(result.townsfolk).toBe(4);
      expect(modifierIds(result)).toContain('fanggu');
    });
  });

  // ──────────────────────────────────────────
  // Vigormortis: -1 Outsider
  // ──────────────────────────────────────────

  describe('Vigormortis (-1 Outsider)', () => {
    it('removes 1 outsider for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['vigormortis']);
      expect(result.outsiders).toBe(0);
      expect(result.townsfolk).toBe(6);
    });

    it('clamps outsiders to 0 when base is 0', () => {
      // 5 players: base 0 outsiders
      const result = calculateAdaptiveTargets(5, ['vigormortis']);
      expect(result.outsiders).toBe(0);
      expect(result.townsfolk).toBe(4);
    });
  });

  // ──────────────────────────────────────────
  // Stacking: Baron + Vigormortis = net +1
  // ──────────────────────────────────────────

  describe('stacking modifiers', () => {
    it('Baron + Vigormortis = net +1 Outsider', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'vigormortis']);
      // +2 (Baron) -1 (Vigormortis) = net +1
      expect(result.outsiders).toBe(2); // base 1 + net 1
      expect(result.townsfolk).toBe(4); // base 5 - net 1
      expect(modifierIds(result)).toContain('baron');
      expect(modifierIds(result)).toContain('vigormortis');
    });

    it('Baron + Fang Gu = +3 Outsiders', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'fanggu']);
      expect(result.outsiders).toBe(4); // base 1 + 3
      expect(result.townsfolk).toBe(2); // base 5 - 3
    });
  });

  // ──────────────────────────────────────────
  // Variable outsider modifiers
  // ──────────────────────────────────────────

  describe('variable outsider modifiers', () => {
    it('Balloonist adds variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['balloonist']);
      expect(modifierIds(result)).toContain('balloonist');
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('Hermit adds variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['hermit']);
      expect(modifierIds(result)).toContain('hermit');
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('Godfather adds variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['godfather']);
      expect(modifierIds(result)).toContain('godfather');
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('Kazali adds variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['kazali']);
      expect(modifierIds(result)).toContain('kazali');
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('Sentinel adds variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['sentinel']);
      expect(modifierIds(result)).toContain('sentinel');
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('Baron + Balloonist: applies fixed +2 and variable warning', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'balloonist']);
      expect(result.outsiders).toBe(3); // base 1 + Baron 2
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });
  });

  // ──────────────────────────────────────────
  // Xaan: overrides all outsider modifiers
  // ──────────────────────────────────────────

  describe('Xaan (X Outsiders — overrides all)', () => {
    it('sets outsiders to X when xaanX is provided', () => {
      const result = calculateAdaptiveTargets(8, ['xaan'], { xaanX: 3 });
      expect(result.outsiders).toBe(3);
      // Townsfolk adjusted: base 5 + base outsiders 1 - xaan 3 = 3
      expect(result.townsfolk).toBe(3);
      expect(modifierIds(result)).toContain('xaan');
    });

    it('overrides Baron when both present', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'xaan'], { xaanX: 1 });
      // Xaan overrides Baron's +2
      expect(result.outsiders).toBe(1);
      // Both should show as modifiers for transparency
      expect(modifierIds(result)).toContain('baron');
      expect(modifierIds(result)).toContain('xaan');
    });

    it('overrides Baron + Vigormortis stack when present', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'vigormortis', 'xaan'], { xaanX: 4 });
      expect(result.outsiders).toBe(4);
    });

    it('shows variable warning when xaanX not set', () => {
      const result = calculateAdaptiveTargets(8, ['xaan']);
      expect(result.warnings).toContain(
        'Xaan is selected but X has not been set — outsider count is variable',
      );
    });

    it('xaanX=0 sets 0 outsiders', () => {
      const result = calculateAdaptiveTargets(8, ['xaan'], { xaanX: 0 });
      expect(result.outsiders).toBe(0);
      expect(result.townsfolk).toBe(6); // base 5 + base outsiders 1 - 0
    });

    it('Xaan suppresses variable outsider warning from other characters', () => {
      const result = calculateAdaptiveTargets(8, ['xaan', 'balloonist', 'sentinel'], { xaanX: 2 });
      expect(result.outsiders).toBe(2);
      // Variable warning from balloonist/sentinel should NOT appear since Xaan overrides
      expect(result.warnings).not.toContain('Outsider count may vary — Storyteller decides');
    });
  });

  // ──────────────────────────────────────────
  // Legion: reversed distribution
  // ──────────────────────────────────────────

  describe('Legion (reversed distribution)', () => {
    it('reverses distribution for 8 players: 6 Legion + 2 good', () => {
      const result = calculateAdaptiveTargets(8, ['legion']);
      expect(result.townsfolk).toBe(2);
      expect(result.outsiders).toBe(0);
      expect(result.demons).toBeGreaterThanOrEqual(1);
      expect(result.minions).toBe(0);
      expect(modifierIds(result)).toContain('legion');
    });

    it('reverses distribution for 10 players: 7 Legion + 3 good', () => {
      const result = calculateAdaptiveTargets(10, ['legion']);
      expect(result.townsfolk).toBe(3);
      expect(result.outsiders).toBe(0);
    });

    it('reverses distribution for 12 players: 9 Legion + 3 good', () => {
      const result = calculateAdaptiveTargets(12, ['legion']);
      expect(result.townsfolk).toBe(3);
    });

    it('reverses distribution for 5 players: 4 Legion + 1 good', () => {
      const result = calculateAdaptiveTargets(5, ['legion']);
      expect(result.townsfolk).toBe(1);
    });

    it('uses extraLegionCopies option', () => {
      const result = calculateAdaptiveTargets(8, ['legion'], { extraLegionCopies: 5 });
      expect(result.demons).toBe(6);
      expect(result.townsfolk).toBe(2);
    });

    it('ignores other outsider modifiers (takes priority)', () => {
      // Legion + Baron — Legion takes over, Baron irrelevant
      const result = calculateAdaptiveTargets(8, ['legion', 'baron']);
      expect(result.outsiders).toBe(0);
      expect(modifierIds(result)).toContain('legion');
    });
  });

  // ──────────────────────────────────────────
  // Atheist: no evil
  // ──────────────────────────────────────────

  describe('Atheist (no evil characters)', () => {
    it('sets minions and demons to 0 for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['atheist']);
      expect(result.minions).toBe(0);
      expect(result.demons).toBe(0);
      expect(result.townsfolk + result.outsiders).toBe(8);
      expect(result.total).toBe(8);
    });

    it('ignores other modifiers (takes priority)', () => {
      const result = calculateAdaptiveTargets(8, ['atheist', 'baron']);
      expect(result.minions).toBe(0);
      expect(result.demons).toBe(0);
      expect(modifierIds(result)).toContain('atheist');
      // Baron is ignored in atheist mode
      expect(modifierIds(result)).not.toContain('baron');
    });

    it('works for 5 players', () => {
      const result = calculateAdaptiveTargets(5, ['atheist']);
      expect(result.total).toBe(5);
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(0);
    });
  });

  // ──────────────────────────────────────────
  // Lil' Monsta: demon is a token
  // ──────────────────────────────────────────

  describe("Lil' Monsta (demon is a token)", () => {
    it('sets demons to 0 and adds +1 minion for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['lilmonsta']);
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(2); // base 1 + 1
      expect(modifierIds(result)).toContain('lilmonsta');
    });

    it("stacks with Baron: Lil' Monsta + Baron", () => {
      const result = calculateAdaptiveTargets(8, ['lilmonsta', 'baron']);
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(2);
      expect(result.outsiders).toBe(3); // base 1 + 2
    });
  });

  // ──────────────────────────────────────────
  // Lord of Typhon: +1 Minion + variable Outsiders
  // ──────────────────────────────────────────

  describe('Lord of Typhon (+1 Minion + variable Outsiders)', () => {
    it('adds 1 minion and removes 1 townsfolk for 8 players', () => {
      const result = calculateAdaptiveTargets(8, ['lordoftyphon']);
      expect(result.minions).toBe(2); // base 1 + 1
      expect(result.townsfolk).toBe(4); // base 5 - 1
      expect(modifierIds(result)).toContain('lordoftyphon');
    });

    it('shows variable outsider warning', () => {
      const result = calculateAdaptiveTargets(8, ['lordoftyphon']);
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });
  });

  // ──────────────────────────────────────────
  // Village Idiot: extra copies
  // ──────────────────────────────────────────

  describe('Village Idiot (extra copies)', () => {
    it('does nothing with 0 extra copies', () => {
      const result = calculateAdaptiveTargets(8, ['villageidiot'], { extraVillageIdiots: 0 });
      expect(dist(result)).toEqual({ townsfolk: 5, outsiders: 1, minions: 1, demons: 1 });
    });

    it('replaces 1 townsfolk with 1 extra copy', () => {
      const result = calculateAdaptiveTargets(8, ['villageidiot'], { extraVillageIdiots: 1 });
      expect(result.townsfolk).toBe(4);
      expect(modifierIds(result)).toContain('villageidiot');
      expect(result.total).toBe(8); // 4 + 1 + 1 + 1 + 1 extra
    });

    it('replaces 2 townsfolk with 2 extra copies', () => {
      const result = calculateAdaptiveTargets(8, ['villageidiot'], { extraVillageIdiots: 2 });
      expect(result.townsfolk).toBe(3);
      expect(result.total).toBe(8);
    });

    it('modifier description uses correct pluralization', () => {
      const result1 = calculateAdaptiveTargets(8, ['villageidiot'], { extraVillageIdiots: 1 });
      expect(
        result1.modifiers.find((m) => m.characterId === 'villageidiot')?.description,
      ).toContain('copy');

      const result2 = calculateAdaptiveTargets(8, ['villageidiot'], { extraVillageIdiots: 2 });
      expect(
        result2.modifiers.find((m) => m.characterId === 'villageidiot')?.description,
      ).toContain('copies');
    });
  });

  // ──────────────────────────────────────────
  // Complex combinations
  // ──────────────────────────────────────────

  describe('complex combinations', () => {
    it('Baron + Fang Gu + Vigormortis = net +2 Outsiders', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'fanggu', 'vigormortis']);
      // +2 + 1 - 1 = net +2
      expect(result.outsiders).toBe(3); // base 1 + 2
      expect(result.townsfolk).toBe(3); // base 5 - 2
    });

    it("Lil' Monsta + Lord of Typhon", () => {
      const result = calculateAdaptiveTargets(10, ['lilmonsta', 'lordoftyphon']);
      // Lil' Monsta: demons=0, minions=base(2)+1=3
      // Lord of Typhon: minions+=1 → 4, townsfolk-=1 → 6
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(4);
      expect(result.townsfolk).toBe(6);
    });

    it('Xaan overrides Baron + Balloonist', () => {
      const result = calculateAdaptiveTargets(8, ['baron', 'balloonist', 'xaan'], { xaanX: 2 });
      expect(result.outsiders).toBe(2);
      // Baron and Balloonist modifiers still shown for transparency
      expect(modifierIds(result)).toContain('baron');
      expect(modifierIds(result)).toContain('balloonist');
      expect(modifierIds(result)).toContain('xaan');
    });

    it('Village Idiot + Baron', () => {
      const result = calculateAdaptiveTargets(8, ['villageidiot', 'baron'], {
        extraVillageIdiots: 1,
      });
      // Baron: +2 outsiders → outsiders=3, townsfolk=3
      // Village Idiot: -1 townsfolk → townsfolk=2
      expect(result.outsiders).toBe(3);
      expect(result.townsfolk).toBe(2);
      expect(result.total).toBe(8); // 2 + 3 + 1 + 1 + 1 extra VI
    });
  });

  // ──────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty selected characters', () => {
      const result = calculateAdaptiveTargets(8, []);
      expect(dist(result)).toEqual({ townsfolk: 5, outsiders: 1, minions: 1, demons: 1 });
      expect(result.modifiers).toHaveLength(0);
    });

    it('handles unknown character IDs gracefully', () => {
      const result = calculateAdaptiveTargets(8, ['unknown_char_xyz']);
      expect(dist(result)).toEqual({ townsfolk: 5, outsiders: 1, minions: 1, demons: 1 });
    });

    it('clamps to 5 player minimum', () => {
      const result = calculateAdaptiveTargets(3, []);
      expect(dist(result)).toEqual({ townsfolk: 3, outsiders: 0, minions: 1, demons: 1 });
    });

    it('clamps to 15 player maximum', () => {
      const result = calculateAdaptiveTargets(20, []);
      expect(dist(result)).toEqual({ townsfolk: 9, outsiders: 2, minions: 3, demons: 1 });
    });

    it('townsfolk never goes negative', () => {
      // Baron (+2 outsiders) on 5 players: townsfolk = 3 - 2 = 1 (not negative)
      const result = calculateAdaptiveTargets(5, ['baron']);
      expect(result.townsfolk).toBeGreaterThanOrEqual(0);
    });

    it('outsiders never goes negative', () => {
      const result = calculateAdaptiveTargets(5, ['vigormortis']);
      expect(result.outsiders).toBeGreaterThanOrEqual(0);
    });

    it('Atheist takes priority over Legion', () => {
      const result = calculateAdaptiveTargets(8, ['atheist', 'legion']);
      // Atheist is checked first
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(0);
    });

    it('default options when none provided', () => {
      const result = calculateAdaptiveTargets(8, ['baron']);
      expect(dist(result)).toEqual({ townsfolk: 3, outsiders: 3, minions: 1, demons: 1 });
    });
  });

  // ──────────────────────────────────────────
  // Warnings
  // ──────────────────────────────────────────

  describe('warnings', () => {
    it('warns when total does not match player count for normal game', () => {
      // Village Idiot with 0 extras + extra characters shouldn't mismatch
      const result = calculateAdaptiveTargets(8, []);
      expect(result.warnings).toHaveLength(0);
    });

    it('variable outsider warning appears for Balloonist', () => {
      const result = calculateAdaptiveTargets(8, ['balloonist']);
      expect(result.warnings).toContain('Outsider count may vary — Storyteller decides');
    });

    it('no variable warning when Xaan overrides with xaanX set', () => {
      const result = calculateAdaptiveTargets(8, ['balloonist', 'xaan'], { xaanX: 2 });
      expect(result.warnings).not.toContain('Outsider count may vary — Storyteller decides');
    });
  });

  // ──────────────────────────────────────────
  // ModifierExplanation shape
  // ──────────────────────────────────────────

  describe('modifier explanations', () => {
    it('each modifier has characterId, characterName, and description', () => {
      const result = calculateAdaptiveTargets(8, ['baron']);
      const baronMod = result.modifiers.find((m) => m.characterId === 'baron');
      expect(baronMod).toBeDefined();
      expect(baronMod!.characterName).toBeTruthy();
      expect(baronMod!.description).toContain('+2 Outsiders');
    });

    it('Atheist modifier description mentions no evil', () => {
      const result = calculateAdaptiveTargets(8, ['atheist']);
      const mod = result.modifiers[0];
      expect(mod.description).toContain('No evil');
    });

    it('Legion modifier describes the reversal', () => {
      const result = calculateAdaptiveTargets(8, ['legion']);
      const mod = result.modifiers[0];
      expect(mod.description).toContain('reversed');
    });
  });

  // ──────────────────────────────────────────
  // Integration: full game setup scenarios
  // ──────────────────────────────────────────

  describe('integration scenarios', () => {
    it('standard Trouble Brewing 7-player game', () => {
      const result = calculateAdaptiveTargets(7, [
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'butler',
        'poisoner',
        'imp',
      ]);
      expect(dist(result)).toEqual({ townsfolk: 5, outsiders: 0, minions: 1, demons: 1 });
      expect(result.total).toBe(7);
      expect(result.modifiers).toHaveLength(0);
    });

    it('full Legion game setup (8 players)', () => {
      const result = calculateAdaptiveTargets(8, ['legion', 'washerwoman', 'butler']);
      expect(result.townsfolk).toBe(2);
      expect(modifierIds(result)).toContain('legion');
    });

    it('full Atheist game setup (8 players)', () => {
      const result = calculateAdaptiveTargets(8, [
        'atheist',
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'undertaker',
        'monk',
        'butler',
      ]);
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(0);
      expect(result.total).toBe(8);
    });

    it("Lil' Monsta game (10 players)", () => {
      const result = calculateAdaptiveTargets(10, ['lilmonsta', 'poisoner', 'scarletwoman']);
      expect(result.demons).toBe(0);
      expect(result.minions).toBe(3); // base 2 + 1
    });

    it('Xaan game (8 players, X=3)', () => {
      const result = calculateAdaptiveTargets(8, ['xaan', 'baron'], { xaanX: 3 });
      expect(result.outsiders).toBe(3);
      // Baron's +2 is overridden by Xaan
      expect(modifierIds(result)).toContain('xaan');
      expect(modifierIds(result)).toContain('baron');
    });
  });
});
