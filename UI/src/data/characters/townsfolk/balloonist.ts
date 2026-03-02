import type { CharacterDef } from '@/types/index.ts';

export const balloonist: CharacterDef = {
  id: 'balloonist',
  name: 'Balloonist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, you learn a player of a different character type than last night. [+0 or +1 Outsider]',
  firstNight: {
    order: 60,
    helpText: 'Point to any player.',
    subActions: [
      {
        id: 'balloonist-fn-1',
        description: 'Point to any player.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 78,
    helpText: 'Point to a player with a different character type to the previously shown player.',
    subActions: [
      {
        id: 'balloonist-on-1',
        description:
          'Point to a player with a different character type to the previously shown player.',
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
