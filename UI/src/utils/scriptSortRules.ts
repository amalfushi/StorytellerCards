import { CharacterType } from '../types/index.ts';
import type { CharacterDef } from '../types/index.ts';

// ──────────────────────────────────────────────
// 1. Character-type ordering
// ──────────────────────────────────────────────

const TYPE_ORDER: Record<string, number> = {
  [CharacterType.Townsfolk]: 0,
  [CharacterType.Outsider]: 1,
  [CharacterType.Minion]: 2,
  [CharacterType.Demon]: 3,
  [CharacterType.Traveller]: 4,
  [CharacterType.Fabled]: 5,
  [CharacterType.Loric]: 6,
};

// ──────────────────────────────────────────────
// 2. Ability-text prefix groups (most → least specific)
// ──────────────────────────────────────────────

/**
 * Ordered list of prefix strings.  A character's `abilityShort` is matched
 * against the **first** prefix it starts with (case-sensitive).  Characters
 * that don't match any prefix fall into the "everything else" bucket and are
 * sorted by ability-text length.
 */
const PREFIX_GROUPS: string[] = [
  // Timing-based
  'You start knowing',
  'At night',
  'Each dusk',
  'Each night*',
  'Each night',
  'Each day',
  'Once per game, at night*',
  'Once per game, at night',
  'Once per game, during the day',
  'Once per game',
  'On your 1st night',
  'On your 1st day',

  // Self-referential
  'You think',
  'You are',
  'You have',
  'You do not know',
  'You might',
  'You may only',
  'You',

  // Trigger-based
  'When you die',
  'When you learn',
  'When',

  // Conditional
  'If you die',
  'If you died',
  'If you are "mad"',
  'If you',
  'If the Demon dies',
  'If the Demon kills',
  'If the Demon',
  'If both',
  'If there are 5 or more players alive',
  'If there are 5',
  'If',

  // Group-based
  'All players',
  'All Minions',
  'All',

  // Article-based
  'The 1st time',
  'The',

  // Alignment / role
  'Good',
  'Evil',
  'Players',
  'Minions',
];

/**
 * Sentinel value for characters that don't match any defined prefix group.
 * Set higher than any real group index so they sort last within their type.
 */
const UNMATCHED_GROUP = PREFIX_GROUPS.length;

/**
 * Return the index of the first matching prefix group, or
 * {@link UNMATCHED_GROUP} if none match.
 *
 * Matching is performed against the *start* of `abilityShort` after trimming
 * leading whitespace.  A special case is made for "Each night*" vs "Each night"
 * – the asterisk variant must also contain `*` somewhere after the "Each night"
 * prefix in the ability text.
 */
function getPrefixGroupIndex(ability: string): number {
  const trimmed = ability.trimStart();
  for (let i = 0; i < PREFIX_GROUPS.length; i++) {
    const prefix = PREFIX_GROUPS[i];

    // Handle the "Each night*" / "Once per game, at night*" asterisk variants.
    // These should only match abilities that literally contain the `*` in the
    // prefix portion (e.g. "Each night*, choose…").
    if (prefix.endsWith('*')) {
      const base = prefix.slice(0, -1); // e.g. "Each night"
      if (trimmed.startsWith(base + '*')) {
        return i;
      }
      continue;
    }

    if (trimmed.startsWith(prefix)) {
      return i;
    }
  }
  return UNMATCHED_GROUP;
}

// ──────────────────────────────────────────────
// 3. Public sort function
// ──────────────────────────────────────────────

/**
 * Sort an array of {@link CharacterDef} objects using the official Blood on the
 * Clocktower Script Sort Order rules:
 *
 * 1. By character type (Townsfolk → Outsider → Minion → Demon → …).
 * 2. Within each type, by ability-text prefix group.
 * 3. Within each group, by ability-text length (ascending).
 * 4. If equal length, by character-name length (ascending).
 * 5. If still tied, alphabetically by name.
 *
 * Returns a **new** array; the original is not mutated.
 */
export function sortScriptCharacters(characters: CharacterDef[]): CharacterDef[] {
  return [...characters].sort((a, b) => {
    // 1. Character type
    const typeA = TYPE_ORDER[a.type] ?? 99;
    const typeB = TYPE_ORDER[b.type] ?? 99;
    if (typeA !== typeB) return typeA - typeB;

    // 2. Prefix group
    const groupA = getPrefixGroupIndex(a.abilityShort);
    const groupB = getPrefixGroupIndex(b.abilityShort);
    if (groupA !== groupB) return groupA - groupB;

    // 3. Ability text length
    const lenA = a.abilityShort.length;
    const lenB = b.abilityShort.length;
    if (lenA !== lenB) return lenA - lenB;

    // 4. Name length
    const namelenA = a.name.length;
    const namelenB = b.name.length;
    if (namelenA !== namelenB) return namelenA - namelenB;

    // 5. Alphabetical by name
    return a.name.localeCompare(b.name);
  });
}
