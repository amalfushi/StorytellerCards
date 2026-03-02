import type { CharacterDef } from '@/types/index.ts';

export const ojo: CharacterDef = {
  id: 'ojo',
  name: 'Ojo',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: null,
  otherNights: {
    order: 43,
    helpText: 'The Ojo chooses a character.',
    subActions: [
      {
        id: 'ojo-on-1',
        description: 'The Ojo chooses a character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  icon: { placeholder: '#b71c1c' },
  reminders: [],
  storytellerSetup: [
    {
      id: 'ojo-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
