import { describe, it, expect } from 'vitest';
import { filterNightOrder, getPlayerNamesForCharacter } from './nightOrderFilter';
import type { NightOrderEntry, PlayerSeat } from '../types/index';
import { Alignment } from '../types/index';

/** Helper to create a structural entry. */
function structural(id: string): NightOrderEntry {
  return {
    order: 0,
    type: 'structural',
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    helpText: `${id} help text`,
    subActions: [],
  };
}

/** Helper to create a character entry. */
function character(id: string, order = 0): NightOrderEntry {
  return {
    order,
    type: 'character',
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    helpText: `${id} help text`,
    subActions: [],
  };
}

/** Helper to create a minimal PlayerSeat. */
function player(seat: number, characterId: string, alive = true): PlayerSeat {
  return {
    seat,
    playerName: `Player ${seat}`,
    characterId,
    alive,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  };
}

describe('filterNightOrder', () => {
  const masterFirstNight: NightOrderEntry[] = [
    structural('dusk'),
    structural('minioninfo'),
    structural('demoninfo'),
    character('poisoner', 1),
    character('washerwoman', 2),
    character('librarian', 3),
    character('noble', 4),
    character('pixie', 5),
    structural('dawn'),
  ];

  it('filters first night to script characters only, keeping structural entries', () => {
    const scriptIds = ['noble', 'pixie'];
    const result = filterNightOrder(masterFirstNight, scriptIds, true);

    const ids = result.map((e) => e.id);
    expect(ids).toEqual(['dusk', 'minioninfo', 'demoninfo', 'noble', 'pixie', 'dawn']);
  });

  it('filters other nights entries', () => {
    const otherNights: NightOrderEntry[] = [
      structural('dusk'),
      character('poisoner', 1),
      character('monk', 2),
      character('imp', 3),
      structural('dawn'),
    ];

    const scriptIds = ['monk'];
    const result = filterNightOrder(otherNights, scriptIds, false);

    const ids = result.map((e) => e.id);
    expect(ids).toEqual(['dusk', 'monk', 'dawn']);
  });

  it('always includes structural entries (non-Atheist script)', () => {
    const result = filterNightOrder(masterFirstNight, [], true);
    const types = result.map((e) => e.type);

    expect(types.every((t) => t === 'structural')).toBe(true);
    expect(result.length).toBe(4); // dusk, minioninfo, demoninfo, dawn
  });

  it('empty character list returns only structural entries (non-Atheist)', () => {
    const result = filterNightOrder(masterFirstNight, [], true);

    expect(result.length).toBe(4);
    result.forEach((entry) => {
      expect(entry.type).toBe('structural');
    });
  });

  it('preserves original ordering', () => {
    const scriptIds = ['washerwoman', 'poisoner'];
    const result = filterNightOrder(masterFirstNight, scriptIds, true);

    const characterEntries = result.filter((e) => e.type === 'character');
    expect(characterEntries[0].id).toBe('poisoner');
    expect(characterEntries[1].id).toBe('washerwoman');
  });

  it('handles empty night order array', () => {
    const result = filterNightOrder([], ['noble'], true);
    expect(result).toEqual([]);
  });

  describe('with players parameter', () => {
    const allScriptIds = ['poisoner', 'washerwoman', 'librarian', 'noble', 'pixie'];

    it('filters to only characters assigned to players', () => {
      const players = [player(1, 'noble'), player(2, 'pixie')];
      const result = filterNightOrder(masterFirstNight, allScriptIds, true, players);

      const ids = result.map((e) => e.id);
      expect(ids).toEqual(['dusk', 'minioninfo', 'demoninfo', 'noble', 'pixie', 'dawn']);
    });

    it('excludes unassigned script characters when players are provided', () => {
      // Script has 5 characters but only 2 are assigned to players
      const players = [player(1, 'washerwoman'), player(2, 'poisoner')];
      const result = filterNightOrder(masterFirstNight, allScriptIds, true, players);

      const charIds = result.filter((e) => e.type === 'character').map((e) => e.id);
      expect(charIds).toEqual(['poisoner', 'washerwoman']);
      // librarian, noble, pixie should NOT appear
      expect(charIds).not.toContain('librarian');
      expect(charIds).not.toContain('noble');
      expect(charIds).not.toContain('pixie');
    });

    it('keeps structural entries even with players (non-Atheist script)', () => {
      const players = [player(1, 'noble')];
      const result = filterNightOrder(masterFirstNight, allScriptIds, true, players);

      const structuralIds = result.filter((e) => e.type === 'structural').map((e) => e.id);
      expect(structuralIds).toEqual(['dusk', 'minioninfo', 'demoninfo', 'dawn']);
    });

    it('returns only structural entries when no players have characters', () => {
      const players = [player(1, '')];
      const result = filterNightOrder(masterFirstNight, allScriptIds, true, players);

      expect(result.every((e) => e.type === 'structural')).toBe(true);
    });

    it('without players parameter falls back to script-level filtering', () => {
      const result = filterNightOrder(masterFirstNight, allScriptIds, true);
      const charIds = result.filter((e) => e.type === 'character').map((e) => e.id);
      expect(charIds).toEqual(['poisoner', 'washerwoman', 'librarian', 'noble', 'pixie']);
    });
  });

  // ── M4: Conditional structural entries ──

  describe('conditional structural entries', () => {
    it('skips minioninfo on first night when Atheist is on the script', () => {
      const result = filterNightOrder(masterFirstNight, ['atheist', 'noble'], true);
      const ids = result.map((e) => e.id);
      expect(ids).not.toContain('minioninfo');
    });

    it('skips demoninfo on first night when Atheist is on the script', () => {
      const result = filterNightOrder(masterFirstNight, ['atheist', 'noble'], true);
      const ids = result.map((e) => e.id);
      expect(ids).not.toContain('demoninfo');
    });

    it('keeps other structural entries (dusk/dawn) when Atheist is on the script', () => {
      const result = filterNightOrder(masterFirstNight, ['atheist'], true);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('dusk');
      expect(ids).toContain('dawn');
    });

    it("keeps demoninfo when Lil' Monsta is on the script (even with no demon players)", () => {
      const players = [player(1, 'poisoner')]; // No demon player
      const result = filterNightOrder(masterFirstNight, ['lilmonsta', 'poisoner'], true, players);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('demoninfo');
    });

    it('keeps minioninfo and demoninfo on other nights (no conditional logic)', () => {
      const otherNights: NightOrderEntry[] = [
        structural('minioninfo'),
        structural('demoninfo'),
        character('imp', 1),
      ];
      const result = filterNightOrder(otherNights, ['atheist', 'imp'], false);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('minioninfo');
      expect(ids).toContain('demoninfo');
    });

    it('keeps minioninfo and demoninfo for a normal script on first night', () => {
      const result = filterNightOrder(masterFirstNight, ['imp', 'poisoner'], true);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('minioninfo');
      expect(ids).toContain('demoninfo');
    });
  });

  // ── M4: Deduplication ──

  describe('deduplication', () => {
    it('deduplicates entries when multiple players share a character (Legion)', () => {
      const nightOrder: NightOrderEntry[] = [
        structural('dusk'),
        character('legion', 1),
        character('legion', 1), // duplicate from buildNightOrder won't happen but filterNightOrder should handle duplicates in input
        structural('dawn'),
      ];
      const players = [player(1, 'legion'), player(2, 'legion'), player(3, 'legion')];
      const result = filterNightOrder(nightOrder, ['legion'], true, players);
      const legionEntries = result.filter((e) => e.id === 'legion');
      expect(legionEntries).toHaveLength(1);
    });

    it('does not deduplicate different characters', () => {
      const nightOrder: NightOrderEntry[] = [character('imp', 1), character('poisoner', 2)];
      const result = filterNightOrder(nightOrder, ['imp', 'poisoner'], true);
      const charEntries = result.filter((e) => e.type === 'character');
      expect(charEntries).toHaveLength(2);
    });
  });
});

// ── M4: getPlayerNamesForCharacter ──

describe('getPlayerNamesForCharacter', () => {
  it('returns player names for a given character ID', () => {
    const players = [player(1, 'legion'), player(2, 'legion'), player(3, 'imp')];
    const names = getPlayerNamesForCharacter('legion', players);
    expect(names).toEqual(['Player 1', 'Player 2']);
  });

  it('returns empty array when no players have the character', () => {
    const players = [player(1, 'imp')];
    const names = getPlayerNamesForCharacter('legion', players);
    expect(names).toEqual([]);
  });

  it('returns single name for unique character', () => {
    const players = [player(1, 'imp'), player(2, 'poisoner')];
    const names = getPlayerNamesForCharacter('imp', players);
    expect(names).toEqual(['Player 1']);
  });
});
