import type { CharacterDef } from '@/types/index.ts';

export const farmer: CharacterDef = {
  id: 'farmer',
  name: 'Farmer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: null,
  otherNights: {
    order: 63,
    helpText:
      'If the Farmer died tonight, wake a living good player. Show the YOU ARE info token and a Farmer token.',
    subActions: [
      {
        id: 'farmer-on-1',
        description: 'If the Farmer died tonight, wake a living good player.',
        isConditional: true,
      },
      {
        id: 'farmer-on-2',
        description: 'Show the YOU ARE info token and a Farmer token.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
