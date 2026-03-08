import { describe, it, expect } from 'vitest';
import { getActiveJinxes, getCharacterActiveJinxes } from './jinxUtils.ts';

describe('jinxUtils', () => {
  // ── getActiveJinxes ──────────────────────────

  describe('getActiveJinxes', () => {
    it('returns empty array when no character ids are provided', () => {
      expect(getActiveJinxes([])).toEqual([]);
    });

    it('returns empty array when no characters on the script have jinxes with each other', () => {
      // chef and empath have no jinx with each other
      const result = getActiveJinxes(['chef', 'empath']);
      expect(result).toEqual([]);
    });

    it('returns active jinxes when both characters in a pair are on the script', () => {
      // alchemist has a jinx with boffin
      const result = getActiveJinxes(['alchemist', 'boffin']);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        character1Id: 'alchemist',
        character1Name: 'Alchemist',
        character2Id: 'boffin',
        character2Name: 'Boffin',
      });
      expect(result[0].description).toBeTruthy();
    });

    it('deduplicates mirrored jinxes — each pair appears only once', () => {
      // Both alchemist and spy reference each other
      const result = getActiveJinxes(['alchemist', 'spy']);
      expect(result).toHaveLength(1);
      // The pair should appear exactly once
      const ids = result.map((j) => [j.character1Id, j.character2Id].sort().join(','));
      expect(new Set(ids).size).toBe(1);
    });

    it('returns multiple jinxes when script has several jinx pairs', () => {
      // alchemist has jinxes with boffin, marionette, spy
      const result = getActiveJinxes(['alchemist', 'boffin', 'marionette', 'spy']);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('handles characters with many jinxes (Leviathan)', () => {
      // leviathan has 13 jinxes; include several partners
      const partners = ['banshee', 'exorcist', 'farmer', 'grandmother', 'hatter', 'mayor'];
      const result = getActiveJinxes(['leviathan', ...partners]);
      expect(result.length).toBeGreaterThanOrEqual(partners.length);
    });

    it('ignores characters not in the character registry', () => {
      const result = getActiveJinxes(['alchemist', 'nonexistentcharacter']);
      expect(result).toEqual([]);
    });

    it('ignores characters with no jinxes', () => {
      // chef has no jinxes
      const result = getActiveJinxes(['chef', 'empath', 'washerwoman']);
      expect(result).toEqual([]);
    });

    it('includes description text for each jinx pair', () => {
      const result = getActiveJinxes(['leviathan', 'soldier']);
      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('Soldier');
    });
  });

  // ── getCharacterActiveJinxes ─────────────────

  describe('getCharacterActiveJinxes', () => {
    it('returns empty array for characters with no jinxes', () => {
      const result = getCharacterActiveJinxes('chef', ['chef', 'empath']);
      expect(result).toEqual([]);
    });

    it('returns only jinxes where the partner is on the script', () => {
      // alchemist has jinxes with boffin, marionette, spy, etc.
      // Only boffin is on script
      const result = getCharacterActiveJinxes('alchemist', ['alchemist', 'boffin', 'chef']);
      expect(result).toHaveLength(1);
      expect(result[0].character2Id).toBe('boffin');
    });

    it('returns all jinxes when script contains all partners', () => {
      const result = getCharacterActiveJinxes('alchemist', [
        'alchemist',
        'boffin',
        'marionette',
        'mastermind',
        'organgrinder',
        'spy',
        'summoner',
        'widow',
        'wraith',
      ]);
      expect(result).toHaveLength(8);
    });

    it('returns all jinxes when no script context is provided (empty array)', () => {
      const result = getCharacterActiveJinxes('alchemist', []);
      // alchemist has 8 jinxes
      expect(result).toHaveLength(8);
      // All results should have character1Id = alchemist
      for (const jinx of result) {
        expect(jinx.character1Id).toBe('alchemist');
        expect(jinx.character1Name).toBe('Alchemist');
      }
    });

    it('returns empty array when characterId is not on the script', () => {
      const result = getCharacterActiveJinxes('alchemist', ['boffin', 'chef']);
      expect(result).toEqual([]);
    });

    it('returns empty array for unknown characters', () => {
      const result = getCharacterActiveJinxes('nonexistent', ['alchemist', 'boffin']);
      expect(result).toEqual([]);
    });

    it('always sets character1 as the queried character', () => {
      const result = getCharacterActiveJinxes('leviathan', ['leviathan', 'soldier']);
      expect(result).toHaveLength(1);
      expect(result[0].character1Id).toBe('leviathan');
      expect(result[0].character1Name).toBe('Leviathan');
      expect(result[0].character2Id).toBe('soldier');
    });

    it('handles Leviathan with many jinxes', () => {
      const result = getCharacterActiveJinxes('leviathan', []);
      // Leviathan has 13 jinxes
      expect(result).toHaveLength(13);
    });

    it('resolves partner names from the character registry', () => {
      const result = getCharacterActiveJinxes('leviathan', ['leviathan', 'mayor']);
      expect(result).toHaveLength(1);
      expect(result[0].character2Name).toBe('Mayor');
    });
  });
});
