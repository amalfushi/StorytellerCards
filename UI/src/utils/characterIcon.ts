/**
 * Utility for resolving character icon paths.
 *
 * All character icons live in `/icons/characters/{characterId}Icon.png`.
 * The `getCharacterIconPath()` helper constructs the correct path from a
 * character ID so callers never need to know the naming convention.
 */

import { Alignment } from '@/types/index.ts';

/**
 * Get the icon path for a character by ID.
 * Returns the path to the character's PNG icon.
 *
 * @param characterId - lowercase, no-spaces character identifier
 *                      (e.g. `"fortuneteller"`, `"fanggu"`)
 */
export function getCharacterIconPath(characterId: string): string {
  return `/icons/characters/${characterId}Icon.png`;
}

/** Fallback path used when a character icon fails to load. */
export const FALLBACK_ICON_PATH = '/icons/characters/_fallbackIcon.png';

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
