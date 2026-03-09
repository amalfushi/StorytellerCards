/**
 * Detects signal types in night action sub-action descriptions.
 *
 * Used by NightFlashcard to render appropriate inline controls:
 * - "finger" signals → number input (0–5+)
 * - "thumbs up/down" signals → yes/no toggle
 */

export const SignalType = {
  Finger: 'finger',
  ThumbsUpDown: 'thumbsUpDown',
  None: 'none',
} as const;
export type SignalType = (typeof SignalType)[keyof typeof SignalType];

const FINGER_PATTERNS = [
  /finger signal/i,
  /show (?:a |the )?number/i,
  /show (?:them |the player )?(?:(?:a |the )?\d|fingers?)/i,
  /hold up (?:a |the )?number/i,
  /give (?:a |the )?finger/i,
];

const THUMBS_PATTERNS = [
  /thumbs? up (?:or|\/|\|) (?:thumbs? )?down/i,
  /nod (?:or|\/|\|) shake/i,
  /thumbs[- ]?up/i,
  /thumbs[- ]?down/i,
];

/**
 * Detect what type of signal (if any) a sub-action description requires.
 */
export function detectSignalType(description: string): SignalType {
  for (const pattern of FINGER_PATTERNS) {
    if (pattern.test(description)) return SignalType.Finger;
  }
  for (const pattern of THUMBS_PATTERNS) {
    if (pattern.test(description)) return SignalType.ThumbsUpDown;
  }
  return SignalType.None;
}
