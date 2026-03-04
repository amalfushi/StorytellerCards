import type { CharacterDef } from '@/types/index.ts';

export const bureaucrat: CharacterDef = {
  id: 'bureaucrat',
  name: 'Bureaucrat',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each night, choose a player (not yourself): their vote counts as 3 votes tomorrow.',
  abilityDetailed: `The Bureaucrat gives extra votes to a player of their choice.
• When a player chosen by the Bureaucrat votes, that vote counts as three votes. This happens every time that player votes that day.
• The player with the triple vote loses it immediately if the Bureaucrat dies, including if the Bureaucrat is exiled, because the Bureaucrat loses their ability.
• Exiles are never affected by abilities, so the player with the triple vote can only support exiles once, not three times.
• Since the Storyteller counts the number of votes out loud as they move their hand around the circle, all players will know which player the Bureaucrat chose.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Bureaucrat',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/bureaucratIcon.png',
    medium: '/icons/characters/bureaucratIcon.png',
    large: '/icons/characters/bureaucratIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
