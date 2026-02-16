import { useMemo } from 'react';
import type { CharacterDef } from '@/types/index.ts';
import charactersData from '@/data/characters.json';

/**
 * Hook that provides fast character lookup by ID from the master character data.
 * Loads `characters.json` once and memoises the lookup map.
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
        characterMap.get(id),
    [characterMap],
  );

  const getCharactersByIds = useMemo(
    () =>
      (ids: string[]): CharacterDef[] =>
        ids.map((id) => characterMap.get(id)).filter(Boolean) as CharacterDef[],
    [characterMap],
  );

  return { getCharacter, getCharactersByIds, allCharacters };
}
