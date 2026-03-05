/**
 * Utility for resolving character icon paths.
 *
 * All character icons live in `/icons/characters/{characterId}Icon.png`.
 * The `getCharacterIconPath()` helper constructs the correct path from a
 * character ID so callers never need to know the naming convention.
 */

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
