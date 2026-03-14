import type { CharacterDef } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { allCharacters, getCharacter } from '@/data/characters/index.ts';

/** A character option enriched with its display group label. */
export interface CharacterOption {
  character: CharacterDef;
  group: string;
}

/** Type display order for sub-grouping. */
const TYPE_LABEL_ORDER: CharacterType[] = [
  CharacterType.Townsfolk,
  CharacterType.Outsider,
  CharacterType.Minion,
  CharacterType.Demon,
  CharacterType.Traveller,
];

/**
 * Build grouped character options for the Autocomplete.
 *
 * Categories (in order):
 * 1. Travellers in script
 * 2. Not-in-play script characters, sub-grouped by type
 * 3. Other characters (not in script, excluding Fabled/Loric), sub-grouped by type
 */
export function buildGroupedOptions(
  scriptCharacterIds: string[],
  inPlayCharacterIds: string[],
): CharacterOption[] {
  const scriptIdSet = new Set(scriptCharacterIds);
  const inPlayIdSet = new Set(inPlayCharacterIds);
  const options: CharacterOption[] = [];

  // Category 1: Travellers in script
  for (const id of scriptCharacterIds) {
    const ch = getCharacter(id);
    if (ch && ch.type === CharacterType.Traveller) {
      options.push({ character: ch, group: 'Travellers in Script' });
    }
  }

  // Category 2: Not-in-play script characters by type
  for (const type of TYPE_LABEL_ORDER) {
    if (type === CharacterType.Traveller) continue; // handled above
    for (const id of scriptCharacterIds) {
      if (inPlayIdSet.has(id)) continue;
      const ch = getCharacter(id);
      if (ch && ch.type === type) {
        options.push({ character: ch, group: `Not in Play — ${type}` });
      }
    }
  }

  // Category 3: All other characters not in script, excluding Fabled & Loric
  for (const type of TYPE_LABEL_ORDER) {
    for (const ch of allCharacters) {
      if (scriptIdSet.has(ch.id)) continue;
      if (ch.type !== type) continue;
      options.push({ character: ch, group: `Other — ${type}` });
    }
  }

  return options;
}
