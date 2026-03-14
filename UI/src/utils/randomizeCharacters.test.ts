import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomizeCharacters } from './randomizeCharacters';
import type { CharacterDef } from '@/types/index';

// ── Mock character data ──

function makeChar(
  id: string,
  type: CharacterDef['type'],
  overrides: Partial<CharacterDef> = {},
): CharacterDef {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    type,
    defaultAlignment: type === 'Minion' || type === 'Demon' ? 'Evil' : 'Good',
    abilityShort: `${id} ability`,
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#000' },
    reminders: [],
    ...overrides,
  };
}

// Build a rich mock character registry
const mockCharacters: Record<string, CharacterDef> = {
  // Townsfolk (10)
  washerwoman: makeChar('washerwoman', 'Townsfolk'),
  librarian: makeChar('librarian', 'Townsfolk'),
  investigator: makeChar('investigator', 'Townsfolk'),
  chef: makeChar('chef', 'Townsfolk'),
  empath: makeChar('empath', 'Townsfolk'),
  fortuneteller: makeChar('fortuneteller', 'Townsfolk'),
  undertaker: makeChar('undertaker', 'Townsfolk'),
  monk: makeChar('monk', 'Townsfolk'),
  ravenkeeper: makeChar('ravenkeeper', 'Townsfolk'),
  virgin: makeChar('virgin', 'Townsfolk'),
  slayer: makeChar('slayer', 'Townsfolk'),
  soldier: makeChar('soldier', 'Townsfolk'),
  // Outsiders (4)
  butler: makeChar('butler', 'Outsider'),
  drunk: makeChar('drunk', 'Outsider'),
  recluse: makeChar('recluse', 'Outsider'),
  saint: makeChar('saint', 'Outsider'),
  // Minions (4)
  poisoner: makeChar('poisoner', 'Minion'),
  spy: makeChar('spy', 'Minion'),
  baron: makeChar('baron', 'Minion', {
    setupModification: { description: '+2 Outsiders, -2 Townsfolk' },
  }),
  scarletwoman: makeChar('scarletwoman', 'Minion'),
  // Demons (3)
  imp: makeChar('imp', 'Demon'),
  nodashii: makeChar('nodashii', 'Demon'),
  fanggu: makeChar('fanggu', 'Demon'),
  // Special
  atheist: makeChar('atheist', 'Townsfolk'),
  legion: makeChar('legion', 'Demon'),
  godfather: makeChar('godfather', 'Minion', {
    setupModification: { description: '-1 or +1 Outsider' },
  }),
  vigormortis: makeChar('vigormortis', 'Demon'),
};

// Mock the character registry
vi.mock('@/data/characters/index.ts', () => ({
  getCharacter: (id: string) => mockCharacters[id] ?? undefined,
}));

describe('randomizeCharacters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Standard Trouble Brewing script IDs
  const tbScript = [
    'washerwoman',
    'librarian',
    'investigator',
    'chef',
    'empath',
    'fortuneteller',
    'undertaker',
    'monk',
    'ravenkeeper',
    'virgin',
    'slayer',
    'soldier',
    'butler',
    'drunk',
    'recluse',
    'saint',
    'poisoner',
    'spy',
    'baron',
    'scarletwoman',
    'imp',
  ];

  describe('basic distribution', () => {
    it('selects the correct number of characters for 5 players', () => {
      // 5p: 3 townsfolk, 0 outsiders, 1 minion, 1 demon
      const result = randomizeCharacters(tbScript, 5);
      expect(result).toHaveLength(5);
    });

    it('selects the correct number of characters for 7 players', () => {
      // 7p: 5 townsfolk, 0 outsiders, 1 minion, 1 demon
      const result = randomizeCharacters(tbScript, 7);
      expect(result).toHaveLength(7);
    });

    it('selects the correct number of characters for 10 players', () => {
      // 10p: 7 townsfolk, 0 outsiders, 2 minions, 1 demon
      const result = randomizeCharacters(tbScript, 10);
      expect(result).toHaveLength(10);
    });

    it('selects the correct number of characters for 15 players', () => {
      // 15p: 9 townsfolk, 2 outsiders, 3 minions, 1 demon
      const result = randomizeCharacters(tbScript, 15);
      expect(result).toHaveLength(15);
    });

    it('total selected count equals player count', () => {
      for (const pc of [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
        const result = randomizeCharacters(tbScript, pc);
        expect(result).toHaveLength(pc);
      }
    });
  });

  describe('type distribution', () => {
    it('always selects exactly 1 demon for standard games', () => {
      for (let i = 0; i < 10; i++) {
        const result = randomizeCharacters(tbScript, 7);
        const demonCount = result.filter((id) => mockCharacters[id]?.type === 'Demon').length;
        expect(demonCount).toBe(1);
      }
    });

    it('selects correct minion count for different player counts', () => {
      // 5-9 players: 1 minion
      for (let pc = 5; pc <= 9; pc++) {
        const result = randomizeCharacters(tbScript, pc);
        const minionCount = result.filter((id) => mockCharacters[id]?.type === 'Minion').length;
        expect(minionCount).toBe(1);
      }
      // 10-12 players: 2 minions
      for (let pc = 10; pc <= 12; pc++) {
        const result = randomizeCharacters(tbScript, pc);
        const minionCount = result.filter((id) => mockCharacters[id]?.type === 'Minion').length;
        expect(minionCount).toBe(2);
      }
    });

    it('all selected IDs come from the script', () => {
      const scriptSet = new Set(tbScript);
      const result = randomizeCharacters(tbScript, 10);
      for (const id of result) {
        expect(scriptSet.has(id)).toBe(true);
      }
    });

    it('no duplicate IDs in standard selection', () => {
      for (let i = 0; i < 10; i++) {
        const result = randomizeCharacters(tbScript, 7);
        const unique = new Set(result);
        expect(unique.size).toBe(result.length);
      }
    });
  });

  describe('Baron adjustment', () => {
    it('adjusts outsider/townsfolk counts when Baron is selected', () => {
      // Run many times and check that when Baron is picked, outsiders increase
      let baronSelected = false;
      for (let i = 0; i < 50; i++) {
        const result = randomizeCharacters(tbScript, 7);
        if (result.includes('baron')) {
          baronSelected = true;
          // 7p base: 5 townsfolk, 0 outsiders, 1 minion, 1 demon
          // With Baron: 3 townsfolk, 2 outsiders, 1 minion, 1 demon
          const outsiderCount = result.filter(
            (id) => mockCharacters[id]?.type === 'Outsider',
          ).length;
          expect(outsiderCount).toBe(2);
          const townsfolkCount = result.filter(
            (id) => mockCharacters[id]?.type === 'Townsfolk',
          ).length;
          expect(townsfolkCount).toBe(3);
        }
        expect(result).toHaveLength(7);
      }
      // Baron should be selected at least once in 50 runs (4 minions, 1 slot)
      expect(baronSelected).toBe(true);
    });
  });

  describe('Atheist', () => {
    it('works without a demon', () => {
      const scriptWithAtheist = [
        'atheist',
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'fortuneteller',
        'undertaker',
        'monk',
        'ravenkeeper',
        'virgin',
        'butler',
        'drunk',
        'recluse',
        'saint',
      ];
      const result = randomizeCharacters(scriptWithAtheist, 7);
      expect(result).toHaveLength(7);

      // No demons should be selected
      const demonCount = result.filter((id) => mockCharacters[id]?.type === 'Demon').length;
      expect(demonCount).toBe(0);

      // No minions should be selected
      const minionCount = result.filter((id) => mockCharacters[id]?.type === 'Minion').length;
      expect(minionCount).toBe(0);
    });

    it('includes atheist in the selection', () => {
      const scriptWithAtheist = [
        'atheist',
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'fortuneteller',
        'undertaker',
        'butler',
        'drunk',
      ];
      // Run multiple times — atheist should always be included
      for (let i = 0; i < 10; i++) {
        const result = randomizeCharacters(scriptWithAtheist, 7);
        expect(result).toContain('atheist');
      }
    });
  });

  describe('Legion', () => {
    it('fills most slots with legion copies', () => {
      const legionScript = [
        'legion',
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'butler',
        'drunk',
      ];
      const result = randomizeCharacters(legionScript, 7);
      expect(result).toHaveLength(7);

      const legionCount = result.filter((id) => id === 'legion').length;
      // 7 players: 2 good + 5 legion
      expect(legionCount).toBe(5);
    });
  });

  describe('insufficient characters', () => {
    it('handles scripts with fewer characters than needed', () => {
      const smallScript = ['washerwoman', 'librarian', 'poisoner', 'imp'];
      const result = randomizeCharacters(smallScript, 5);
      // Should use what's available: 2 townsfolk, 0 outsiders, 1 minion, 1 demon = 4
      // Then try to fill remaining 1 slot with townsfolk but none left
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result.length).toBeGreaterThan(0);
    });

    it('uses all available characters when fewer than player count', () => {
      const tinyScript = ['washerwoman', 'imp'];
      const result = randomizeCharacters(tinyScript, 5);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result).toContain('imp');
      expect(result).toContain('washerwoman');
    });
  });

  describe('randomness', () => {
    it('multiple calls produce different results', () => {
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const result = randomizeCharacters(tbScript, 10);
        results.add(result.sort().join(','));
      }
      // With 12 townsfolk and 10p needing 7, there are many combinations
      // Should get at least 2 different results in 20 attempts
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('Godfather adjustment', () => {
    it('adjusts outsider count when Godfather is selected', () => {
      const godfatherScript = [
        'washerwoman',
        'librarian',
        'investigator',
        'chef',
        'empath',
        'fortuneteller',
        'undertaker',
        'monk',
        'butler',
        'drunk',
        'recluse',
        'saint',
        'godfather',
        'spy',
        'imp',
      ];

      let godfatherSelected = false;
      for (let i = 0; i < 50; i++) {
        const result = randomizeCharacters(godfatherScript, 7);
        if (result.includes('godfather')) {
          godfatherSelected = true;
          // 7p base: 5 townsfolk, 0 outsiders
          // With Godfather (+1 outsider): 4 townsfolk, 1 outsider
          const outsiderCount = result.filter(
            (id) => mockCharacters[id]?.type === 'Outsider',
          ).length;
          expect(outsiderCount).toBe(1);
        }
        expect(result).toHaveLength(7);
      }
      expect(godfatherSelected).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty script', () => {
      const result = randomizeCharacters([], 5);
      expect(result).toEqual([]);
    });

    it('handles unknown character IDs', () => {
      const result = randomizeCharacters(['unknown1', 'unknown2', 'imp'], 5);
      // Only imp is known, so result should include it
      expect(result).toContain('imp');
    });

    it('handles player count below minimum', () => {
      const result = randomizeCharacters(tbScript, 3);
      // Uses 5p distribution clamped, picks what it can
      expect(result).toHaveLength(3);
    });
  });
});
