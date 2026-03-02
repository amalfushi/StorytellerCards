import type { CharacterDef } from '@/types/index.ts';

export const slayer: CharacterDef = {
  id: 'slayer',
  name: 'Slayer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
