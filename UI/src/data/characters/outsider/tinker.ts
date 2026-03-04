import type { CharacterDef } from '@/types/index.ts';

export const tinker: CharacterDef = {
  id: 'tinker',
  name: 'Tinker',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'You might die at any time.',
  abilityDetailed: `The Tinker can die at any time, for no reason.
• The Storyteller may kill the Tinker at any time.
• The Tinker cannot die from their ability while protected from death, as normal.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Tinker',
  firstNight: null,
  otherNights: {
    order: 64,
    helpText: 'The Tinker might die.',
    subActions: [
      {
        id: 'tinker-on-1',
        description: 'The Tinker might die.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/tinkerIcon.png',
    medium: '/icons/characters/tinkerIcon.png',
    large: '/icons/characters/tinkerIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
};
