import type { CharacterDef } from '@/types/index.ts';

export const pixie: CharacterDef = {
  id: 'pixie',
  name: 'Pixie',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing 1 in-play Townsfolk. If you were mad that you were this character, you gain their ability when they die.',
  firstNight: {
    order: 42,
    helpText: 'Show the Townsfolk character token marked MAD.',
    subActions: [
      {
        id: 'pixie-fn-1',
        description: 'Show the Townsfolk character token marked MAD.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
