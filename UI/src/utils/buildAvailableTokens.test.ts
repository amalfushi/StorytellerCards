import { describe, it, expect } from 'vitest';
import { buildAvailableTokens, BASIC_TOKENS, MAD_TOKEN } from '@/utils/buildAvailableTokens.ts';
import type { CharacterDef } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock character factory
// ──────────────────────────────────────────────

const makeChar = (overrides: Partial<CharacterDef>): CharacterDef => ({
  id: 'test',
  name: 'Test',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Test ability',
  firstNight: null,
  otherNights: null,
  reminders: [],
  ...overrides,
});

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('buildAvailableTokens', () => {
  it('returns basic tokens (Poisoned, Drunk) when given empty array', () => {
    const result = buildAvailableTokens([]);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'basic-poisoned', text: 'Poisoned' }),
        expect.objectContaining({ id: 'basic-drunk', text: 'Drunk' }),
      ]),
    );
  });

  it('returns basic tokens when given characters with no reminders', () => {
    const chars = [makeChar({ id: 'noble', name: 'Noble' })];
    const result = buildAvailableTokens(chars);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('basic-poisoned');
    expect(result[1].id).toBe('basic-drunk');
  });

  it('includes character-specific reminder tokens from active characters', () => {
    const chars = [
      makeChar({
        id: 'fortuneteller',
        name: 'Fortune Teller',
        reminders: [{ id: 'fortuneteller-redherring', text: 'Red Herring' }],
      }),
    ];
    const result = buildAvailableTokens(chars);
    expect(result).toHaveLength(3); // 2 basic + 1 reminder
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'fortuneteller-redherring', text: 'Red Herring' }),
      ]),
    );
  });

  it('includes "Mad" token when a character with "mad" in abilityShort is present', () => {
    const chars = [
      makeChar({
        id: 'cerenovus',
        name: 'Cerenovus',
        abilityShort:
          'Each night, choose a player & a character: they are "mad" they are this character.',
      }),
    ];
    const result = buildAvailableTokens(chars);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'basic-mad', text: 'Mad' })]),
    );
  });

  it('does NOT include "Mad" token when no character mentions "mad"', () => {
    const chars = [makeChar({ id: 'noble', abilityShort: 'Learn 3 players, 1 is evil.' })];
    const result = buildAvailableTokens(chars);
    const madToken = result.find((t) => t.id === 'basic-mad');
    expect(madToken).toBeUndefined();
  });

  it('deduplicates tokens by id (same reminder from two characters appears once)', () => {
    const sharedReminder = { id: 'shared-token', text: 'Shared' };
    const chars = [
      makeChar({ id: 'char1', reminders: [sharedReminder] }),
      makeChar({ id: 'char2', reminders: [sharedReminder] }),
    ];
    const result = buildAvailableTokens(chars);
    const shared = result.filter((t) => t.id === 'shared-token');
    expect(shared).toHaveLength(1);
  });

  it('handles multiple characters with different reminders', () => {
    const chars = [
      makeChar({
        id: 'fortuneteller',
        reminders: [{ id: 'fortuneteller-redherring', text: 'Red Herring' }],
      }),
      makeChar({
        id: 'poisoner',
        reminders: [{ id: 'poisoner-poisoned', text: 'Poisoned' }],
      }),
    ];
    const result = buildAvailableTokens(chars);
    // 2 basic + 2 character-specific
    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'fortuneteller-redherring' }),
        expect.objectContaining({ id: 'poisoner-poisoned' }),
      ]),
    );
  });

  it('handles character with multiple reminders', () => {
    const chars = [
      makeChar({
        id: 'lycanthrope',
        reminders: [
          { id: 'lycanthrope-dead', text: 'Dead' },
          { id: 'lycanthrope-fauxpaw', text: 'Faux Paw' },
        ],
      }),
    ];
    const result = buildAvailableTokens(chars);
    // 2 basic + 2 character reminders
    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'lycanthrope-dead', text: 'Dead' }),
        expect.objectContaining({ id: 'lycanthrope-fauxpaw', text: 'Faux Paw' }),
      ]),
    );
  });
});

describe('exports', () => {
  it('BASIC_TOKENS is exported correctly', () => {
    expect(BASIC_TOKENS).toEqual([
      { id: 'basic-poisoned', text: 'Poisoned' },
      { id: 'basic-drunk', text: 'Drunk' },
    ]);
  });

  it('MAD_TOKEN is exported correctly', () => {
    expect(MAD_TOKEN).toEqual({ id: 'basic-mad', text: 'Mad' });
  });
});
