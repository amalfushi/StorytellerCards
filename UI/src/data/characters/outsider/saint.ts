import type { CharacterDef } from '@/types/index.ts';

export const saint: CharacterDef = {
  id: 'saint',
  name: 'Saint',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'If you die by execution, your team loses.',
  abilityDetailed: `The Saint ends the game if they are executed.
• If the Saint dies by execution, the game ends. Good loses and evil wins.
• If the Saint dies in any way other than execution—such as the Demon killing them—then the game continues.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Saint',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/saintIcon.webp',
    medium: '/icons/characters/saintIcon.webp',
    large: '/icons/characters/saintIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  flavor:
    'Wisdom begets peace. Patience begets wisdom. Fear not, for the time shall come when fear too shall pass. Let us pray, and may the unity of our vision make saints of us all.',
  edition: 'tb',
};
