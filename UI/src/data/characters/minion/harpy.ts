import type { CharacterDef } from '@/types/index.ts';

export const harpy: CharacterDef = {
  id: 'harpy',
  name: 'Harpy',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: {
    order: 39,
    helpText:
      'The Harpy chooses 2 players. Put the Harpy to sleep. Wake the 1st target. Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
    subActions: [
      {
        id: 'harpy-fn-1',
        description: 'The Harpy chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-2',
        description: 'Put the Harpy to sleep.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-3',
        description: 'Wake the 1st target.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 24,
    helpText:
      'The Harpy chooses 2 players. Put the Harpy to sleep. Wake the 1st target. Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
    subActions: [
      {
        id: 'harpy-on-1',
        description: 'The Harpy chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'harpy-on-2',
        description: 'Put the Harpy to sleep.',
        isConditional: false,
      },
      {
        id: 'harpy-on-3',
        description: 'Wake the 1st target.',
        isConditional: false,
      },
      {
        id: 'harpy-on-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: { placeholder: '#e53935' },
  reminders: [],
};
