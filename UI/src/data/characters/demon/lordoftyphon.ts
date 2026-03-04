import type { CharacterDef } from '@/types/index.ts';

export const lordoftyphon: CharacterDef = {
  id: 'lordoftyphon',
  name: 'Lord of Typhon',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. [Evil characters are in a line. You are in the middle. +1 Minion. -? to +? Outsiders]',
  abilityDetailed: `The Lord of Typhon is surrounded by Minions.
• All evil characters sit next to each other in a continuous line.
• All evil characters must be in the line at setup.
• Evil Travellers and Evil Townsfolk may be part of the line, but do not have to be.
• The Lord of Typhon must have an evil character on both sides. They cannot sit at the end of the line of evil characters.
• The evil team starts with one additional Minion when the Lord of Typhon is in play.
• Any number of Outsiders might be in play.
• Like the Marionette, the Storyteller decides which players are Minions during setup. The Storyteller also decides which player is which Minion.
• If a Lord of Typhon is created mid game, the Lord of Typhon does not need to sit in a line with the evil characters.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Lord_of_Typhon',
  firstNight: {
    order: 6,
    helpText:
      "Wake the Lord of Typhon's neighbors. Show the YOU ARE and Minion tokens & give a thumbs-down.",
    subActions: [
      {
        id: 'lordoftyphon-fn-1',
        description: "Wake the Lord of Typhon's neighbors.",
        isConditional: false,
      },
      {
        id: 'lordoftyphon-fn-2',
        description: 'Show the YOU ARE and Minion tokens & give a thumbs-down.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 41,
    helpText: 'The Lord of Typhon chooses a player.',
    subActions: [
      {
        id: 'lordoftyphon-on-1',
        description: 'The Lord of Typhon chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/lordoftyphonIcon.png',
    medium: '/icons/characters/lordoftyphonIcon.png',
    large: '/icons/characters/lordoftyphonIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'summoner',
      description:
        'If a Lord of Typhon is summoned, they must neighbor a Minion & their other neighbor becomes an evil Minion.',
    },
  ],
};
