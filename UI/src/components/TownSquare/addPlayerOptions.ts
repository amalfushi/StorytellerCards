import type { CharacterDef } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';

/** A character option enriched with its display group label. */
export interface CharacterOption {
  character: CharacterDef;
  group: string;
}

/**
 * Build Traveller-only character options with script Travellers first.
 */
export function buildTravellerOptions(
  scriptCharacterIds: string[],
  characters: CharacterDef[],
): CharacterOption[] {
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const scriptIdSet = new Set(scriptCharacterIds);
  const options: CharacterOption[] = [];

  for (const id of scriptCharacterIds) {
    const character = characterById.get(id);
    if (character?.type === CharacterType.Traveller) {
      options.push({ character, group: 'Travellers in Script' });
    }
  }

  characters
    .filter(
      (character) => character.type === CharacterType.Traveller && !scriptIdSet.has(character.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((character) => {
      options.push({ character, group: 'Other Travellers' });
    });

  return options;
}
