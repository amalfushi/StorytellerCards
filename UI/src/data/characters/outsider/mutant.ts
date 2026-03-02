import type { CharacterDef } from '@/types/index.ts';

export const mutant: CharacterDef = {
  id: 'mutant',
  name: 'Mutant',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'If you are "mad" about being an Outsider, you might be executed.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#42a5f5' },
  reminders: [],
};
