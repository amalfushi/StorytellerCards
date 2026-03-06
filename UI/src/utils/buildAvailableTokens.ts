import type { CharacterDef, ReminderToken } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Basic tokens always available
// ──────────────────────────────────────────────

export const BASIC_TOKENS: ReminderToken[] = [
  { id: 'basic-poisoned', text: 'Poisoned' },
  { id: 'basic-drunk', text: 'Drunk' },
];

// ──────────────────────────────────────────────
// Conditional tokens
// ──────────────────────────────────────────────

/** Mad token — conditionally available when a character with a "mad" ability is in play. */
export const MAD_TOKEN: ReminderToken = { id: 'basic-mad', text: 'Mad' };

// ──────────────────────────────────────────────
// Builder
// ──────────────────────────────────────────────

/**
 * Build the set of available reminder tokens from the active characters in play.
 *
 * Includes:
 * - Basic tokens (Poisoned, Drunk) — always present.
 * - Conditional "Mad" token — only when a character whose ability mentions "mad" is in play.
 * - Character-specific reminder tokens — deduped by `id`.
 */
export function buildAvailableTokens(activeCharacters: CharacterDef[]): ReminderToken[] {
  const tokens: ReminderToken[] = [...BASIC_TOKENS];

  // Add "Mad" conditionally — only when a character with a "mad" ability is in play
  const hasMadCharacter = activeCharacters.some((c) =>
    c.abilityShort.toLowerCase().includes('mad'),
  );
  if (hasMadCharacter) {
    tokens.push(MAD_TOKEN);
  }

  // Add character-specific reminder tokens (deduped by id)
  const seenIds = new Set(tokens.map((t) => t.id));
  for (const char of activeCharacters) {
    for (const reminder of char.reminders) {
      if (!seenIds.has(reminder.id)) {
        seenIds.add(reminder.id);
        tokens.push(reminder);
      }
    }
  }

  return tokens;
}
