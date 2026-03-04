import type { CharacterDef } from '@/types/index.ts';

export const ferryman: CharacterDef = {
  id: 'ferryman',
  name: 'Ferryman',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort: 'On the final day, all dead players regain their vote token.',
  abilityDetailed: `Use the Ferryman to create a fun and inclusive climax to the game even if new players have used their vote tokens.
• If you are running a game for newer players who don’t yet grasp the strategy of when to use their dead votes, or have used them when they forgot they were dead, you can add the Ferryman. This will ensure everyone gets a say in the final day’s critical votes.
• All dead players regain their vote tokens on the final day, regardless of alignment or when they voted.
• If a dead player still has their vote token, they do not get a second one from the Ferryman.
• The final day is the day that the Storyteller thinks is most likely to be the last day of the game – the day where, if the Demon is not executed, evil will win. This most likely means the day with only 3 living players remaining.
• If vote tokens are used on the final day, they aren’t returned.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Ferryman',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/ferrymanIcon.png',
    medium: '/icons/characters/ferrymanIcon.png',
    large: '/icons/characters/ferrymanIcon.png',
    placeholder: '#ff9800',
  },
  reminders: [],
};
