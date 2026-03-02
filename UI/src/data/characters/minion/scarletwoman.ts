import type { CharacterDef } from '@/types/index.ts';

export const scarletwoman: CharacterDef = {
  id: 'scarletwoman',
  name: 'Scarlet Woman',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    "If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don't count)",
  firstNight: null,
  otherNights: {
    order: 26,
    helpText:
      'If the Scarlet Woman became the Demon today, show them the YOU ARE token, then the Demon token.',
    subActions: [
      {
        id: 'scarletwoman-on-1',
        description:
          'If the Scarlet Woman became the Demon today, show them the YOU ARE token, then the Demon token.',
        isConditional: true,
      },
    ],
  },
  icon: { placeholder: '#d32f2f' },
  reminders: [],
};
