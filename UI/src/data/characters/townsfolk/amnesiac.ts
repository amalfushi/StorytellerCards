import type { CharacterDef } from '@/types/index.ts';

export const amnesiac: CharacterDef = {
  id: 'amnesiac',
  name: 'Amnesiac',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: '<TODO>',
  firstNight: {
    order: 45,
    helpText: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
    subActions: [
      {
        id: 'amnesiac-fn-1',
        description: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 62,
    helpText: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
    subActions: [
      {
        id: 'amnesiac-on-1',
        description: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
        isConditional: false,
      },
    ],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
