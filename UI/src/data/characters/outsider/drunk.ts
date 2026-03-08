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
    small: '/icons/characters/drunkIcon.webp',
    medium: '/icons/characters/drunkIcon.webp',
    large: '/icons/characters/drunkIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'drunk-assignment',
      description: 'Choose a Townsfolk character. The Drunk thinks they are this character.',
    },
  ],
  jinxes: [
    {
      characterId: 'mathematician',
      description:
        "The Mathematician might learn if the Drunk's ability yielded false info or failed to work properly.",
    },
    {
      characterId: 'boffin',
      description: 'The Demon cannot have the Drunk ability.',
    },
  ],
  flavor: 'I’m only a *hic* social drinker, my dear. Admittedly, I am a heavy *burp* socializer.',
  edition: 'tb',
  setup: true,
  remindersGlobal: [{ id: 'drunk-global-isthedrunk', text: 'Is The Drunk', isGlobal: true }],
};
