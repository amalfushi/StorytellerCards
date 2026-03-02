import type { CharacterDef } from '@/types/index.ts';

export const marionette: CharacterDef = {
  id: 'marionette',
  name: 'Marionette',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'You think you are a good character, but you are not. The Demon knows who you are. [You neighbor the Demon]',
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
  icon: { placeholder: '#d32f2f' },
  reminders: [],
};
