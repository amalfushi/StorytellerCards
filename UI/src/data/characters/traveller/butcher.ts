import type { CharacterDef } from '@/types/index.ts';

export const butcher: CharacterDef = {
  id: 'butcher',
  name: 'Butcher',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort: 'Each day, after the 1st execution, you may nominate again.',
  abilityDetailed: `The Butcher allows a second execution to occur per day.
• After the first executed player has died, the Butcher may nominate a second player for execution. The Butcher may nominate a player that has already been nominated today, and the Butcher may make a nomination even if the Butcher already made a nomination earlier today.
• If a player is executed, even if they do not die, then the Butcher may use their ability. The players may choose to vote or not to vote, so there is no guarantee that this extra nomination will cause an execution—it still needs to get enough votes—but this second nomination does not need to exceed the vote tally of the previous nominations.
• If no execution occurs today, then the Butcher may not use their ability at all today.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Butcher',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/butcherIcon.png',
    medium: '/icons/characters/butcherIcon.png',
    large: '/icons/characters/butcherIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
