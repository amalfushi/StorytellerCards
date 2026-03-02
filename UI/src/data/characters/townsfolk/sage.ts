import type { CharacterDef } from '@/types/index.ts';

export const sage: CharacterDef = {
  id: 'sage',
  name: 'Sage',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'If the Demon kills you, you learn that it is 1 of 2 players.',
  firstNight: null,
  otherNights: {
    order: 56,
    helpText:
      'If the Demon killed the Sage, wake the Sage and point to 2 players, 1 of which is the Demon.',
    subActions: [
      {
        id: 'sage-on-1',
        description:
          'If the Demon killed the Sage, wake the Sage and point to 2 players, 1 of which is the Demon.',
        isConditional: true,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
