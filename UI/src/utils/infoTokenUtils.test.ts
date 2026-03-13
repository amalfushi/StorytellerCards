import { describe, it, expect } from 'vitest';
import {
  extractInfoTokens,
  getTokenDisplayText,
  isCharacterIdentityToken,
  isSelectedYouToken,
} from '@/utils/infoTokenUtils.ts';

describe('infoTokenUtils', () => {
  describe('extractInfoTokens', () => {
    it('extracts YOU ARE from description', () => {
      expect(extractInfoTokens('Show the YOU ARE info token & their new character token.')).toEqual(
        ['YOU ARE'],
      );
    });

    it('extracts THESE ARE YOUR MINIONS', () => {
      expect(extractInfoTokens('Show the THESE ARE YOUR MINIONS token.')).toEqual([
        'THESE ARE YOUR MINIONS',
      ]);
    });

    it('extracts THIS CHARACTER SELECTED YOU', () => {
      expect(
        extractInfoTokens('Show the THIS CHARACTER SELECTED YOU token, the Cerenovus token.'),
      ).toEqual(['THIS CHARACTER SELECTED YOU']);
    });

    it('extracts THESE CHARACTERS ARE NOT IN PLAY', () => {
      expect(extractInfoTokens('Show the THESE CHARACTERS ARE NOT IN PLAY token.')).toEqual([
        'THESE CHARACTERS ARE NOT IN PLAY',
      ]);
    });

    it('extracts THIS IS THE DEMON', () => {
      expect(extractInfoTokens('Show the THIS IS THE DEMON token.')).toEqual(['THIS IS THE DEMON']);
    });

    it('extracts THIS PLAYER IS', () => {
      expect(
        extractInfoTokens('Show the THIS PLAYER IS info token and the Lunatic token.'),
      ).toEqual(['THIS PLAYER IS']);
    });

    it('returns empty array when no ALL CAPS tokens', () => {
      expect(
        extractInfoTokens('The Empath learns how many evil players sit next to them.'),
      ).toEqual([]);
    });

    it('does not match single uppercase words', () => {
      expect(extractInfoTokens('Wake the Demon.')).toEqual([]);
    });

    it('extracts multiple tokens from one description', () => {
      const result = extractInfoTokens('Show the YOU ARE info token and the THIS PLAYER IS token.');
      expect(result).toEqual(['YOU ARE', 'THIS PLAYER IS']);
    });
  });

  describe('getTokenDisplayText', () => {
    it('returns known display text for YOU ARE', () => {
      expect(getTokenDisplayText('YOU ARE')).toBe('You are:');
    });

    it('returns known display text for THESE ARE YOUR MINIONS', () => {
      expect(getTokenDisplayText('THESE ARE YOUR MINIONS')).toBe('These are your Minions');
    });

    it('returns updated display text for THIS CHARACTER SELECTED YOU', () => {
      expect(getTokenDisplayText('THIS CHARACTER SELECTED YOU')).toBe(
        'This character has selected you:',
      );
    });

    it('falls back to title-case for unknown tokens', () => {
      expect(getTokenDisplayText('SOME UNKNOWN TOKEN')).toBe('Some unknown token');
    });
  });

  describe('isCharacterIdentityToken', () => {
    it('returns true for YOU ARE', () => {
      expect(isCharacterIdentityToken('YOU ARE')).toBe(true);
    });

    it('returns true for YOU ARE THE', () => {
      expect(isCharacterIdentityToken('YOU ARE THE')).toBe(true);
    });

    it('returns false for THESE ARE YOUR MINIONS', () => {
      expect(isCharacterIdentityToken('THESE ARE YOUR MINIONS')).toBe(false);
    });

    it('returns false for THIS CHARACTER SELECTED YOU', () => {
      expect(isCharacterIdentityToken('THIS CHARACTER SELECTED YOU')).toBe(false);
    });
  });

  describe('isSelectedYouToken', () => {
    it('returns true for THIS CHARACTER SELECTED YOU', () => {
      expect(isSelectedYouToken('THIS CHARACTER SELECTED YOU')).toBe(true);
    });

    it('returns false for YOU ARE', () => {
      expect(isSelectedYouToken('YOU ARE')).toBe(false);
    });

    it('returns false for THESE ARE YOUR MINIONS', () => {
      expect(isSelectedYouToken('THESE ARE YOUR MINIONS')).toBe(false);
    });

    it('returns false for MAD', () => {
      expect(isSelectedYouToken('MAD')).toBe(false);
    });
  });
});
