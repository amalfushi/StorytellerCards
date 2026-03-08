import { describe, it, expect } from 'vitest';
import {
  parseReminderMarkers,
  hasReminderMarkers,
  countReminderMarkers,
} from '@/utils/reminderUtils.ts';
import type { ReminderToken } from '@/types/index.ts';

// ── Test data ──

const fortuneTellerReminders: ReminderToken[] = [
  { id: 'ft-redherring', text: 'Red Herring', sourceCharacterId: 'fortuneteller' },
];

const sailorReminders: ReminderToken[] = [
  { id: 'sailor-drunk', text: 'Drunk', sourceCharacterId: 'sailor' },
];

const preacherReminders: ReminderToken[] = [
  { id: 'preacher-noability-1', text: 'No Ability', sourceCharacterId: 'preacher' },
  { id: 'preacher-noability-2', text: 'No Ability', sourceCharacterId: 'preacher' },
  { id: 'preacher-noability-3', text: 'No Ability', sourceCharacterId: 'preacher' },
];

// ── hasReminderMarkers ──

describe('hasReminderMarkers', () => {
  it('returns true when text contains :reminder:', () => {
    expect(hasReminderMarkers('Some text :reminder: more text')).toBe(true);
  });

  it('returns false when text has no markers', () => {
    expect(hasReminderMarkers('Some text without markers')).toBe(false);
  });

  it('returns true for multiple markers', () => {
    expect(hasReminderMarkers(':reminder: foo :reminder:')).toBe(true);
  });
});

// ── countReminderMarkers ──

describe('countReminderMarkers', () => {
  it('returns 0 for empty string', () => {
    expect(countReminderMarkers('')).toBe(0);
  });

  it('returns 0 when no markers', () => {
    expect(countReminderMarkers('Plain text')).toBe(0);
  });

  it('counts single marker', () => {
    expect(countReminderMarkers('Text :reminder: more')).toBe(1);
  });

  it('counts multiple markers', () => {
    expect(countReminderMarkers(':reminder: :reminder: :reminder:')).toBe(3);
  });
});

// ── parseReminderMarkers ──

describe('parseReminderMarkers', () => {
  it('returns empty array for empty text', () => {
    expect(parseReminderMarkers('', [])).toEqual([]);
  });

  it('returns single text segment when no markers', () => {
    const result = parseReminderMarkers('Plain text', fortuneTellerReminders);
    expect(result).toEqual([{ type: 'text', value: 'Plain text' }]);
  });

  it('parses single :reminder: marker correctly', () => {
    const text = 'The Sailor chooses a living player. :reminder:';
    const result = parseReminderMarkers(text, sailorReminders);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'text', value: 'The Sailor chooses a living player. ' });
    expect(result[1]).toEqual({
      type: 'reminder',
      token: sailorReminders[0],
      index: 0,
    });
  });

  it('parses multiple :reminder: markers mapping to correct tokens', () => {
    const text =
      'The Preacher chooses a player. :reminder: If they chose a Minion: :reminder: Wake.';
    const result = parseReminderMarkers(text, preacherReminders);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      type: 'text',
      value: 'The Preacher chooses a player. ',
    });
    expect(result[1]).toEqual({
      type: 'reminder',
      token: preacherReminders[0],
      index: 0,
    });
    expect(result[2]).toEqual({
      type: 'text',
      value: ' If they chose a Minion: ',
    });
    expect(result[3]).toEqual({
      type: 'reminder',
      token: preacherReminders[1],
      index: 1,
    });
    expect(result[4]).toEqual({
      type: 'text',
      value: ' Wake.',
    });
  });

  it('shows [reminder] placeholder when more markers than reminders', () => {
    const text = ':reminder: :reminder:';
    const result = parseReminderMarkers(text, [sailorReminders[0]]);
    // First reminder maps, second exceeds array
    const reminderSegments = result.filter((s) => s.type === 'reminder');
    const textSegments = result.filter((s) => s.type === 'text');
    expect(reminderSegments).toHaveLength(1);
    expect(textSegments.some((s) => s.type === 'text' && s.value === '[reminder]')).toBe(true);
  });

  it('handles marker at start of text', () => {
    const text = ':reminder: then text';
    const result = parseReminderMarkers(text, sailorReminders);
    expect(result[0]).toEqual({
      type: 'reminder',
      token: sailorReminders[0],
      index: 0,
    });
    expect(result[1]).toEqual({ type: 'text', value: ' then text' });
  });

  it('includes sourceCharacterId from token', () => {
    const text = 'Choose. :reminder:';
    const result = parseReminderMarkers(text, fortuneTellerReminders);
    const reminderSeg = result.find((s) => s.type === 'reminder');
    expect(reminderSeg).toBeDefined();
    if (reminderSeg?.type === 'reminder') {
      expect(reminderSeg.token.sourceCharacterId).toBe('fortuneteller');
      expect(reminderSeg.token.text).toBe('Red Herring');
    }
  });
});
