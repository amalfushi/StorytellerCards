import type { CharacterDef } from '@/types/index.ts';

export const klutz: CharacterDef = {
  id: 'klutz',
  name: 'Klutz',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'When you learn that you died, publicly choose 1 alive player: if they are evil, your team loses.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#42a5f5' },
  reminders: [],
};
