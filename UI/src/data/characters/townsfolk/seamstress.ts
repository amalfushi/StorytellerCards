import type { CharacterDef } from '@/types/index.ts';

export const seamstress: CharacterDef = {
  id: 'seamstress',
  name: 'Seamstress',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 56,
    helpText: 'The Seamstress might choose 2 players. Nod or shake your head.',
    subActions: [
      {
        id: 'seamstress-fn-1',
        description: 'The Seamstress might choose 2 players.',
        isConditional: false,
      },
      {
        id: 'seamstress-fn-2',
        description: 'Nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 76,
    helpText: 'The Seamstress might choose 2 players. Nod or shake your head.',
    subActions: [
      {
        id: 'seamstress-on-1',
        description: 'The Seamstress might choose 2 players.',
        isConditional: false,
      },
      {
        id: 'seamstress-on-2',
        description: 'Nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
