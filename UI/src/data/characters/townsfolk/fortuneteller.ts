import type { CharacterDef } from '@/types/index.ts';

export const fortuneteller: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
  firstNight: {
    order: 51,
    helpText:
      'The Fortune Teller chooses 2 players. Nod if either is the Demon (or the RED HERRING).',
    subActions: [
      {
        id: 'fortuneteller-fn-1',
        description: 'The Fortune Teller chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'fortuneteller-fn-2',
        description: 'Nod if either is the Demon (or the RED HERRING).',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 70,
    helpText:
      'The Fortune Teller chooses 2 players. Nod if either is the Demon (or the RED HERRING).',
    subActions: [
      {
        id: 'fortuneteller-on-1',
        description: 'The Fortune Teller chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'fortuneteller-on-2',
        description: 'Nod if either is the Demon (or the RED HERRING).',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
