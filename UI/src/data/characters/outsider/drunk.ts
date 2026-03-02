import type { CharacterDef } from '@/types/index.ts';

export const drunk: CharacterDef = {
  id: 'drunk',
  name: 'Drunk',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.',
  firstNight: null,
  otherNights: null,
  icon: { placeholder: '#42a5f5' },
  reminders: [],
  storytellerSetup: [
    {
      id: 'drunk-assignment',
      description: 'Choose a Townsfolk character. The Drunk thinks they are this character.',
    },
  ],
};
