import type { CharacterDef } from '@/types/index.ts';

export const cerenovus: CharacterDef = {
  id: 'cerenovus',
  name: 'Cerenovus',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose a player & a good character: they are "mad" they are this character tomorrow, or might be executed.',
  abilityDetailed: `The Cerenovus encourages players to pretend to be different characters than they actually are.
• The Cerenovus chooses Townsfolk or Outsiders that players are mad about being. They must try to convince the group that they actually are this character tomorrow, or else die.
• Simply hinting is not enough to avoid death. The player must make a decent effort to convince the group. Mad players are never literally forced to say things they don’t want to—but if the Storyteller doesn’t hear them make an effort, they pay the price.
• Mad evil players might be executed this way, but “might” means you can choose not to, to prevent evil from winning by this strategy.
• Like the Mutant, an execution penalty counts as the one execution allowed per day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Cerenovus',
  firstNight: {
    order: 37,
    helpText:
      'The Cerenovus chooses a player & a character. Put the Cerenovus to sleep. Wake the target. Show the THIS CHARACTER SELECTED YOU token, the Cerenovus token, then the madness-character token.',
    subActions: [
      {
        id: 'cerenovus-fn-1',
        description: 'The Cerenovus chooses a player & a character.',
        isConditional: false,
      },
      {
        id: 'cerenovus-fn-2',
        description: 'Put the Cerenovus to sleep.',
        isConditional: false,
      },
      {
        id: 'cerenovus-fn-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'cerenovus-fn-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Cerenovus token, then the madness-character token.',
        isConditional: false,
      },
    ],
    choices: [
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
      { type: 'character', maxSelections: 1, label: 'Choose a character' },
    ],
  },
  otherNights: {
    order: 21,
    helpText:
      'The Cerenovus chooses a player & a character. Put the Cerenovus to sleep. Wake the target. Show the THIS CHARACTER SELECTED YOU token, the Cerenovus token, then the madness-character token.',
    subActions: [
      {
        id: 'cerenovus-on-1',
        description: 'The Cerenovus chooses a player & a character.',
        isConditional: false,
      },
      {
        id: 'cerenovus-on-2',
        description: 'Put the Cerenovus to sleep.',
        isConditional: false,
      },
      {
        id: 'cerenovus-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'cerenovus-on-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Cerenovus token, then the madness-character token.',
        isConditional: false,
      },
    ],
    choices: [
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
      { type: 'character', maxSelections: 1, label: 'Choose a character' },
    ],
  },
  icon: {
    small: '/icons/characters/cerenovusIcon.webp',
    medium: '/icons/characters/cerenovusIcon.webp',
    large: '/icons/characters/cerenovusIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'goblin',
      description: 'The Cerenovus may choose to make a player mad that they are the Goblin.',
    },
  ],
  flavor: 'Reality is merely an opinion. Specifically, my opinion.',
  edition: 'snv',
};
