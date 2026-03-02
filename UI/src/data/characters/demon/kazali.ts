import type { CharacterDef } from '@/types/index.ts';

export const kazali: CharacterDef = {
  id: 'kazali',
  name: 'Kazali',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort: '<TODO>',
  firstNight: {
    order: 7,
    helpText:
      'The Kazali chooses which players are which Minions. Wake each target. Show the YOU ARE and Minion tokens & give a thumbs-down.',
    subActions: [
      {
        id: 'kazali-fn-1',
        description: 'The Kazali chooses which players are which Minions.',
        isConditional: false,
      },
      {
        id: 'kazali-fn-2',
        description: 'Wake each target.',
        isConditional: false,
      },
      {
        id: 'kazali-fn-3',
        description: 'Show the YOU ARE and Minion tokens & give a thumbs-down.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 48,
    helpText: 'The Kazali chooses a player.',
    subActions: [
      {
        id: 'kazali-on-1',
        description: 'The Kazali chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#b71c1c' },
  reminders: [],
  storytellerSetup: [
    {
      id: 'kazali-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
