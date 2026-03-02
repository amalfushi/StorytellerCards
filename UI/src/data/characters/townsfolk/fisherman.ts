import type { CharacterDef } from '@/types/index.ts';

export const fisherman: CharacterDef = {
  id: 'fisherman',
  name: 'Fisherman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, during the day, visit the Storyteller for some advice to help your team win.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
