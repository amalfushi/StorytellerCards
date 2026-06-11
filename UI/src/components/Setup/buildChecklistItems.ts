/**
 * Pure helpers for building the SetupChecklist item list.
 *
 * Extracted from SetupChecklist.tsx so the component file can satisfy
 * `react-refresh/only-export-components` while tests and other callers
 * can still import the builder directly.
 */

import type { CharacterDef, Participant, PlayerGameState, PlayerId } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { getSetupModifiers } from '@/utils/setupModifiers.ts';
import { getRequiredCharacters, getSetupPrompts } from '@/utils/requiredCharacters.ts';

export interface SetupChecklistItem {
  /** Unique ID for this checklist item. */
  id: string;
  /** Display label. */
  label: string;
  /** Optional description with more detail. */
  description?: string;
  /** Whether this item blocks starting Night 1. */
  critical: boolean;
  /** Character that owns this setup item, when it maps to character data. */
  characterId?: string;
  /** Reminder token IDs to place for data-driven first-night reminder setup. */
  reminderTokenIds?: string[];
  /** Category for grouping. */
  category: 'setup' | 'modifier' | 'required' | 'reminder' | 'prompt';
}

/**
 * Build checklist items from the current game state.
 */
export function buildChecklistItems(
  participants: Participant[],
  playerState: Record<PlayerId, PlayerGameState>,
  inPlayCharacterIds: string[],
  scriptCharacterIds: string[],
): SetupChecklistItem[] {
  const items: SetupChecklistItem[] = [];

  // Resolve in-play character defs
  const inPlayChars: CharacterDef[] = [];
  for (const id of inPlayCharacterIds) {
    const def = getCharacter(id);
    if (def) inPlayChars.push(def);
  }

  // 1. Characters with storytellerSetup steps
  for (const char of inPlayChars) {
    if (char.storytellerSetup) {
      for (const step of char.storytellerSetup) {
        items.push({
          id: `setup-${char.id}-${step.id}`,
          label: `${char.name}: ${step.description}`,
          characterId: char.id,
          critical: true,
          category: 'setup',
        });
      }
    }
  }

  // 2. First-night reminder-token placements declared by character data.
  for (const char of inPlayChars) {
    for (const step of char.firstNightReminderSetup ?? []) {
      const tokenNames = step.reminderTokenIds
        .map((tokenId) => char.reminders.find((reminder) => reminder.id === tokenId)?.text)
        .filter((text): text is string => text !== undefined);
      items.push({
        id: `reminder-first-night-${char.id}-${step.id}`,
        label: `${char.name}: ${step.description}`,
        characterId: char.id,
        reminderTokenIds: step.reminderTokenIds,
        description: tokenNames.length
          ? `Prepare reminder tokens: ${tokenNames.join(', ')}`
          : 'Prepare first-night reminder tokens before Night 1 starts',
        critical: false,
        category: 'reminder',
      });
    }
  }

  // 3. Characters with setup: true that may need ST decisions (no storytellerSetup but have setup flag)
  for (const char of inPlayChars) {
    if (char.setup && !char.storytellerSetup?.length && !char.setupModification) {
      items.push({
        id: `setup-flag-${char.id}`,
        label: `${char.name}: Confirm setup requirements`,
        description: char.abilityShort,
        critical: false,
        category: 'setup',
      });
    }
  }

  // 4. Distribution modifiers
  const modifiers = getSetupModifiers(inPlayCharacterIds);
  for (const mod of modifiers) {
    items.push({
      id: `modifier-${mod.characterId}-${mod.type}`,
      label: `${mod.characterName}: ${mod.description}`,
      description: 'Confirm distribution has been adjusted',
      critical: false,
      category: 'modifier',
    });
  }

  // 5. Required character warnings
  const required = getRequiredCharacters(scriptCharacterIds);
  for (const req of required) {
    // Only flag if the required character is also not in the in-play set
    if (!inPlayCharacterIds.includes(req.requiredCharacterId)) {
      items.push({
        id: `required-${req.sourceCharacterId}-${req.requiredCharacterId}`,
        label: `${req.sourceCharacterName} requires ${req.requiredCharacterName}`,
        description: req.reason,
        critical: true,
        category: 'required',
      });
    }
  }

  // 6. Setup prompts (e.g. Bounty Hunter)
  const prompts = getSetupPrompts(inPlayCharacterIds);
  for (const prompt of prompts) {
    items.push({
      id: `prompt-${prompt.characterId}`,
      label: `${prompt.characterName}: ${prompt.prompt}`,
      critical: true,
      category: 'prompt',
    });
  }

  // 7. Global reminder placements needed
  for (const char of inPlayChars) {
    if (char.remindersGlobal && char.remindersGlobal.length > 0) {
      // Check if any participant has had the apparent character set (for Marionette/Drunk)
      const hasApparentAssignment = participants.some((participant) => {
        const state = playerState[participant.playerId];
        return state?.characterId === char.id && !!state.apparentCharacterId;
      });
      if (!hasApparentAssignment) {
        items.push({
          id: `reminder-global-${char.id}`,
          label: `Place "${char.remindersGlobal[0].text}" reminder for ${char.name}`,
          description: `Global reminder token for ${char.name}`,
          critical: false,
          category: 'reminder',
        });
      }
    }
  }

  return items;
}
