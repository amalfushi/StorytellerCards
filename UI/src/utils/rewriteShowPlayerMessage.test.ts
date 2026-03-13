import { describe, it, expect } from 'vitest';
import { rewriteShowPlayerMessage } from '@/utils/rewriteShowPlayerMessage.ts';

describe('rewriteShowPlayerMessage', () => {
  describe('rewrites "might" phrases as questions', () => {
    it('rewrites "The Philosopher might choose a character"', () => {
      expect(rewriteShowPlayerMessage('The Philosopher might choose a character')).toBe(
        'Would you like to choose a character?',
      );
    });

    it('rewrites with trailing period', () => {
      expect(rewriteShowPlayerMessage('The Courtier might choose a character.')).toBe(
        'Would you like to choose a character?',
      );
    });

    it('rewrites case-insensitively (MIGHT)', () => {
      expect(rewriteShowPlayerMessage('The Philosopher MIGHT choose a character')).toBe(
        'Would you like to choose a character?',
      );
    });

    it('rewrites mixed case (Might)', () => {
      expect(rewriteShowPlayerMessage('The Philosopher Might choose a character')).toBe(
        'Would you like to choose a character?',
      );
    });
  });

  describe('rewrites "may" phrases as questions', () => {
    it('rewrites "The Acrobat may choose any player"', () => {
      expect(rewriteShowPlayerMessage('The Acrobat may choose any player')).toBe(
        'Would you like to choose any player?',
      );
    });

    it('rewrites "may" with extra context', () => {
      expect(rewriteShowPlayerMessage('The Acrobat may choose any player, dead or alive')).toBe(
        'Would you like to choose any player, dead or alive?',
      );
    });

    it('rewrites case-insensitively (MAY)', () => {
      expect(rewriteShowPlayerMessage('The Balloonist MAY learn a character')).toBe(
        'Would you like to learn a character?',
      );
    });
  });

  describe('does NOT rewrite "might not" or "may not"', () => {
    it('leaves "might not" unchanged', () => {
      const msg = 'The Mayor might not die tonight';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });

    it('leaves "may not" unchanged', () => {
      const msg = 'Dead players may not nominate at all';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });

    it('leaves "MIGHT NOT" unchanged (case-insensitive)', () => {
      const msg = 'The Mayor MIGHT NOT die tonight';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });
  });

  describe('passes through messages without might/may', () => {
    it('returns plain text unchanged', () => {
      const msg = 'This character chose you';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });

    it('returns empty string unchanged', () => {
      expect(rewriteShowPlayerMessage('')).toBe('');
    });

    it('returns message with no might/may unchanged', () => {
      const msg = 'You are the Imp';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });
  });

  describe('edge cases', () => {
    it('handles "might" at the start of the message', () => {
      expect(rewriteShowPlayerMessage('might choose a character')).toBe(
        'Would you like to choose a character?',
      );
    });

    it('does not add double question mark', () => {
      const result = rewriteShowPlayerMessage('The Philosopher might choose a character?');
      expect(result).not.toContain('??');
    });

    it('handles trailing whitespace', () => {
      expect(rewriteShowPlayerMessage('The Philosopher might choose a character   ')).toBe(
        'Would you like to choose a character?',
      );
    });

    it('handles "might" embedded in a word (e.g. "almighty") — no rewrite', () => {
      const msg = 'The almighty power activates';
      expect(rewriteShowPlayerMessage(msg)).toBe(msg);
    });
  });
});
