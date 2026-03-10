/**
 * Utility for resolving character icon paths.
 *
 * Character icons live in `/icons/characters/{characterId}Icon[_e|_g].webp`.
 * The `getCharacterIconPath()` helper constructs the correct path from a
 * character ID and optional alignment so callers never need to know the
 * naming convention.
 *
 * Suffix rules:
 * - `_g` → Good alignment variant
 * - `_e` → Evil alignment variant
 * - (none) → neutral / unaligned (Travellers with Unknown, Fabled, Loric)
 */

import { Alignment, CharacterType } from '@/types/index.ts';

/**
 * Get the icon path for a character by ID, optionally for a specific alignment.
 *
 * @param characterId - lowercase, no-spaces character identifier
 *                      (e.g. `"fortuneteller"`, `"fanggu"`)
 * @param alignment   - when `'Good'` appends `_g`, `'Evil'` appends `_e`,
 *                      otherwise returns the base (neutral) path
 */
export function getCharacterIconPath(characterId: string, alignment?: string): string {
  const suffix = alignment === Alignment.Good ? '_g' : alignment === Alignment.Evil ? '_e' : '';
  return `/icons/characters/${characterId}Icon${suffix}.webp`;
}

/**
 * Get the default icon path for a character based on its type.
 *
 * - Townsfolk / Outsider → `_g` (good variant)
 * - Minion / Demon → `_e` (evil variant)
 * - Traveller / Fabled / Loric → base (no suffix)
 */
export function getDefaultCharacterIconPath(
  characterId: string,
  characterType: string,
): string {
  switch (characterType) {
    case CharacterType.Townsfolk:
    case CharacterType.Outsider:
      return getCharacterIconPath(characterId, Alignment.Good);
    case CharacterType.Minion:
    case CharacterType.Demon:
      return getCharacterIconPath(characterId, Alignment.Evil);
    default:
      return getCharacterIconPath(characterId);
  }
}

/** Fallback path used when a character icon fails to load. */
export const FALLBACK_ICON_PATH = '/icons/characters/_fallbackIcon.webp';

/**
 * Resolve the border colour for a character icon based on alignment.
 *
 * - Good → blue (`#1976d2`)
 * - Evil → red (`#d32f2f`)
 * - Unknown / missing → falls back to the character's type colour
 *
 * @param alignment - The alignment value (from player or character default)
 * @param typeColor - Fallback colour derived from the character type
 */
export function getAlignmentBorderColor(alignment: string | undefined, typeColor: string): string {
  if (alignment === Alignment.Good) return '#1976d2';
  if (alignment === Alignment.Evil) return '#d32f2f';
  return typeColor;
}
