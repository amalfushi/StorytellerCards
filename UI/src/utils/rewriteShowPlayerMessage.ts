/**
 * Rewrites a "show player" message containing "might" or "may" into
 * a player-facing question: "Would you like to {action}?"
 *
 * Examples:
 *   "The Philosopher might choose a character." → "Would you like to choose a character?"
 *   "The Acrobat may choose any player"        → "Would you like to choose any player?"
 *
 * Messages containing "might not" or "may not" are left unchanged because
 * the negative phrasing doesn't convert naturally to a question.
 * Messages without "might" or "may" pass through unmodified.
 */
export function rewriteShowPlayerMessage(message: string): string {
  if (!message) return message;

  // Match: anything… might/may (but NOT "might not"/"may not") …action
  const match = message.match(/^.*?\b(?:might|may)\s+(?!not\b)(.+?)[.?]?\s*$/i);

  if (!match) return message;

  const action = match[1].trim();
  if (!action) return message;

  return `Would you like to ${action}?`;
}
