import type { CharacterDef } from '@/types/index.ts';

export const investigator: CharacterDef = {
  id: 'investigator',
  name: 'Investigator',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing that 1 of 2 players is a particular Minion.',
  abilityDetailed: `The Investigator learns that a particular Minion character is in play, but not exactly which player it is.
• During the first night, the Investigator learns that one of two players is a specific Minion.
• They learn this only once and then learn nothing more.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Investigator',
  firstNight: {
    order: 48,
    helpText: 'Show the Minion character token. Point to both the MINION and WRONG players.',
    subActions: [
      {
        id: 'investigator-fn-1',
        description: 'Show the Minion character token.',
        isConditional: false,
      },
      {
        id: 'investigator-fn-2',
        description: 'Point to both the MINION and WRONG players.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/investigatorIcon.webp',
    medium: '/icons/characters/investigatorIcon.webp',
    large: '/icons/characters/investigatorIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'investigator-minion', text: 'MINION' },
    { id: 'investigator-wrong', text: 'WRONG' },
  ],
  jinxes: [
    {
      characterId: 'vizier',
      description: "The Storyteller doesn't declare the Vizier is in play.",
    },
  ],
  flavor:
    "It is a fine night for a stroll, wouldn't you say, Mister Morozov? Or should I say... BARON Morozov?",
  edition: 'tb',
};
