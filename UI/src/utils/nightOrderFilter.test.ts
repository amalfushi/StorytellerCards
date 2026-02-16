import { describe, it, expect } from 'vitest';
import { filterNightOrder } from './nightOrderFilter';
import type { NightOrderEntry } from '../types/index';

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

  it('always includes structural entries', () => {
    const result = filterNightOrder(masterFirstNight, [], true);
    const types = result.map((e) => e.type);

    expect(types.every((t) => t === 'structural')).toBe(true);
    expect(result.length).toBe(4); // dusk, minioninfo, demoninfo, dawn
  });

  it('empty character list returns only structural entries', () => {
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
});
