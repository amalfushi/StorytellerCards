import type { CharacterDef } from '@/types/index.ts';

export const cannibal: CharacterDef = {
  id: 'cannibal',
  name: 'Cannibal',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You have the ability of the recently killed executee. If they are evil, you are poisoned until a good player dies by execution.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
