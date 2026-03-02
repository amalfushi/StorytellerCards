import type { CharacterDef } from '@/types/index.ts';

export const steward: CharacterDef = {
  id: 'steward',
  name: 'Steward',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 57,
    helpText: 'Point to the player marked KNOW.',
    subActions: [
      {
        id: 'steward-fn-1',
        description: 'Point to the player marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
