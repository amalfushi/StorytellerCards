import type { CharacterDef } from '@/types/index.ts';

export const washerwoman: CharacterDef = {
  id: 'washerwoman',
  name: 'Washerwoman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
  abilityDetailed: `The Washerwoman learns that a specific Townsfolk is in play, but not who is playing them.
• During the first night, the Washerwoman is woken, shown two players, and learns the character of one of them.
• They learn this only once and then learn nothing more.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Washerwoman',
  firstNight: {
    order: 46,
    helpText: 'Show the Townsfolk character token. Point to both the TOWNSFOLK and WRONG players.',
    subActions: [
      {
        id: 'washerwoman-fn-1',
        description: 'Show the Townsfolk character token.',
        isConditional: false,
      },
      {
        id: 'washerwoman-fn-2',
        description: 'Point to both the TOWNSFOLK and WRONG players.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/washerwomanIcon.png',
    medium: '/icons/characters/washerwomanIcon.png',
    large: '/icons/characters/washerwomanIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'washerwoman-townsfolk', text: 'TOWNSFOLK' },
    { id: 'washerwoman-wrong', text: 'WRONG' },
  ],
};
