import { describe, it, expect, vi } from 'vitest';
import {
  getCharacterTypeColor,
  getReminderTokenColor,
} from '@/components/common/characterTypeColor.ts';
import { CharacterType } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';

// Mock getCharacter for getReminderTokenColor tests
vi.mock('@/data/characters/index.ts', () => ({
  getCharacter: (id: string) => {
    const chars: Record<string, { type: string }> = {
      washerwoman: { type: 'Townsfolk' },
      drunk: { type: 'Outsider' },
      poisoner: { type: 'Minion' },
      imp: { type: 'Demon' },
      angel: { type: 'Fabled' },
    };
    return chars[id] ?? undefined;
  },
}));

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

describe('getReminderTokenColor', () => {
  it('returns Townsfolk colour for a Townsfolk source character', () => {
    expect(getReminderTokenColor('washerwoman')).toBe(characterColors.townsfolk);
  });

  it('returns Outsider colour for an Outsider source character', () => {
    expect(getReminderTokenColor('drunk')).toBe(characterColors.outsider);
  });

  it('returns Minion colour for a Minion source character', () => {
    expect(getReminderTokenColor('poisoner')).toBe(characterColors.minion);
  });

  it('returns Demon colour for a Demon source character', () => {
    expect(getReminderTokenColor('imp')).toBe(characterColors.demon);
  });

  it('returns Fabled colour for a Fabled source character', () => {
    expect(getReminderTokenColor('angel')).toBe(characterColors.fabledStart);
  });

  it('returns teal fallback for undefined sourceCharacterId', () => {
    expect(getReminderTokenColor(undefined)).toBe('#00897b');
  });

  it('returns teal fallback for unknown character id', () => {
    expect(getReminderTokenColor('nonexistent')).toBe('#00897b');
  });
});
