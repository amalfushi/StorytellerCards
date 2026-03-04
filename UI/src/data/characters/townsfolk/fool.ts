import type { CharacterDef } from '@/types/index.ts';

export const fool: CharacterDef = {
  id: 'fool',
  name: 'Fool',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: "The 1st time you die, you don't.",
  abilityDetailed: `The Fool escapes death... once.
• The first time the Fool dies for any reason, the Fool remains alive. They don’t learn that their ability saved their life.
• If another character’s ability protects the Fool from death, the Fool does not use their ability. Only the time that the Fool would actually for realsy bona fide be dead does the Fool’s ability trigger.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fool',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/foolIcon.png',
    medium: '/icons/characters/foolIcon.png',
    large: '/icons/characters/foolIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'fool-noability', text: 'NO ABILITY' }],
};
