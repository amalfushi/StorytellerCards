import type { Script } from '../types/index.ts';

/**
 * Shape of the `_meta` object that must be the first element in the official
 * script JSON format.
 */
interface ScriptMeta {
  id: '_meta';
  name: string;
  author: string;
}

/**
 * A single element in the raw script JSON array – either the `_meta` header
 * object or a plain character-ID string.
 */
type ScriptJsonElement = ScriptMeta | string;

/** Type-guard: is `value` a `_meta` header object? */
function isMeta(value: unknown): value is ScriptMeta {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).id === '_meta' &&
    typeof (value as Record<string, unknown>).name === 'string' &&
    typeof (value as Record<string, unknown>).author === 'string'
  );
}

/**
 * Derive a stable, URL-safe ID from a script name.
 *
 * Strips spaces, lowercases, and removes non-alphanumeric characters.
 *
 * @example normalizeId("Boozling")  // "boozling"
 * @example normalizeId("My Script") // "myscript"
 */
function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse the official Blood on the Clocktower script JSON format into a
 * {@link Script} object.
 *
 * Expected format:
 * ```json
 * [
 *   { "id": "_meta", "author": "Lau", "name": "Boozling" },
 *   "noble",
 *   "pixie",
 *   ...
 * ]
 * ```
 *
 * @throws {Error} if the input is not a valid script JSON array or the `_meta`
 *   header is missing / malformed.
 */
export function importScript(json: unknown): Script {
  if (!Array.isArray(json)) {
    throw new Error('Script JSON must be an array.');
  }

  if (json.length === 0) {
    throw new Error('Script JSON array must not be empty.');
  }

  const elements = json as ScriptJsonElement[];
  const first = elements[0];

  if (!isMeta(first)) {
    throw new Error(
      'First element of script JSON must be a _meta object with id "_meta", name, and author.',
    );
  }

  const characterIds: string[] = [];

  for (let i = 1; i < elements.length; i++) {
    const el = elements[i];
    if (typeof el === 'string') {
      characterIds.push(el);
    }
    // Silently skip any non-string entries after _meta (future-proofing)
  }

  return {
    id: normalizeId(first.name),
    name: first.name,
    author: first.author,
    characterIds,
  };
}
