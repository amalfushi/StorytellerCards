import { CharacterType } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';

/** Returns the theme colour for a given character type. */
export function getCharacterTypeColor(type: string): string {
  switch (type) {
    case CharacterType.Townsfolk:
      return characterColors.townsfolk;
    case CharacterType.Outsider:
      return characterColors.outsider;
    case CharacterType.Minion:
      return characterColors.minion;
    case CharacterType.Demon:
      return characterColors.demon;
    case CharacterType.Traveller:
      return characterColors.travellerGood; // default; caller can refine
    case CharacterType.Fabled:
      return characterColors.fabledStart;
    case CharacterType.Loric:
      return characterColors.loric;
    default:
      return '#9e9e9e';
  }
}
