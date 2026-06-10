import { describe, it, expect } from 'vitest';
import {
  PLAYER_COLOR_PALETTE,
  PLAYER_COLOR_COUNT,
  getPlayerColor,
  getPlayerColorById,
} from './playerColor.ts';

describe('playerColor', () => {
  describe('PLAYER_COLOR_PALETTE', () => {
    it('exposes exactly 20 colors', () => {
      expect(PLAYER_COLOR_PALETTE).toHaveLength(20);
      expect(PLAYER_COLOR_COUNT).toBe(20);
    });

    it('uses valid 6-digit hex strings', () => {
      for (const c of PLAYER_COLOR_PALETTE) {
        expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('contains no duplicate colors', () => {
      const set = new Set(PLAYER_COLOR_PALETTE);
      expect(set.size).toBe(PLAYER_COLOR_PALETTE.length);
    });
  });

  describe('getPlayerColor', () => {
    it('returns the palette entry at the given index', () => {
      expect(getPlayerColor(0)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColor(5)).toBe(PLAYER_COLOR_PALETTE[5]);
      expect(getPlayerColor(19)).toBe(PLAYER_COLOR_PALETTE[19]);
    });

    it('wraps around past the end of the palette', () => {
      expect(getPlayerColor(20)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColor(21)).toBe(PLAYER_COLOR_PALETTE[1]);
      expect(getPlayerColor(40)).toBe(PLAYER_COLOR_PALETTE[0]);
    });

    it('falls back to first color for invalid indices', () => {
      expect(getPlayerColor(-1)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColor(1.5)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColor(Number.NaN)).toBe(PLAYER_COLOR_PALETTE[0]);
    });
  });

  describe('getPlayerColorById', () => {
    const roster = ['p1', 'p2', 'p3'];

    it('returns the color for a player in the roster', () => {
      expect(getPlayerColorById('p1', roster)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColorById('p2', roster)).toBe(PLAYER_COLOR_PALETTE[1]);
      expect(getPlayerColorById('p3', roster)).toBe(PLAYER_COLOR_PALETTE[2]);
    });

    it('returns undefined for unknown ids', () => {
      expect(getPlayerColorById('missing', roster)).toBeUndefined();
    });

    it('respects roster order changes', () => {
      const reordered = ['p3', 'p1', 'p2'];
      expect(getPlayerColorById('p3', reordered)).toBe(PLAYER_COLOR_PALETTE[0]);
      expect(getPlayerColorById('p1', reordered)).toBe(PLAYER_COLOR_PALETTE[1]);
    });
  });
});
