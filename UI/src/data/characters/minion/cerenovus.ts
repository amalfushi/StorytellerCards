import type { CharacterDef } from '@/types/index.ts';

export const cerenovus: CharacterDef = {
  id: 'cerenovus',
  name: 'Cerenovus',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose a player & a good character: they are "mad" they are this character tomorrow, or might be executed.',
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
  icon: { placeholder: '#d32f2f' },
  reminders: [],
};
