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
    small: '/icons/characters/saintIcon.png',
    medium: '/icons/characters/saintIcon.png',
    large: '/icons/characters/saintIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
};
