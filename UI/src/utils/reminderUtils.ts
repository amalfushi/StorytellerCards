/**
 * Utilities for parsing `:reminder:` markers in night instruction text
 * and mapping them to the character's reminder token array.
 *
 * The official BotC data uses `:reminder:` placeholders in
 * `firstNightReminder` and `otherNightReminder` fields. Each marker
 * corresponds sequentially to a token in the character's `reminders` array.
 */

import type { ReminderToken } from '@/types/index.ts';

// ── Types ──

/** A segment of parsed night text — either plain text or a reminder token reference. */
export type ReminderSegment =
  | { type: 'text'; value: string }
  | { type: 'reminder'; token: ReminderToken; index: number };

// ── Public API ──

/**
 * Parse a night instruction string containing `:reminder:` markers and
 * return an array of segments.
 *
 * Each `:reminder:` is mapped to the corresponding entry in `reminders`
 * by order of appearance (1st marker → reminders[0], 2nd → reminders[1], etc.).
 *
 * If there are more markers than reminders, extra markers are rendered as
 * plain text placeholders. Text-only input (no markers) returns a single
 * text segment.
 */
export function parseReminderMarkers(text: string, reminders: ReminderToken[]): ReminderSegment[] {
  if (!text) return [];

  const MARKER = ':reminder:';
  const parts = text.split(MARKER);

  // No markers found — return full text as a single segment
  if (parts.length === 1) {
    return [{ type: 'text', value: text }];
  }

  const segments: ReminderSegment[] = [];
  let reminderIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    // Add text segment (may be empty string between consecutive markers)
    if (parts[i]) {
      segments.push({ type: 'text', value: parts[i] });
    }

    // After every part except the last, insert a reminder token
    if (i < parts.length - 1) {
      if (reminderIndex < reminders.length) {
        segments.push({
          type: 'reminder',
          token: reminders[reminderIndex],
          index: reminderIndex,
        });
      } else {
        // More markers than reminders — show placeholder text
        segments.push({ type: 'text', value: '[reminder]' });
      }
      reminderIndex++;
    }
  }

  return segments;
}

/**
 * Check whether a text string contains any `:reminder:` markers.
 */
export function hasReminderMarkers(text: string): boolean {
  return text.includes(':reminder:');
}

/**
 * Count the number of `:reminder:` markers in a text string.
 */
export function countReminderMarkers(text: string): number {
  if (!text) return 0;
  const matches = text.match(/:reminder:/g);
  return matches ? matches.length : 0;
}
