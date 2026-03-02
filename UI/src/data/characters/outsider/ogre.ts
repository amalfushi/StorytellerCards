import type { CharacterDef } from '@/types/index.ts';

export const ogre: CharacterDef = {
  id: 'ogre',
  name: 'Ogre',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 67,
    helpText: 'The Ogre chooses a player.',
    subActions: [
      {
        id: 'ogre-fn-1',
        description: 'The Ogre chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: null,
  icon: { placeholder: '#1565c0' },
  reminders: [],
};
