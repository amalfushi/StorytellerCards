import type { CharacterDef } from '@/types/index.ts';

export const seamstress: CharacterDef = {
  id: 'seamstress',
  name: 'Seamstress',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose 2 players (not yourself): you learn if they are the same alignment.',
  abilityDetailed: `The Seamstress learns whether 2 players are on the same team as each other.
• They only get this information once per game, so they had best choose wisely when and who.
• They may choose alive or dead players or even Travellers.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Seamstress',
  firstNight: {
    order: 56,
    helpText: 'The Seamstress might choose 2 players. Nod or shake your head.',
    subActions: [
      {
        id: 'seamstress-fn-1',
        description: 'The Seamstress might choose 2 players.',
        isConditional: false,
      },
      {
        id: 'seamstress-fn-2',
        description: 'Nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 76,
    helpText: 'The Seamstress might choose 2 players. Nod or shake your head.',
    subActions: [
      {
        id: 'seamstress-on-1',
        description: 'The Seamstress might choose 2 players.',
        isConditional: false,
      },
      {
        id: 'seamstress-on-2',
        description: 'Nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: {
    small: '/icons/characters/seamstressIcon.png',
    medium: '/icons/characters/seamstressIcon.png',
    large: '/icons/characters/seamstressIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
