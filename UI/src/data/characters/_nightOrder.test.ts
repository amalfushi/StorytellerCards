import { describe, it, expect } from 'vitest';
import {
  buildNightOrder,
  FIRST_NIGHT_STRUCTURAL,
  OTHER_NIGHTS_STRUCTURAL,
} from './_nightOrder';
import type { CharacterDef, NightOrderEntry } from '@/types/index';

// ── Factory helpers ──

/** Create a minimal CharacterDef with optional night actions. */
function makeDef(
  id: string,
  opts: {
    firstNightOrder?: number;
    otherNightsOrder?: number;
    type?: string;
  } = {},
): CharacterDef {
  const firstNight = opts.firstNightOrder != null
    ? {
        order: opts.firstNightOrder,
        helpText: `${id} first night help`,
        subActions: [
          { id: `${id}-fn-1`, description: `${id} first night step`, isConditional: false },
        ],
      }
    : null;

  const otherNights = opts.otherNightsOrder != null
    ? {
        order: opts.otherNightsOrder,
        helpText: `${id} other nights help`,
        subActions: [
          { id: `${id}-on-1`, description: `${id} other nights step`, isConditional: false },
        ],
      }
    : null;

  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    type: (opts.type ?? 'Townsfolk') as CharacterDef['type'],
    defaultAlignment: 'Good',
    abilityShort: `${id} ability`,
    firstNight,
    otherNights,
    icon: { placeholder: '#000' },
    reminders: [],
  };
}

// ── Tests ──

describe('buildNightOrder', () => {
  it('returns entries sorted by order number (ascending)', () => {
    const chars = [
      makeDef('charlie', { firstNightOrder: 30 }),
      makeDef('alpha', { firstNightOrder: 10 }),
      makeDef('bravo', { firstNightOrder: 20 }),
    ];

    const result = buildNightOrder(chars, true);
    const orders = result.map((e) => e.order);

    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it('first night includes structural entries (MinionInfo, DemonInfo)', () => {
    const result = buildNightOrder([], true);
    const ids = result.map((e) => e.id);

    expect(ids).toContain('minioninfo');
    expect(ids).toContain('demoninfo');
  });

  it('other nights excludes first-night-only structural entries', () => {
    const result = buildNightOrder([], false);
    const ids = result.map((e) => e.id);

    // MinionInfo and DemonInfo are first-night-only
    expect(ids).not.toContain('minioninfo');
    expect(ids).not.toContain('demoninfo');
  });

  it('character entries have type "character", structural entries have type "structural"', () => {
    const chars = [makeDef('noble', { firstNightOrder: 59 })];
    const result = buildNightOrder(chars, true);

    const charEntries = result.filter((e) => e.id === 'noble');
    expect(charEntries).toHaveLength(1);
    expect(charEntries[0].type).toBe('character');

    const structEntries = result.filter((e) => e.id === 'minioninfo' || e.id === 'demoninfo');
    structEntries.forEach((e) => {
      expect(e.type).toBe('structural');
    });
  });

  it('has no duplicate order numbers within first night phase', () => {
    const chars = [
      makeDef('alpha', { firstNightOrder: 5 }),
      makeDef('bravo', { firstNightOrder: 20 }),
      makeDef('charlie', { firstNightOrder: 30 }),
    ];

    const result = buildNightOrder(chars, true);
    const orders = result.map((e) => e.order);
    const unique = new Set(orders);

    expect(unique.size).toBe(orders.length);
  });

  it('has no duplicate order numbers within other nights phase', () => {
    const chars = [
      makeDef('alpha', { otherNightsOrder: 5 }),
      makeDef('bravo', { otherNightsOrder: 20 }),
      makeDef('charlie', { otherNightsOrder: 30 }),
    ];

    const result = buildNightOrder(chars, false);
    const orders = result.map((e) => e.order);
    const unique = new Set(orders);

    expect(unique.size).toBe(orders.length);
  });

  it('every entry has required fields: order, type, id, name, helpText, subActions', () => {
    const chars = [
      makeDef('alpha', { firstNightOrder: 10 }),
      makeDef('bravo', { firstNightOrder: 20 }),
    ];

    const result = buildNightOrder(chars, true);

    result.forEach((entry: NightOrderEntry) => {
      expect(entry).toHaveProperty('order');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('helpText');
      expect(entry).toHaveProperty('subActions');
      expect(typeof entry.order).toBe('number');
      expect(['structural', 'character']).toContain(entry.type);
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.helpText).toBe('string');
      expect(Array.isArray(entry.subActions)).toBe(true);
    });
  });

  it('works with an empty character array', () => {
    const firstNight = buildNightOrder([], true);
    const otherNights = buildNightOrder([], false);

    // First night should contain only structural entries
    expect(firstNight.length).toBe(FIRST_NIGHT_STRUCTURAL.length);
    firstNight.forEach((e) => expect(e.type).toBe('structural'));

    // Other nights should contain only structural entries (currently none)
    expect(otherNights.length).toBe(OTHER_NIGHTS_STRUCTURAL.length);
  });

  it('handles character with only firstNight action', () => {
    const chars = [makeDef('noble', { firstNightOrder: 59 })];

    const firstNight = buildNightOrder(chars, true);
    const otherNights = buildNightOrder(chars, false);

    expect(firstNight.some((e) => e.id === 'noble')).toBe(true);
    expect(otherNights.some((e) => e.id === 'noble')).toBe(false);
  });

  it('handles character with only otherNights action', () => {
    const chars = [makeDef('monk', { otherNightsOrder: 17 })];

    const firstNight = buildNightOrder(chars, true);
    const otherNights = buildNightOrder(chars, false);

    expect(firstNight.some((e) => e.id === 'monk')).toBe(false);
    expect(otherNights.some((e) => e.id === 'monk')).toBe(true);
  });

  it('handles character with both firstNight and otherNights actions', () => {
    const chars = [makeDef('spy', { firstNightOrder: 72, otherNightsOrder: 72 })];

    const firstNight = buildNightOrder(chars, true);
    const otherNights = buildNightOrder(chars, false);

    expect(firstNight.some((e) => e.id === 'spy')).toBe(true);
    expect(otherNights.some((e) => e.id === 'spy')).toBe(true);
  });

  it('order numbers are ascending (sorted correctly) for first night', () => {
    const chars = [
      makeDef('z', { firstNightOrder: 99 }),
      makeDef('a', { firstNightOrder: 1 }),
      makeDef('m', { firstNightOrder: 50 }),
    ];

    const result = buildNightOrder(chars, true);
    const orders = result.map((e) => e.order);

    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it('merges structural and character entries in sorted order', () => {
    // MinionInfo is order 14, DemonInfo is order 18
    const chars = [
      makeDef('early', { firstNightOrder: 1 }),
      makeDef('middle', { firstNightOrder: 16 }),
      makeDef('late', { firstNightOrder: 99 }),
    ];

    const result = buildNightOrder(chars, true);
    const ids = result.map((e) => e.id);

    // Should be: early(1), minioninfo(14), middle(16), demoninfo(18), late(99)
    expect(ids).toEqual(['early', 'minioninfo', 'middle', 'demoninfo', 'late']);
  });

  it('passes character helpText through to the entry', () => {
    const chars = [makeDef('noble', { firstNightOrder: 59 })];
    const result = buildNightOrder(chars, true);
    const noble = result.find((e) => e.id === 'noble');

    expect(noble).toBeDefined();
    expect(noble!.helpText).toBe('noble first night help');
  });

  it('passes character subActions through to the entry', () => {
    const chars = [makeDef('noble', { firstNightOrder: 59 })];
    const result = buildNightOrder(chars, true);
    const noble = result.find((e) => e.id === 'noble');

    expect(noble).toBeDefined();
    expect(noble!.subActions).toHaveLength(1);
    expect(noble!.subActions[0].id).toBe('noble-fn-1');
  });

  it('FIRST_NIGHT_STRUCTURAL contains expected structural entries', () => {
    expect(FIRST_NIGHT_STRUCTURAL.length).toBeGreaterThanOrEqual(2);
    const ids = FIRST_NIGHT_STRUCTURAL.map((e) => e.id);
    expect(ids).toContain('minioninfo');
    expect(ids).toContain('demoninfo');
  });

  it('OTHER_NIGHTS_STRUCTURAL is currently empty', () => {
    expect(OTHER_NIGHTS_STRUCTURAL).toEqual([]);
  });
});
