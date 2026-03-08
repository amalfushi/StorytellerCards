import type { CharacterDef } from '@/types/index.ts';

export const king: CharacterDef = {
  id: 'king',
  name: 'King',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, if the dead equal or outnumber the living, you learn 1 alive character. The Demon knows you are the King.',
  abilityDetailed: `The King learns which characters are still alive.
• The King gains this ability after a few nights have passed — once the dead players equal or outnumber the living.
• At the start of the game, the Demon learns who the King is. If a King is created mid-game, the Demon learns who the King is that night.
• The King may not survive long enough to use their ability. Once the number of dead players is equal to or greater than the number of alive players, the King learns one alive character each night.
• The King may learn good or evil characters, and may even learn the same character more than once.
• There may not be a Choirboy in play. But if there is, and they are still alive when the Demon kills the King, the Choirboy learns who the Demon is.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/King',
  firstNight: {
    order: 19,
    helpText: 'Wake the Demon: Show the THIS PLAYER IS & King tokens, then point to the King.',
    subActions: [
      {
        id: 'king-fn-1',
        description:
          'Wake the Demon: Show the THIS PLAYER IS & King tokens, then point to the King.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 80,
    helpText:
      'If the dead equal or outnumber the living, show the character token of a living player.',
    subActions: [
      {
        id: 'king-on-1',
        description:
          'If the dead equal or outnumber the living, show the character token of a living player.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/kingIcon.webp',
    medium: '/icons/characters/kingIcon.webp',
    large: '/icons/characters/kingIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'If the Leviathan is in play, and at least 1 player is dead, the King learns an alive character each night.',
    },
    {
      characterId: 'riot',
      description:
        'If Riot is in play, and at least 1 player is dead, the King learns an alive character each night.',
    },
  ],
  flavor:
    'Betwixt the unknown strains of mortal strife / And morbid night, sweet with mystery and woe / Lies unfettered joys of fate’s long and colored life / Who’s garden blooms with each painted Face to Show.',
  edition: 'carousel',
};
