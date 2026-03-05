import { describe, it, expect } from 'vitest';
import { getCharacterIconPath, FALLBACK_ICON_PATH } from '@/utils/characterIcon.ts';

describe('getCharacterIconPath', () => {
  it('returns correct path for a known character ID', () => {
    expect(getCharacterIconPath('fortuneteller')).toBe('/icons/characters/fortunetellerIcon.png');
  });

  it('returns correct path for another character ID', () => {
    expect(getCharacterIconPath('imp')).toBe('/icons/characters/impIcon.png');
  });

  it('returns correct path for a multi-word character ID', () => {
    expect(getCharacterIconPath('highpriestess')).toBe('/icons/characters/highpriestessIcon.png');
  });

  it('handles empty string (still returns a formed path)', () => {
    expect(getCharacterIconPath('')).toBe('/icons/characters/Icon.png');
  });

  it('handles unknown character ID (still returns a formed path)', () => {
    expect(getCharacterIconPath('nonexistent')).toBe('/icons/characters/nonexistentIcon.png');
  });
});

describe('FALLBACK_ICON_PATH', () => {
  it('is exported and equals the expected fallback path', () => {
    expect(FALLBACK_ICON_PATH).toBe('/icons/characters/_fallbackIcon.png');
  });
});
