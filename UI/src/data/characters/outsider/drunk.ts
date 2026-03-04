import type { CharacterDef } from '@/types/index.ts';

export const drunk: CharacterDef = {
  id: 'drunk',
  name: 'Drunk',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.',
  abilityDetailed: `The Drunk player thinks that they are a Townsfolk, and has no idea that they are actually the Drunk.
• During setup, the Drunk's token does not go in the bag. Instead, a Townsfolk character token goes in the bag, and the player who draws that token is secretly the Drunk for the whole game. The Storyteller knows. The player does not.
• The Drunk has no ability. Whenever their Townsfolk ability would affect the game in some way, it doesn't. However, the Storyteller pretends that the player is the Townsfolk they think they are. If that character would wake at night, the Drunk wakes to act as if they are that Townsfolk. If that Townsfolk would gain information, the Storyteller may give them false information instead—and the Storyteller is encouraged to do so.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Drunk',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/drunkIcon.png',
    medium: '/icons/characters/drunkIcon.png',
    large: '/icons/characters/drunkIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'drunk-assignment',
      description: 'Choose a Townsfolk character. The Drunk thinks they are this character.',
    },
  ],
};
