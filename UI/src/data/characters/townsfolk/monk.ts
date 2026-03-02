import type { CharacterDef } from '@/types/index.ts';

export const monk: CharacterDef = {
  id: 'monk',
  name: 'Monk',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: null,
  otherNights: {
    order: 17,
    helpText: 'The Monk chooses a player.',
    subActions: [
      {
        id: 'monk-on-1',
        description: 'The Monk chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
