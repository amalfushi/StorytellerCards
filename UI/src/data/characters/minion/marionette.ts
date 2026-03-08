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
    small: '/icons/characters/marionetteIcon.webp',
    medium: '/icons/characters/marionetteIcon.webp',
    large: '/icons/characters/marionetteIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alchemist',
      description: 'An Alchemist-Marionette has no Marionette ability & the Marionette is in play.',
    },
    {
      characterId: 'magician',
      description:
        "If the Magician is alive, the Demon doesn't know which neighbor is the Marionette.",
    },
    {
      characterId: 'mathematician',
      description:
        "The Mathematician might learn if the Marionette's ability yielded false info or failed to work properly.",
    },
    {
      characterId: 'plaguedoctor',
      description:
        "If the Storyteller would gain the Marionette ability, one of the Demon's good neighbors becomes the Marionette.",
    },
    {
      characterId: 'summoner',
      description:
        'If there would be a Marionette in play, they enter play after the Demon & must start as their neighbor.',
    },
    {
      characterId: 'lilmonsta',
      description:
        'If there would be a Marionette in play, they enter play after the Demon & must start as their neighbor.',
    },
  ],
  flavor: "Words, words. They're all we have to go on.",
  edition: 'carousel',
  setup: true,
  remindersGlobal: [
    { id: 'marionette-global-isthemarionette', text: 'Is The Marionette', isGlobal: true },
  ],
};
