import type { CharacterDef } from '@/types/index.ts';

export const poisoner: CharacterDef = {
  id: 'poisoner',
  name: 'Poisoner',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: {
    order: 27,
    helpText: 'The Poisoner chooses a player.',
    subActions: [
      {
        id: 'poisoner-fn-1',
        description: 'The Poisoner chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 10,
    helpText: 'The Poisoner chooses a player.',
    subActions: [
      {
        id: 'poisoner-on-1',
        description: 'The Poisoner chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#e53935' },
  reminders: [],
};
