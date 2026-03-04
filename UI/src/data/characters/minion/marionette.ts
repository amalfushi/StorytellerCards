import type { CharacterDef } from '@/types/index.ts';

export const marionette: CharacterDef = {
  id: 'marionette',
  name: 'Marionette',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'You think you are a good character, but you are not. The Demon knows who you are. [You neighbor the Demon]',
  abilityDetailed: `The Marionette doesn't know that they are a Minion.
• The Marionette draws either a Townsfolk or an Outsider token from the bag, but is secretly the Marionette.
• The Marionette neighbors the Demon. There are no players sitting in between the Marionette and the Demon.
• The Demon knows which player is the Marionette.
• On the first night, the Marionette does not wake to learn the other evil players, and the other Minions do not learn the Marionette.
• The good ability that the Marionette thinks they have doesn’t work, but the Storyteller pretends it does. It is just as if this player is the Drunk.
• The Marionette registers as evil, and as a Minion.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Marionette',
  firstNight: {
    order: 21,
    helpText:
      'Wake the Demon. Show the THIS PLAYER IS & Marionette tokens. Point to the Marionette.',
    subActions: [
      {
        id: 'marionette-fn-1',
        description: 'Wake the Demon.',
        isConditional: false,
      },
      {
        id: 'marionette-fn-2',
        description: 'Show the THIS PLAYER IS & Marionette tokens.',
        isConditional: false,
      },
      {
        id: 'marionette-fn-3',
        description: 'Point to the Marionette.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/marionetteIcon.png',
    medium: '/icons/characters/marionetteIcon.png',
    large: '/icons/characters/marionetteIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
};
