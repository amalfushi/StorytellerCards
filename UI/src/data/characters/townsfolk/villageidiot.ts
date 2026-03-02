import type { CharacterDef } from '@/types/index.ts';

export const villageidiot: CharacterDef = {
  id: 'villageidiot',
  name: 'Village Idiot',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 62,
    helpText:
      'If there are multiple Village Idiots, mark one as DRUNK. Wake the Village Idiots one at a time to choose a player. Give a thumb signal.',
    subActions: [
      {
        id: 'villageidiot-fn-1',
        description: 'If there are multiple Village Idiots, mark one as DRUNK.',
        isConditional: true,
      },
      {
        id: 'villageidiot-fn-2',
        description: 'Wake the Village Idiots one at a time to choose a player.',
        isConditional: false,
      },
      {
        id: 'villageidiot-fn-3',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 79,
    helpText: 'Wake the Village Idiots one at a time to choose a player. Give a thumb signal.',
    subActions: [
      {
        id: 'villageidiot-on-1',
        description: 'Wake the Village Idiots one at a time to choose a player.',
        isConditional: false,
      },
      {
        id: 'villageidiot-on-2',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
