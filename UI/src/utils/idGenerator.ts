/**
 * Generate a unique ID string without requiring a UUID library.
 *
 * Combines a base-36 timestamp with a random base-36 suffix to produce
 * IDs like `"m1abc23-k7def9"`.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
