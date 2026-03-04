import type { CharacterDef } from '@/types/index.ts';

export const thief: CharacterDef = {
  id: 'thief',
  name: 'Thief',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each night, choose a player (not yourself): their vote counts negatively tomorrow.',
  abilityDetailed: `The Thief steals votes from a player, making their vote count negatively.
• When a player chosen by the Thief votes, the vote tally goes down by one instead of up by one. This happens every time that player votes that day.
• The player with the negative vote changes back to having a positive vote immediately if the Thief dies, including if the Thief is exiled, because the Thief loses their ability.
• Exiles are never affected by abilities, so the player with the negative vote can support exiles unaffected by the Thief’s ability.
• Since the Storyteller counts the number of votes out loud as they move their hand around the circle, all players will know which player the Thief chose.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Thief',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/thiefIcon.png',
    medium: '/icons/characters/thiefIcon.png',
    large: '/icons/characters/thiefIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'thief-negativevote', text: 'NEGATIVE VOTE' }],
};
