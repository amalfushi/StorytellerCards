/**
 * Detects characters on a script that require another character to be added
 * during setup (e.g. Choirboy requires the King, Huntsman requires the Damsel).
 *
 * Also detects setup-relevant prompts like the Bounty Hunter's
 * "1 Townsfolk is evil" instruction.
 */

import { getCharacter } from '@/data/characters/index.ts';

// ── Types ──

export interface RequiredCharacter {
  /** ID of the character that creates the requirement. */
  sourceCharacterId: string;
  /** Display name of the source character. */
  sourceCharacterName: string;
  /** ID of the character that must be added. */
  requiredCharacterId: string;
  /** Display name of the required character. */
  requiredCharacterName: string;
  /** Human-readable explanation. */
  reason: string;
}

export interface SetupPrompt {
  /** ID of the character that creates this prompt. */
  characterId: string;
  /** Display name of the character. */
  characterName: string;
  /** What the Storyteller needs to do. */
  prompt: string;
}

// ── Known requirement rules ──

interface RequirementRule {
  /** ID of the character that is required. */
  requiredId: string;
  /** Template for the reason string ({source} and {required} are replaced). */
  reason: string;
}

const KNOWN_REQUIREMENTS: Record<string, RequirementRule> = {
  choirboy: {
    requiredId: 'king',
    reason: '{source} requires the {required} — {required} will be auto-added during setup',
  },
  huntsman: {
    requiredId: 'damsel',
    reason: '{source} requires the {required} — {required} will be auto-added during setup',
  },
};

// ── Known setup prompts ──

interface PromptRule {
  prompt: string;
}

const KNOWN_PROMPTS: Record<string, PromptRule> = {
  bountyhunter: {
    prompt: 'Designate 1 good Townsfolk as registering evil for the Bounty Hunter',
  },
  lycanthrope: {
    prompt: "Place 'Faux Paw' token on a good player (they register as evil to the Lycanthrope)",
  },
  fortuneteller: {
    prompt:
      "Place 'Red Herring' token on a good player (they register as Demon to the Fortune Teller)",
  },
  marionette: {
    prompt:
      "Swap the Marionette's character token with the character they believe they are, and add that character's reminder tokens to maintain the illusion",
  },
};

// ── Public API ──

/**
 * Scan a script's character IDs and return requirements for characters
 * that need another character added but whose required character is
 * *not* already on the script.
 */
export function getRequiredCharacters(scriptCharacterIds: string[]): RequiredCharacter[] {
  const idSet = new Set(scriptCharacterIds);
  const results: RequiredCharacter[] = [];

  for (const id of scriptCharacterIds) {
    const rule = KNOWN_REQUIREMENTS[id];
    if (!rule) continue;

    // Only flag if the required character is missing from the script
    if (idSet.has(rule.requiredId)) continue;

    const source = getCharacter(id);
    const required = getCharacter(rule.requiredId);
    const sourceName = source?.name ?? id;
    const requiredName = required?.name ?? rule.requiredId;

    results.push({
      sourceCharacterId: id,
      sourceCharacterName: sourceName,
      requiredCharacterId: rule.requiredId,
      requiredCharacterName: requiredName,
      reason: rule.reason.replace(/\{source\}/g, sourceName).replace(/\{required\}/g, requiredName),
    });
  }

  return results;
}

/**
 * Scan a script's character IDs and return any setup prompts that the
 * Storyteller needs to act on (e.g. Bounty Hunter: designate an evil Townsfolk).
 */
export function getSetupPrompts(scriptCharacterIds: string[]): SetupPrompt[] {
  const prompts: SetupPrompt[] = [];

  for (const id of scriptCharacterIds) {
    const rule = KNOWN_PROMPTS[id];
    if (!rule) continue;

    const charDef = getCharacter(id);
    prompts.push({
      characterId: id,
      characterName: charDef?.name ?? id,
      prompt: rule.prompt,
    });
  }

  return prompts;
}
