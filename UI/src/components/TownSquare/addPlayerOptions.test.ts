import { describe, expect, it } from 'vitest';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import { buildTravellerOptions } from './addPlayerOptions.ts';

function makeCharacter(
  id: string,
  name: string,
  type: CharacterType = CharacterType.Traveller,
): CharacterDef {
  return {
    id,
    name,
    type,
    defaultAlignment: Alignment.Good,
    abilityShort: '',
    firstNight: null,
    otherNights: null,
    reminders: [],
  };
}

describe('buildTravellerOptions', () => {
  it('puts script travellers first in script order, then other travellers alphabetically', () => {
    const characters = [
      makeCharacter('zealot', 'Zealot'),
      makeCharacter('beggar', 'Beggar'),
      makeCharacter('butcher', 'Butcher'),
      makeCharacter('imp', 'Imp', CharacterType.Demon),
    ];

    expect(buildTravellerOptions(['zealot', 'imp'], characters)).toEqual([
      { character: characters[0], group: 'Travellers in Script' },
      { character: characters[1], group: 'Other Travellers' },
      { character: characters[2], group: 'Other Travellers' },
    ]);
  });

  it('lists all travellers in the fallback group when the script has none', () => {
    const characters = [makeCharacter('zealot', 'Zealot'), makeCharacter('beggar', 'Beggar')];

    expect(buildTravellerOptions([], characters).map((option) => option.group)).toEqual([
      'Other Travellers',
      'Other Travellers',
    ]);
  });
});
