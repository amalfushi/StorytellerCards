import type { CharacterDef } from '@/types/index.ts';

export const golem: CharacterDef = {
  id: 'golem',
  name: 'Golem',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'You may only nominate once per game. When you do, if the nominee is not the Demon, they die.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#42a5f5' },
  reminders: [],
};
