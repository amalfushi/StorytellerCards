import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNightOrder } from './useNightOrder.ts';
import { allCharacters } from '@/data/characters/index.ts';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

/** Helper to create a minimal PlayerSeat for testing. */
function makePlayerSeat(overrides: Partial<PlayerSeat> & { characterId: string }): PlayerSeat {
  return {
    seat: 1,
    playerName: 'TestPlayer',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Good,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
    ...overrides,
  };
}

describe('useNightOrder', () => {
  // Gather script IDs from all characters that have night actions
  const allCharacterIds = allCharacters.map((c) => c.id);

  // Script without Atheist for standard structural entry tests (M4: Atheist suppresses minioninfo/demoninfo)
  const standardCharacterIds = allCharacterIds.filter((id) => id !== 'atheist');

  describe('first night', () => {
    it('returns an array of night order entries', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, true));
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('contains MinionInfo structural entry (non-Atheist script)', () => {
      const { result } = renderHook(() => useNightOrder(standardCharacterIds, true));
      const minionInfo = result.current.find((e) => e.id === 'minioninfo');
      expect(minionInfo).toBeDefined();
      expect(minionInfo!.type).toBe('structural');
      expect(minionInfo!.name).toBe('Minion Info');
    });

    it('contains DemonInfo structural entry (non-Atheist script)', () => {
      const { result } = renderHook(() => useNightOrder(standardCharacterIds, true));
      const demonInfo = result.current.find((e) => e.id === 'demoninfo');
      expect(demonInfo).toBeDefined();
      expect(demonInfo!.type).toBe('structural');
      expect(demonInfo!.name).toBe('Demon Info');
    });

    it('omits MinionInfo and DemonInfo when Atheist is on the script', () => {
      const { result } = renderHook(() => useNightOrder(['atheist', 'imp', 'poisoner'], true));
      const minionInfo = result.current.find((e) => e.id === 'minioninfo');
      const demonInfo = result.current.find((e) => e.id === 'demoninfo');
      expect(minionInfo).toBeUndefined();
      expect(demonInfo).toBeUndefined();
    });

    it('contains character entries for characters with first night actions', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, true));
      const characterEntries = result.current.filter((e) => e.type === 'character');
      expect(characterEntries.length).toBeGreaterThan(0);
    });

    it('entries are sorted by order number', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, true));
      for (let i = 1; i < result.current.length; i++) {
        expect(result.current[i].order).toBeGreaterThanOrEqual(result.current[i - 1].order);
      }
    });
  });

  describe('other nights', () => {
    it('returns an array of night order entries', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, false));
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('does NOT contain MinionInfo or DemonInfo structural entries', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, false));
      const minionInfo = result.current.find((e) => e.id === 'minioninfo');
      const demonInfo = result.current.find((e) => e.id === 'demoninfo');
      expect(minionInfo).toBeUndefined();
      expect(demonInfo).toBeUndefined();
    });

    it('contains character entries for characters with other night actions', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, false));
      const characterEntries = result.current.filter((e) => e.type === 'character');
      expect(characterEntries.length).toBeGreaterThan(0);
    });

    it('entries are sorted by order number', () => {
      const { result } = renderHook(() => useNightOrder(allCharacterIds, false));
      for (let i = 1; i < result.current.length; i++) {
        expect(result.current[i].order).toBeGreaterThanOrEqual(result.current[i - 1].order);
      }
    });
  });

  describe('returns different results for first night vs other nights', () => {
    it('first night and other nights produce different entry sets', () => {
      const { result: firstResult } = renderHook(() => useNightOrder(allCharacterIds, true));
      const { result: otherResult } = renderHook(() => useNightOrder(allCharacterIds, false));

      const firstIds = firstResult.current.map((e) => e.id);
      const otherIds = otherResult.current.map((e) => e.id);

      // They should not be identical (structural entries differ at minimum)
      expect(firstIds).not.toEqual(otherIds);
    });
  });

  describe('filtering by script characters', () => {
    it('returns only entries matching the provided script character IDs', () => {
      const scriptIds = ['imp', 'poisoner'];
      const { result } = renderHook(() => useNightOrder(scriptIds, true));

      const characterEntries = result.current.filter((e) => e.type === 'character');
      characterEntries.forEach((entry) => {
        expect(scriptIds).toContain(entry.id);
      });
    });

    it('returns fewer entries for a smaller script', () => {
      const { result: fullResult } = renderHook(() => useNightOrder(allCharacterIds, true));
      const { result: smallResult } = renderHook(() => useNightOrder(['imp', 'poisoner'], true));

      expect(smallResult.current.length).toBeLessThan(fullResult.current.length);
    });

    it('returns only structural entries when script has no night-active characters', () => {
      // Use IDs for characters that have no first-night action
      const { result } = renderHook(() => useNightOrder([], true));
      const characterEntries = result.current.filter((e) => e.type === 'character');
      expect(characterEntries).toHaveLength(0);
      // Should still have structural entries for first night
      const structuralEntries = result.current.filter((e) => e.type === 'structural');
      expect(structuralEntries.length).toBeGreaterThan(0);
    });
  });

  describe('filtering by players', () => {
    it('narrows results to only characters assigned to players', () => {
      const scriptIds = ['imp', 'poisoner', 'monk'];
      const players = [
        makePlayerSeat({ seat: 1, characterId: 'imp' }),
        makePlayerSeat({ seat: 2, characterId: 'monk' }),
      ];

      const { result } = renderHook(() => useNightOrder(scriptIds, false, players));
      const characterEntries = result.current.filter((e) => e.type === 'character');
      const charIds = characterEntries.map((e) => e.id);

      // poisoner is on the script but not assigned to a player → should be excluded
      expect(charIds).not.toContain('poisoner');
    });

    it('includes all assigned characters that have night actions', () => {
      const scriptIds = ['imp', 'poisoner'];
      const players = [
        makePlayerSeat({ seat: 1, characterId: 'imp' }),
        makePlayerSeat({ seat: 2, characterId: 'poisoner' }),
      ];

      const { result } = renderHook(() => useNightOrder(scriptIds, false, players));
      const characterEntries = result.current.filter((e) => e.type === 'character');
      const charIds = characterEntries.map((e) => e.id);

      expect(charIds).toContain('imp');
      expect(charIds).toContain('poisoner');
    });
  });

  describe('memoization', () => {
    it('returns the same reference when inputs do not change', () => {
      const scriptIds = ['imp', 'poisoner'];
      const { result, rerender } = renderHook(() => useNightOrder(scriptIds, true));

      const first = result.current;
      rerender();
      const second = result.current;

      expect(second).toBe(first);
    });
  });
});
