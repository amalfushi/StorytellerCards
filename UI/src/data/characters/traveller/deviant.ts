import type { CharacterDef } from '@/types/index.ts';

export const deviant: CharacterDef = {
  id: 'deviant',
  name: 'Deviant',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort: 'If you were funny today, you cannot die by exile.',
  abilityDetailed: `The Deviant can avoid being Exiled - as long as the Deviant player has been amusing today.
• The Deviant can amuse the group in any way they choose. Generally, verbal means such as jokes, funny stories, or witty remarks will suffice.
• The Storyteller is the judge of whether the Deviant was funny or not.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Deviant',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/deviantIcon.png',
    medium: '/icons/characters/deviantIcon.png',
    large: '/icons/characters/deviantIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
