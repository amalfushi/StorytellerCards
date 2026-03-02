import type { CharacterDef } from '@/types/index.ts';

export const noble: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing 3 players, 1 and only 1 of which is evil.',
  firstNight: {
    order: 59,
    helpText: 'Point to the 3 players marked KNOW.',
    subActions: [
      {
        id: 'noble-fn-1',
        description: 'Point to the 3 players marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
