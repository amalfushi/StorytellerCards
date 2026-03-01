import type { ParsedChoice } from './NightChoiceSelector';

/**
 * Analyses a night action helpText to determine if it requires a player/character choice.
 * Returns an array of {@link ParsedChoice} configs (usually 1, but 2 for compound
 * patterns like "chooses a player & a character"). Returns an empty array when no
 * interactive choice is detected.
 */
export function parseHelpTextForChoices(helpText: string): ParsedChoice[] {
  const lower = helpText.toLowerCase();

  // ── Compound: "chooses a player & a character" (Cerenovus, Gambler, Pit-Hag, Summoner) ──
  if (/chooses?\s+a\s+player\s+&\s+a\s+(?:demon\s+)?character/.test(lower)) {
    return [
      { type: 'player', multiple: false, maxSelections: 1, label: 'Choose a player' },
      { type: 'character', multiple: false, maxSelections: 1, label: 'Choose a character' },
    ];
  }

  // ── Multi-player: "chooses 2 living players" / "chooses 2 players" / "chooses 3 players" ──
  const multiLivingMatch = lower.match(/(?:chooses?|might\s+choose)\s+(\d+)\s+living\s+players?/);
  if (multiLivingMatch) {
    const count = parseInt(multiLivingMatch[1], 10);
    return [
      {
        type: 'livingPlayer',
        multiple: true,
        maxSelections: count,
        label: `Choose ${count} living players`,
      },
    ];
  }

  const multiPlayerMatch = lower.match(/(?:chooses?|might\s+choose)\s+(\d+)\s+players?/);
  if (multiPlayerMatch) {
    const count = parseInt(multiPlayerMatch[1], 10);
    return [
      {
        type: 'player',
        multiple: true,
        maxSelections: count,
        label: `Choose ${count} players`,
      },
    ];
  }

  // ── "Point to 2 players" / "Point to the 2 players" / "Point to 3 players" ──
  const pointMultiMatch = lower.match(/points?\s+to\s+(?:the\s+)?(\d+)\s+players?/);
  if (pointMultiMatch) {
    const count = parseInt(pointMultiMatch[1], 10);
    return [
      {
        type: 'player',
        multiple: true,
        maxSelections: count,
        label: `Choose ${count} players`,
      },
    ];
  }

  // ── Single living player: "chooses a living player" / "might choose a living player" ──
  if (/(?:chooses?|might\s+choose)\s+a\s+living\s+player/.test(lower)) {
    return [
      { type: 'livingPlayer', multiple: false, maxSelections: 1, label: 'Choose a living player' },
    ];
  }

  // ── Single dead player: "chooses a dead player" / "might choose a dead player" ──
  if (/(?:chooses?|might\s+choose)\s+a\s+dead\s+player/.test(lower)) {
    return [
      { type: 'deadPlayer', multiple: false, maxSelections: 1, label: 'Choose a dead player' },
    ];
  }

  // ── Single player: "chooses a player" / "might choose a player" / "points to a player" ──
  if (
    /(?:chooses?|might\s+choose)\s+a\s+player/.test(lower) ||
    /points?\s+to\s+a\s+player/.test(lower)
  ) {
    return [{ type: 'player', multiple: false, maxSelections: 1, label: 'Choose a player' }];
  }

  // ── Single character: "chooses a character" / "might choose a character" / "name a character" ──
  if (
    /(?:chooses?|might\s+choose)\s+a\s+character/.test(lower) ||
    /name\s+a\s+character/.test(lower)
  ) {
    return [{ type: 'character', multiple: false, maxSelections: 1, label: 'Choose a character' }];
  }

  // ── Yes/No: "nod or shake" / "Either nod or shake" / "nod yes or shake no" ──
  if (
    /(?:either\s+)?nod\s+(?:yes\s+)?or\s+shake/.test(lower) ||
    /shake\s+(?:no\s+)?or\s+nod/.test(lower) ||
    /nod\s+or\s+shake/.test(lower)
  ) {
    return [{ type: 'yesno', multiple: false, maxSelections: 1, label: 'Nod / Shake' }];
  }

  // ── Alignment: "good or evil" / "choose…alignment" ──
  if (/good\s+or\s+evil/.test(lower) || /choose.*alignment/.test(lower)) {
    return [{ type: 'alignment', multiple: false, maxSelections: 1, label: 'Alignment' }];
  }

  return [];
}

/**
 * Legacy single-choice helper — returns only the first parsed choice or `null`.
 * Prefer {@link parseHelpTextForChoices} for full compound-choice support.
 */
export function parseHelpTextForChoice(helpText: string): ParsedChoice | null {
  const choices = parseHelpTextForChoices(helpText);
  return choices.length > 0 ? choices[0] : null;
}
