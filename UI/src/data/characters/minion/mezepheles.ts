import type { CharacterDef } from '@/types/index.ts';

export const mezepheles: CharacterDef = {
  id: 'mezepheles',
  name: 'Mezepheles',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: {
    order: 40,
    helpText: 'Show the secret word.',
    subActions: [
      {
        id: 'mezepheles-fn-1',
        description: 'Show the secret word.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 25,
    helpText:
      'If a good player said the secret word, wake the player. Show the YOU ARE info token & give a thumbs-down.',
    subActions: [
      {
        id: 'mezepheles-on-1',
        description: 'If a good player said the secret word, wake the player.',
        isConditional: true,
      },
      {
        id: 'mezepheles-on-2',
        description: 'Show the YOU ARE info token & give a thumbs-down.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#e53935' },
  reminders: [],
};
