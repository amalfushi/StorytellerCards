import type { CharacterDef } from '@/types/index.ts';

export const nodashii: CharacterDef = {
  id: 'nodashii',
  name: 'No Dashii',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort: 'Each night*, choose a player: they die. Your 2 Townsfolk neighbors are poisoned.',
  firstNight: null,
  otherNights: {
    order: 39,
    helpText: 'The No Dashii chooses a player.',
    subActions: [
      {
        id: 'nodashii-on-1',
        description: 'The No Dashii chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#b71c1c' },
  reminders: [],
  storytellerSetup: [
    {
      id: 'nodashii-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
