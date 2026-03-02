import type { CharacterDef } from '@/types/index.ts';

export const spy: CharacterDef = {
  id: 'spy',
  name: 'Spy',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: {
    order: 66,
    helpText: 'Show the Grimoire for as long as the Spy needs.',
    subActions: [
      {
        id: 'spy-fn-1',
        description: 'Show the Grimoire for as long as the Spy needs.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 85,
    helpText: 'Show the Grimoire for as long as the Spy needs.',
    subActions: [
      {
        id: 'spy-on-1',
        description: 'Show the Grimoire for as long as the Spy needs.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#e53935' },
  reminders: [],
};
