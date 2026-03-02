import type { NightOrderEntry, CharacterDef } from '@/types/index.ts';

/** Structural entries that always appear in the first night order. */
export const FIRST_NIGHT_STRUCTURAL: NightOrderEntry[] = [
  {
    order: 14,
    type: 'structural',
    id: 'minioninfo',
    name: 'Minion Info',
    helpText:
      'If there are 7 or more players, wake all Minions: Show the THIS IS THE DEMON token. Point to the Demon. Show the THESE ARE YOUR MINIONS token. Point to the other Minions.',
    subActions: [
      {
        id: 'minioninfo-fn-1',
        description:
          'If there are 7 or more players, wake all Minions: Show the THIS IS THE DEMON token.',
        isConditional: true,
      },
      {
        id: 'minioninfo-fn-2',
        description: 'Point to the Demon.',
        isConditional: false,
      },
      {
        id: 'minioninfo-fn-3',
        description: 'Show the THESE ARE YOUR MINIONS token.',
        isConditional: false,
      },
      {
        id: 'minioninfo-fn-4',
        description: 'Point to the other Minions.',
        isConditional: false,
      },
    ],
  },
  {
    order: 18,
    type: 'structural',
    id: 'demoninfo',
    name: 'Demon Info',
    helpText:
      'If there are 7 or more players, wake the Demon: Show the THESE ARE YOUR MINIONS token. Point to all Minions. Show the THESE CHARACTERS ARE NOT IN PLAY token. Show 3 not-in-play good character tokens.',
    subActions: [
      {
        id: 'demoninfo-fn-1',
        description:
          'If there are 7 or more players, wake the Demon: Show the THESE ARE YOUR MINIONS token.',
        isConditional: true,
      },
      {
        id: 'demoninfo-fn-2',
        description: 'Point to all Minions.',
        isConditional: false,
      },
      {
        id: 'demoninfo-fn-3',
        description: 'Show the THESE CHARACTERS ARE NOT IN PLAY token.',
        isConditional: false,
      },
      {
        id: 'demoninfo-fn-4',
        description: 'Show 3 not-in-play good character tokens.',
        isConditional: false,
      },
    ],
  },
];

/** Structural entries for other nights (currently none — dusk/dawn were removed in M3). */
export const OTHER_NIGHTS_STRUCTURAL: NightOrderEntry[] = [];

/**
 * Build a complete night order array from character definitions + structural entries.
 *
 * Characters provide their own `order` number via `firstNight.order` or `otherNights.order`.
 * This function collects all characters that have a night action for the given phase,
 * converts them to `NightOrderEntry` format, merges with structural entries,
 * and sorts by order number.
 */
export function buildNightOrder(
  characters: CharacterDef[],
  isFirstNight: boolean,
): NightOrderEntry[] {
  const structural = isFirstNight ? FIRST_NIGHT_STRUCTURAL : OTHER_NIGHTS_STRUCTURAL;

  const characterEntries: NightOrderEntry[] = [];
  for (const char of characters) {
    const nightAction = isFirstNight ? char.firstNight : char.otherNights;
    if (!nightAction) continue;
    characterEntries.push({
      order: nightAction.order,
      type: 'character',
      id: char.id,
      name: char.name,
      helpText: nightAction.helpText,
      subActions: nightAction.subActions,
    });
  }

  return [...structural, ...characterEntries].sort((a, b) => a.order - b.order);
}
