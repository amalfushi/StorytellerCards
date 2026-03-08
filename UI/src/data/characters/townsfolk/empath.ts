import type { CharacterDef } from '@/types/index.ts';

export const empath: CharacterDef = {
  id: 'empath',
  name: 'Empath',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night, you learn how many of your 2 alive neighbors are evil.',
  abilityDetailed: `The Empath keeps learning if their living neighbours are good or evil.
• The Empath only learns how many of their neighbours are evil, not which one is evil.
• The Empath does not detect dead players. So, if the Empath is sitting next to a dead player, they do not get info about that dead player. Instead, they get info about the closest alive player in that direction.
• The Empath acts after the Demon, so if the Demon kills one of the Empath's alive neighbours, the Empath does not learn about the now-dead player. The Empath's information is accurate at dawn, not at dusk.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Empath',
  firstNight: {
    order: 50,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'empath-fn-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 69,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'empath-on-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/empathIcon.webp',
    medium: '/icons/characters/empathIcon.webp',
    large: '/icons/characters/empathIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor: 'My skin prickles. Something is not right here. I can feel it.',
  edition: 'tb',
};
