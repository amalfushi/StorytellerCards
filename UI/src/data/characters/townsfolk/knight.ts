import type { CharacterDef } from '@/types/index.ts';

export const knight: CharacterDef = {
  id: 'knight',
  name: 'Knight',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 58,
    helpText: 'Point to the 2 players marked KNOW.',
    subActions: [
      {
        id: 'knight-fn-1',
        description: 'Point to the 2 players marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
