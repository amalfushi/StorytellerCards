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
 * - (none) → neutral / unaligned (Travellers, Fabled, Loric only)
 *
 * Standard types (Townsfolk, Outsider, Minion, Demon) do NOT have unsuffixed
 * icon files — their default is the type-appropriate variant (`_g` or `_e`).
 */

import { Alignment, CharacterType } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';

/** Build an icon path with an explicit suffix (or none). */
function buildIconPath(characterId: string, suffix: string = ''): string {
  return `/icons/characters/${characterId}Icon${suffix}.webp`;
}

/**
 * Get the icon path for a character by ID, optionally for a specific alignment.
 *
 * When an explicit alignment (`'Good'` / `'Evil'`) is provided, returns the
 * corresponding `_g` / `_e` variant.
 *
 * When **no** alignment is provided, looks up the character's type in the
 * registry and returns the type-appropriate default:
 * - Townsfolk / Outsider → `_g`
 * - Minion / Demon → `_e`
 * - Fabled / Loric / Traveller → base (no suffix)
 *
 * @param characterId - lowercase, no-spaces character identifier
 *                      (e.g. `"fortuneteller"`, `"fanggu"`)
 * @param alignment   - when `'Good'` appends `_g`, `'Evil'` appends `_e`,
 *                      otherwise resolves via character type
 */
export function getCharacterIconPath(characterId: string, alignment?: string): string {
  if (alignment === Alignment.Good) return buildIconPath(characterId, '_g');
  if (alignment === Alignment.Evil) return buildIconPath(characterId, '_e');

  // No explicit alignment — resolve via character type
  const character = getCharacter(characterId);
  if (character) {
    return getDefaultCharacterIconPath(characterId, character.type);
  }
  // Unknown character — return base (unsuffixed) path
  return buildIconPath(characterId);
}

/**
 * Get the base (unsuffixed) icon path for a character.
 *
 * Only Fabled, Loric, and Traveller characters have unsuffixed icon files.
 * For standard types this path won't exist on disk — use it as a fallback
 * target in the `CharacterIconImage` error chain.
 */
export function getBaseCharacterIconPath(characterId: string): string {
  return buildIconPath(characterId);
}

/**
 * Get the default icon path for a character based on its type.
 *
 * - Townsfolk / Outsider → `_g` (good variant)
 * - Minion / Demon → `_e` (evil variant)
 * - Traveller / Fabled / Loric → base (no suffix)
 */
export function getDefaultCharacterIconPath(characterId: string, characterType: string): string {
  switch (characterType) {
    case CharacterType.Townsfolk:
    case CharacterType.Outsider:
      return buildIconPath(characterId, '_g');
    case CharacterType.Minion:
    case CharacterType.Demon:
      return buildIconPath(characterId, '_e');
    default:
      return buildIconPath(characterId);
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
