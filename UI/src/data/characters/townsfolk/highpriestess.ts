import type { CharacterDef } from '@/types/index.ts';

export const highpriestess: CharacterDef = {
  id: 'highpriestess',
  name: 'High Priestess',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night, learn which player the Storyteller believes you should talk to most.',
  firstNight: {
    order: 68,
    helpText: 'Point to a player.',
    subActions: [
      {
        id: 'highpriestess-fn-1',
        description: 'Point to a player.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 86,
    helpText: 'Point to a player.',
    subActions: [
      {
        id: 'highpriestess-on-1',
        description: 'Point to a player.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
