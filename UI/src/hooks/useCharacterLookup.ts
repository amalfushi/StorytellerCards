import { useMemo } from 'react';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import charactersData from '@/data/characters.json';

/**
 * Convert a raw character ID into a human-readable display name.
 *
 * Splits on camelCase / PascalCase boundaries, capitalises first letter.
 * e.g. "villageidiot" → "Villageidiot", "snakecharmer" → "Snakecharmer"
 *      "spiritofivory" → "Spiritofivory"
 */
export function humanizeCharacterId(id: string): string {
  // Insert space before capital letters (camelCase)
  const spaced = id.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Capitalize first letter
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Build a fallback CharacterDef for characters not in the master data.
 * Shows a neutral grey placeholder and a TODO ability description.
 */
export function getFallbackCharacter(id: string): CharacterDef {
  return {
    id,
    name: humanizeCharacterId(id),
    type: 'Unknown' as CharacterDef['type'],
    defaultAlignment: Alignment.Unknown,
    abilityShort: '<TODO>',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#9e9e9e' },
    reminders: [],
  };
}

/**
 * Hook that provides fast character lookup by ID from the master character data.
 * Loads `characters.json` once and memoises the lookup map.
 *
 * When a character ID is not found in the master data, `getCharacter` returns
 * a fallback definition with a placeholder name and grey styling.
 */
export function useCharacterLookup(): {
  getCharacter: (id: string) => CharacterDef | undefined;
  getCharactersByIds: (ids: string[]) => CharacterDef[];
  allCharacters: CharacterDef[];
} {
  const allCharacters = useMemo(() => charactersData as CharacterDef[], []);

  const characterMap = useMemo(() => {
    const map = new Map<string, CharacterDef>();
    for (const char of allCharacters) {
      map.set(char.id, char);
    }
    return map;
  }, [allCharacters]);

  const getCharacter = useMemo(
    () =>
      (id: string): CharacterDef | undefined =>
        characterMap.get(id) ?? getFallbackCharacter(id),
    [characterMap],
  );

  const getCharactersByIds = useMemo(
    () =>
      (ids: string[]): CharacterDef[] =>
        ids.map((id) => characterMap.get(id) ?? getFallbackCharacter(id)),
    [characterMap],
  );

  return { getCharacter, getCharactersByIds, allCharacters };
}
