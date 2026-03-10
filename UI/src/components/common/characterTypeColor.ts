import { CharacterType } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import type { PlayerToken } from '@/types/index.ts';

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

/** Resolve reminder token colour based on the source character's type. */
export function getReminderTokenColor(sourceCharacterId?: string): string {
  if (!sourceCharacterId) return '#00897b'; // teal fallback
  const char = getCharacter(sourceCharacterId);
  if (!char) return '#00897b';
  return getCharacterTypeColor(char.type);
}

// ──────────────────────────────────────────────
// Token chip colour constants
// ──────────────────────────────────────────────

const TOKEN_CHIP_COLORS = {
  drunk: '#7b1fa2', // purple
  poisoned: '#388e3c', // green
  custom: '#757575', // grey fallback
} as const;

/**
 * Resolve the background colour for a player token chip.
 *
 * - Drunk → purple (`#7b1fa2`)
 * - Poisoned → green (`#388e3c`)
 * - Custom with source character → character type colour
 * - Custom → token's own colour if set, otherwise grey (`#757575`)
 */
export function resolveTokenColor(token: PlayerToken): string {
  if (token.type === 'drunk') return TOKEN_CHIP_COLORS.drunk;
  if (token.type === 'poisoned') return TOKEN_CHIP_COLORS.poisoned;
  if (token.sourceCharacterId) return getReminderTokenColor(token.sourceCharacterId);
  return token.color ?? TOKEN_CHIP_COLORS.custom;
}
