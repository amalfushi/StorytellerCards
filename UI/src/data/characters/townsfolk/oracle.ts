import type { CharacterDef } from '@/types/index.ts';

export const oracle: CharacterDef = {
  id: 'oracle',
  name: 'Oracle',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night*, you learn how many dead players are evil.',
  firstNight: null,
  otherNights: {
    order: 75,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'oracle-on-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
