import type { CharacterDef } from '@/types/index.ts';

export const savant: CharacterDef = {
  id: 'savant',
  name: 'Savant',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each day, you may visit the Storyteller to learn 2 things in private: 1 is true & 1 is false.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
