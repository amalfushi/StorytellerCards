import type { ParsedChoice } from './NightChoiceSelector';

/**
 * Analyses a night action helpText to determine if it requires a player/character choice.
 * Returns `null` if no interactive choice is detected.
 */
export function parseHelpTextForChoice(helpText: string): ParsedChoice | null {
  const lower = helpText.toLowerCase();

  // "choose 2 players" or "chooses 2 players"
  const multiPlayerMatch = lower.match(/chooses?\s+(\d+)\s+players?/);
  if (multiPlayerMatch) {
    return {
      type: 'player',
      multiple: true,
      maxSelections: parseInt(multiPlayerMatch[1], 10),
      label: `Choose ${multiPlayerMatch[1]} players`,
    };
  }

  // "chooses a living player" / "choose a living player"
  if (/chooses?\s+a\s+living\s+player/.test(lower)) {
    return {
      type: 'livingPlayer',
      multiple: false,
      maxSelections: 1,
      label: 'Choose a living player',
    };
  }

  // "chooses a dead player" / "choose a dead player"
  if (/chooses?\s+a\s+dead\s+player/.test(lower)) {
    return { type: 'deadPlayer', multiple: false, maxSelections: 1, label: 'Choose a dead player' };
  }

  // "chooses a player" / "choose a player" / "point to a player"
  if (/chooses?\s+a\s+player|point\s+to\s+a\s+player/.test(lower)) {
    return { type: 'player', multiple: false, maxSelections: 1, label: 'Choose a player' };
  }

  // "chooses a character" / "choose a character" / "name a character"
  if (/chooses?\s+a\s+character|name\s+a\s+character/.test(lower)) {
    return { type: 'character', multiple: false, maxSelections: 1, label: 'Choose a character' };
  }

  // "nod or shake" / "nod yes or shake no"
  if (/nod\s+(yes\s+)?or\s+shake/.test(lower) || /shake\s+(no\s+)?or\s+nod/.test(lower)) {
    return { type: 'yesno', multiple: false, maxSelections: 1, label: 'Nod / Shake' };
  }

  // "good or evil" / "alignment"
  if (/good\s+or\s+evil/.test(lower) || /choose.*alignment/.test(lower)) {
    return { type: 'alignment', multiple: false, maxSelections: 1, label: 'Alignment' };
  }

  return null;
}
