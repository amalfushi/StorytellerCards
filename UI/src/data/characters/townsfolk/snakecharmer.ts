import type { CharacterDef } from '@/types/index.ts';

export const snakecharmer: CharacterDef = {
  id: 'snakecharmer',
  name: 'Snake Charmer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 31,
    helpText:
      'The Snake Charmer chooses a player. If they chose the Demon: Show the YOU ARE & Demon tokens. Give a thumbs down. Swap the Snake Charmer & Demon tokens. Put the old Snake Charmer to sleep. Wake the old Demon. Show the YOU ARE and Snake Charmer tokens & give a thumbs up.',
    subActions: [
      {
        id: 'snakecharmer-fn-1',
        description: 'The Snake Charmer chooses a player.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-fn-2',
        description: 'If they chose the Demon: Show the YOU ARE & Demon tokens.',
        isConditional: true,
      },
      {
        id: 'snakecharmer-fn-3',
        description: 'Give a thumbs down.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-fn-4',
        description: 'Swap the Snake Charmer & Demon tokens.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-fn-5',
        description: 'Put the old Snake Charmer to sleep.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-fn-6',
        description: 'Wake the old Demon.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-fn-7',
        description: 'Show the YOU ARE and Snake Charmer tokens & give a thumbs up.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 16,
    helpText:
      'The Snake Charmer chooses a player. If they chose the Demon: Show the YOU ARE & Demon tokens. Give a thumbs down. Swap the Snake Charmer & Demon tokens. Put the old Snake Charmer to sleep. Wake the old Demon. Show the YOU ARE and Snake Charmer tokens & give a thumbs up.',
    subActions: [
      {
        id: 'snakecharmer-on-1',
        description: 'The Snake Charmer chooses a player.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-on-2',
        description: 'If they chose the Demon: Show the YOU ARE & Demon tokens.',
        isConditional: true,
      },
      {
        id: 'snakecharmer-on-3',
        description: 'Give a thumbs down.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-on-4',
        description: 'Swap the Snake Charmer & Demon tokens.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-on-5',
        description: 'Put the old Snake Charmer to sleep.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-on-6',
        description: 'Wake the old Demon.',
        isConditional: false,
      },
      {
        id: 'snakecharmer-on-7',
        description: 'Show the YOU ARE and Snake Charmer tokens & give a thumbs up.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
