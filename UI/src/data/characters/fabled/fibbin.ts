import type { CharacterDef } from '@/types/index.ts';

export const fibbin: CharacterDef = {
  id: 'fibbin',
  name: 'Fibbin',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort: 'Once per game, 1 good player might get incorrect information.',
  abilityDetailed: `Add the Fibbin if your script has too much information or no possibility of misinformation.
• If you create a character list and it has no characters that cause drunkenness, poisoning, or other ways for information to be false, then you may want to add the Fibbin. Whilst it is not necessary, even a minor chance of a good player’s information being incorrect can drastically help the evil players bluff.
• The Fibbin does not make an ability fail in the way that drunkenness and poisoning do. It only affects abilities that provide information from the Storyteller signaling to a player during the night or telling them something.
• If the game ends before you have given a good player incorrect information, that’s okay.
• Some characters get false information due to their ability. The Fibbin can make this information true.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fibbin',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/fibbinIcon.webp',
    medium: '/icons/characters/fibbinIcon.webp',
    large: '/icons/characters/fibbinIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [{ id: 'fibbin-noability', text: 'NO ABILITY' }],
  flavor: 'Tee-hee-hee. Tee. Hee. Hee.',
  edition: 'fabled',
};
