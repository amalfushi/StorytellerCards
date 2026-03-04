import { describe, it, expect } from 'vitest';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterType } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';

describe('getCharacterTypeColor', () => {
  it('returns blue for Townsfolk', () => {
    expect(getCharacterTypeColor(CharacterType.Townsfolk)).toBe(characterColors.townsfolk);
  });

  it('returns light blue for Outsider', () => {
    expect(getCharacterTypeColor(CharacterType.Outsider)).toBe(characterColors.outsider);
  });

  it('returns red for Minion', () => {
    expect(getCharacterTypeColor(CharacterType.Minion)).toBe(characterColors.minion);
  });

  it('returns dark red for Demon', () => {
    expect(getCharacterTypeColor(CharacterType.Demon)).toBe(characterColors.demon);
  });

  it('returns travellerGood color for Traveller', () => {
    expect(getCharacterTypeColor(CharacterType.Traveller)).toBe(characterColors.travellerGood);
  });

  it('returns fabledStart color for Fabled', () => {
    expect(getCharacterTypeColor(CharacterType.Fabled)).toBe(characterColors.fabledStart);
  });

  it('returns mossy green for Loric', () => {
    expect(getCharacterTypeColor(CharacterType.Loric)).toBe(characterColors.loric);
  });

  it('returns grey fallback for unknown type', () => {
    expect(getCharacterTypeColor('SomeUnknownType')).toBe('#9e9e9e');
  });

  it('returns grey fallback for empty string', () => {
    expect(getCharacterTypeColor('')).toBe('#9e9e9e');
  });

  it('covers all CharacterType values', () => {
    const allTypes = Object.values(CharacterType);
    for (const type of allTypes) {
      const color = getCharacterTypeColor(type);
      expect(color).not.toBe('#9e9e9e');
      expect(color).toBeTruthy();
    }
  });
});
