import type { CharacterDef } from '@/types/index.ts';

export const clockmaker: CharacterDef = {
  id: 'clockmaker',
  name: 'Clockmaker',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing how many steps from the Demon to its nearest Minion.',
  abilityDetailed: `The Clockmaker learns the distance from the Demon to their nearest Minion.
• The Clockmaker only learns this on the first night.
• The distance is the number of seated players, starting from the player next to the Demon and ending at the nearest Minion, either clockwise or counterclockwise.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Clockmaker',
  firstNight: {
    order: 54,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'clockmaker-fn-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/clockmakerIcon.webp',
    medium: '/icons/characters/clockmakerIcon.webp',
    large: '/icons/characters/clockmakerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'summoner',
      description: 'The Summoner registers as the Demon to the Clockmaker.',
    },
  ],
  flavor:
    'Do not disturb me. The tick must continue, for the circle is a symbol of life and contains all things - all answers - in its divine machinery. I must work.',
  edition: 'snv',
};
