import type { CharacterDef } from '@/types/index.ts';

export const imp: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.',
  firstNight: null,
  otherNights: {
    order: 33,
    helpText:
      'The Imp chooses a player. If the Imp chose themselves: Replace 1 alive Minion token with a spare Imp token. Put the old Imp to sleep. Wake the new Imp. Show the YOU ARE token, then show the Imp token.',
    subActions: [
      {
        id: 'imp-on-1',
        description: 'The Imp chooses a player.',
        isConditional: false,
      },
      {
        id: 'imp-on-2',
        description:
          'If the Imp chose themselves: Replace 1 alive Minion token with a spare Imp token.',
        isConditional: true,
      },
      {
        id: 'imp-on-3',
        description: 'Put the old Imp to sleep.',
        isConditional: false,
      },
      {
        id: 'imp-on-4',
        description: 'Wake the new Imp.',
        isConditional: false,
      },
      {
        id: 'imp-on-5',
        description: 'Show the YOU ARE token, then show the Imp token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#b71c1c' },
  reminders: [],
  storytellerSetup: [
    {
      id: 'imp-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
