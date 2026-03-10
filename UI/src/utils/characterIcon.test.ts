import { describe, it, expect } from 'vitest';
import {
  getCharacterIconPath,
  getDefaultCharacterIconPath,
  FALLBACK_ICON_PATH,
  getAlignmentBorderColor,
} from '@/utils/characterIcon.ts';

describe('getCharacterIconPath', () => {
  it('returns correct path for a known character ID', () => {
    expect(getCharacterIconPath('fortuneteller')).toBe('/icons/characters/fortunetellerIcon.webp');
  });

  it('returns correct path for another character ID', () => {
    expect(getCharacterIconPath('imp')).toBe('/icons/characters/impIcon.webp');
  });

  it('returns correct path for a multi-word character ID', () => {
    expect(getCharacterIconPath('highpriestess')).toBe('/icons/characters/highpriestessIcon.webp');
  });

  it('handles empty string (still returns a formed path)', () => {
    expect(getCharacterIconPath('')).toBe('/icons/characters/Icon.webp');
  });

  it('handles unknown character ID (still returns a formed path)', () => {
    expect(getCharacterIconPath('nonexistent')).toBe('/icons/characters/nonexistentIcon.webp');
  });

  it('returns _g suffix for Good alignment', () => {
    expect(getCharacterIconPath('washerwoman', 'Good')).toBe(
      '/icons/characters/washerwomanIcon_g.webp',
    );
  });

  it('returns _e suffix for Evil alignment', () => {
    expect(getCharacterIconPath('imp', 'Evil')).toBe('/icons/characters/impIcon_e.webp');
  });

  it('returns no suffix for Unknown alignment', () => {
    expect(getCharacterIconPath('spiritofivory', 'Unknown')).toBe(
      '/icons/characters/spiritofivoryIcon.webp',
    );
  });

  it('returns no suffix when alignment is undefined', () => {
    expect(getCharacterIconPath('noble')).toBe('/icons/characters/nobleIcon.webp');
  });

  it('returns no suffix for unrecognised alignment string', () => {
    expect(getCharacterIconPath('noble', 'Neutral')).toBe('/icons/characters/nobleIcon.webp');
  });
});

describe('getDefaultCharacterIconPath', () => {
  it('returns _g for Townsfolk', () => {
    expect(getDefaultCharacterIconPath('washerwoman', 'Townsfolk')).toBe(
      '/icons/characters/washerwomanIcon_g.webp',
    );
  });

  it('returns _g for Outsider', () => {
    expect(getDefaultCharacterIconPath('butler', 'Outsider')).toBe(
      '/icons/characters/butlerIcon_g.webp',
    );
  });

  it('returns _e for Minion', () => {
    expect(getDefaultCharacterIconPath('poisoner', 'Minion')).toBe(
      '/icons/characters/poisonerIcon_e.webp',
    );
  });

  it('returns _e for Demon', () => {
    expect(getDefaultCharacterIconPath('imp', 'Demon')).toBe('/icons/characters/impIcon_e.webp');
  });

  it('returns base path for Traveller', () => {
    expect(getDefaultCharacterIconPath('spiritofivory', 'Traveller')).toBe(
      '/icons/characters/spiritofivoryIcon.webp',
    );
  });

  it('returns base path for Fabled', () => {
    expect(getDefaultCharacterIconPath('angel', 'Fabled')).toBe(
      '/icons/characters/angelIcon.webp',
    );
  });

  it('returns base path for Loric', () => {
    expect(getDefaultCharacterIconPath('xaan', 'Loric')).toBe('/icons/characters/xaanIcon.webp');
  });
});

describe('FALLBACK_ICON_PATH', () => {
  it('is exported and equals the expected fallback path', () => {
    expect(FALLBACK_ICON_PATH).toBe('/icons/characters/_fallbackIcon.webp');
  });
});

describe('getAlignmentBorderColor', () => {
  it('returns blue for Good alignment', () => {
    expect(getAlignmentBorderColor('Good', '#9e9e9e')).toBe('#1976d2');
  });

  it('returns red for Evil alignment', () => {
    expect(getAlignmentBorderColor('Evil', '#9e9e9e')).toBe('#d32f2f');
  });

  it('returns typeColor for Unknown alignment', () => {
    expect(getAlignmentBorderColor('Unknown', '#558b2f')).toBe('#558b2f');
  });

  it('returns typeColor when alignment is undefined', () => {
    expect(getAlignmentBorderColor(undefined, '#b71c1c')).toBe('#b71c1c');
  });

  it('returns typeColor for any unrecognised string', () => {
    expect(getAlignmentBorderColor('Neutral', '#ff9800')).toBe('#ff9800');
  });

  it('ignores case — only exact "Good"/"Evil" match', () => {
    expect(getAlignmentBorderColor('good', '#aaa')).toBe('#aaa');
    expect(getAlignmentBorderColor('evil', '#bbb')).toBe('#bbb');
  });
});
