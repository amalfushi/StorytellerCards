/**
 * Extracts ALL CAPS token phrases from a sub-action description.
 *
 * These correspond to physical info tokens used in Blood on the Clocktower
 * (e.g. "YOU ARE", "THESE ARE YOUR MINIONS", "THIS CHARACTER SELECTED YOU").
 *
 * @returns Array of extracted token phrases, or empty array if none found.
 */
export function extractInfoTokens(description: string): string[] {
  // Match sequences of 2+ consecutive ALL CAPS words (min 2 chars each)
  const regex = /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(description)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

/** Known info token phrases and their player-facing display text. */
const TOKEN_DISPLAY_TEXT: Record<string, string> = {
  'YOU ARE': 'You are:',
  'YOU ARE THE': 'You are the:',
  'THIS CHARACTER SELECTED YOU': 'This character selected you',
  'THESE ARE YOUR MINIONS': 'These are your Minions',
  'THESE CHARACTERS ARE NOT IN PLAY': 'These characters are not in play:',
  'THIS IS THE DEMON': 'This is the Demon',
  'THIS PLAYER IS': 'This player is:',
};

/**
 * Whether a token phrase is one that shows character identity
 * (and thus needs a character picker in fullscreen view).
 */
export function isCharacterIdentityToken(tokenPhrase: string): boolean {
  return tokenPhrase === 'YOU ARE' || tokenPhrase === 'YOU ARE THE';
}

/**
 * Get the player-facing display text for a token phrase.
 * Falls back to title-casing the phrase if not in the known list.
 */
export function getTokenDisplayText(tokenPhrase: string): string {
  return (
    TOKEN_DISPLAY_TEXT[tokenPhrase] ?? tokenPhrase.charAt(0) + tokenPhrase.slice(1).toLowerCase()
  );
}
