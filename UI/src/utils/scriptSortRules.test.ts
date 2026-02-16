import { describe, it, expect } from 'vitest';
import { sortScriptCharacters } from './scriptSortRules';
import { CharacterType, Alignment } from '../types/index';
import type { CharacterDef } from '../types/index';

/** Helper to create a minimal CharacterDef. */
function makeDef(
  overrides: Partial<CharacterDef> & Pick<CharacterDef, 'id' | 'name' | 'type' | 'abilityShort'>,
): CharacterDef {
  return {
    defaultAlignment: Alignment.Good,
    firstNight: null,
    otherNights: null,
    reminders: [],
    ...overrides,
  };
}

describe('sortScriptCharacters', () => {
  it('sorts Townsfolk before Outsiders before Minions before Demons', () => {
    const chars: CharacterDef[] = [
      makeDef({ id: 'imp', name: 'Imp', type: CharacterType.Demon, abilityShort: 'Each night*' }),
      makeDef({
        id: 'baron',
        name: 'Baron',
        type: CharacterType.Minion,
        abilityShort: 'There are extra Outsiders',
      }),
      makeDef({
        id: 'butler',
        name: 'Butler',
        type: CharacterType.Outsider,
        abilityShort: 'Each night, choose a player',
      }),
      makeDef({
        id: 'washerwoman',
        name: 'Washerwoman',
        type: CharacterType.Townsfolk,
        abilityShort: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
      }),
    ];

    const sorted = sortScriptCharacters(chars);
    expect(sorted.map((c) => c.type)).toEqual([
      CharacterType.Townsfolk,
      CharacterType.Outsider,
      CharacterType.Minion,
      CharacterType.Demon,
    ]);
  });

  it('sorts within-type by ability text prefix groups', () => {
    const chars: CharacterDef[] = [
      makeDef({
        id: 'empath',
        name: 'Empath',
        type: CharacterType.Townsfolk,
        abilityShort: 'Each night, you learn how many of your alive neighbours are evil.',
      }),
      makeDef({
        id: 'washerwoman',
        name: 'Washerwoman',
        type: CharacterType.Townsfolk,
        abilityShort: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
      }),
      makeDef({
        id: 'monk',
        name: 'Monk',
        type: CharacterType.Townsfolk,
        abilityShort: 'Each night*, choose a player: they are safe from the Demon tonight.',
      }),
    ];

    const sorted = sortScriptCharacters(chars);

    // "You start knowing" comes before "Each night*" which comes before "Each night"
    expect(sorted[0].id).toBe('washerwoman'); // "You start knowing"
    expect(sorted[1].id).toBe('monk'); // "Each night*"
    expect(sorted[2].id).toBe('empath'); // "Each night"
  });

  it('tie-breaks by text length then name length then alphabetical', () => {
    const chars: CharacterDef[] = [
      makeDef({
        id: 'b',
        name: 'Bravo',
        type: CharacterType.Townsfolk,
        abilityShort: 'You are good.',
      }),
      makeDef({
        id: 'a',
        name: 'Alpha',
        type: CharacterType.Townsfolk,
        abilityShort: 'You are good.',
      }),
    ];

    const sorted = sortScriptCharacters(chars);
    // Same prefix group ("You are"), same ability length, same name length → alphabetical
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });

  it('sorts by ability text length within same prefix group', () => {
    const chars: CharacterDef[] = [
      makeDef({
        id: 'long',
        name: 'LongAbility',
        type: CharacterType.Townsfolk,
        abilityShort:
          'You start knowing that 1 of 2 players is a particular Townsfolk. Extra text here.',
      }),
      makeDef({
        id: 'short',
        name: 'ShortAbility',
        type: CharacterType.Townsfolk,
        abilityShort: 'You start knowing one thing.',
      }),
    ];

    const sorted = sortScriptCharacters(chars);
    // Shorter ability text comes first
    expect(sorted[0].id).toBe('short');
    expect(sorted[1].id).toBe('long');
  });

  it('does not mutate the original array', () => {
    const chars: CharacterDef[] = [
      makeDef({
        id: 'imp',
        name: 'Imp',
        type: CharacterType.Demon,
        abilityShort: 'Each night*',
      }),
      makeDef({
        id: 'washerwoman',
        name: 'Washerwoman',
        type: CharacterType.Townsfolk,
        abilityShort: 'You start knowing',
      }),
    ];

    const original = [...chars];
    sortScriptCharacters(chars);

    expect(chars[0].id).toBe(original[0].id);
    expect(chars[1].id).toBe(original[1].id);
  });

  it('handles empty array', () => {
    expect(sortScriptCharacters([])).toEqual([]);
  });
});
