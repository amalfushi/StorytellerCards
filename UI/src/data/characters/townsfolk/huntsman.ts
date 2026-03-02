import type { CharacterDef } from '@/types/index.ts';

export const huntsman: CharacterDef = {
  id: 'huntsman',
  name: 'Huntsman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose a living player: the Damsel, if chosen, becomes a not-in-play Townsfolk. [+the Damsel]',
  firstNight: {
    order: 43,
    helpText:
      'The Huntsman might choose a player. If they chose the Damsel: Put the Huntsman to sleep. Wake the target. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'huntsman-fn-1',
        description: 'The Huntsman might choose a player.',
        isConditional: false,
      },
      {
        id: 'huntsman-fn-2',
        description: 'If they chose the Damsel: Put the Huntsman to sleep.',
        isConditional: true,
      },
      {
        id: 'huntsman-fn-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'huntsman-fn-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 60,
    helpText:
      'The Huntsman might choose a player. If they chose the Damsel: Put the Huntsman to sleep. Wake the target. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'huntsman-on-1',
        description: 'The Huntsman might choose a player.',
        isConditional: false,
      },
      {
        id: 'huntsman-on-2',
        description: 'If they chose the Damsel: Put the Huntsman to sleep.',
        isConditional: true,
      },
      {
        id: 'huntsman-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'huntsman-on-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
