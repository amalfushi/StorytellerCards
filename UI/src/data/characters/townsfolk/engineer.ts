import type { CharacterDef } from '@/types/index.ts';

export const engineer: CharacterDef = {
  id: 'engineer',
  name: 'Engineer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Once per game, at night, choose which Minions or which Demon is in play.',
  abilityDetailed: `The Engineer manufactures the threat that the town faces.
• The Engineer can choose which Minion characters are in play, or which Demon is in play, but not both.
• When the Engineer creates new in-play characters, the Demon player remains the Demon, and the Minion players remain Minions. The number of evil players stays the same.
• If the Engineer tries to create an in-play character, that character stays as the same player. The Engineer doesn’t learn this, and may not use their ability again.
• If creating Minions, the Engineer chooses the same number of Minions that should be in play for the number of players (see the Traveller sheet or the setup sheet).
• If the Engineer accidentally chooses too many or too few characters, the Storyteller changes as many evil players’ characters as is fair and feasible.
• Only characters from the current script may be chosen.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Engineer',
  firstNight: {
    order: 22,
    helpText:
      'The Engineer might choose Minions or Demons. Put the Engineer to sleep. Wake the target(s) one at a time. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'engineer-fn-1',
        description: 'The Engineer might choose Minions or Demons.',
        isConditional: false,
      },
      {
        id: 'engineer-fn-2',
        description: 'Put the Engineer to sleep.',
        isConditional: false,
      },
      {
        id: 'engineer-fn-3',
        description: 'Wake the target(s) one at a time.',
        isConditional: false,
      },
      {
        id: 'engineer-fn-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 7,
    helpText:
      'The Engineer might choose Minions or Demons. Put the Engineer to sleep. Wake the target(s) one at a time. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'engineer-on-1',
        description: 'The Engineer might choose Minions or Demons.',
        isConditional: false,
      },
      {
        id: 'engineer-on-2',
        description: 'Put the Engineer to sleep.',
        isConditional: false,
      },
      {
        id: 'engineer-on-3',
        description: 'Wake the target(s) one at a time.',
        isConditional: false,
      },
      {
        id: 'engineer-on-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/engineerIcon.webp',
    medium: '/icons/characters/engineerIcon.webp',
    large: '/icons/characters/engineerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'engineer-noability', text: 'NO ABILITY' }],
  jinxes: [
    {
      characterId: 'legion',
      description:
        'If Legion is created, all evil players become Legion. If Legion is in play, the Engineer starts knowing this but has no ability.',
    },
    {
      characterId: 'summoner',
      description:
        'If the living Summoner is removed from play, the Storyteller has the Summoner ability.',
    },
  ],
  flavor: 'If it bends, great. If it breaks, well, it probably needed fixing anyway.',
  edition: 'carousel',
};
