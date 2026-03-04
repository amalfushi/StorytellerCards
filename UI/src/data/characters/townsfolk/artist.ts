import type { CharacterDef } from '@/types/index.ts';

export const artist: CharacterDef = {
  id: 'artist',
  name: 'Artist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Once per game, during the day, privately ask the Storyteller any yes/no question.',
  abilityDetailed: `The Artist may ask any 1 question, and get an honest answer.
• The question may deal with anything at all, phrased in any way they want. The Storyteller honestly answers “yes,” “no,” or “I don’t know.”
• It is up to the Artist to talk with the Storyteller, not the other way around. This isn’t a public conversation, and the group can’t listen in. It’s private.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Artist',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/artistIcon.png',
    medium: '/icons/characters/artistIcon.png',
    large: '/icons/characters/artistIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'artist-noability', text: 'NO ABILITY' }],
};
