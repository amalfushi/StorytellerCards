import type { CharacterDef } from '@/types/index.ts';

export const baron: CharacterDef = {
  id: 'baron',
  name: 'Baron',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'There are extra Outsiders in play. [+2 Outsiders]',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#d32f2f' },
  reminders: [],
  setupModification: {
    description: 'There are extra Outsiders in play. [+2 Outsiders]',
  },
};
