import type { CharacterDef } from '@/types/index.ts';

export const juggler: CharacterDef = {
  id: 'juggler',
  name: 'Juggler',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    "On your 1st day, publicly guess up to 5 players' characters. That night, you learn how many you got correct.",
  abilityDetailed: `The Juggler takes the risk of convincing people to reveal their characters on the 1st day, in the hope of guessing as many as possible that are telling the truth.
• On the first day, they may guess which players are which characters. That night, the Juggler learns how many guesses they got right...if they are not killed beforehand.
• They must make their guesses publicly, so everyone hears what is guessed. They may guess zero characters, or up to five characters, and these characters and players may be different or the same.
• If the Juggler made their guesses while drunk or poisoned, but is sober and healthy when their ability triggers that night, then the Storyteller still gives them true information.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Juggler',
  firstNight: null,
  otherNights: {
    order: 77,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'juggler-on-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/jugglerIcon.png',
    medium: '/icons/characters/jugglerIcon.png',
    large: '/icons/characters/jugglerIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'juggler-correct', text: 'CORRECT' }],
  jinxes: [
    {
      characterId: 'cannibal',
      description:
        'If the Juggler guesses on their first day and dies by execution, tonight the living Cannibal learns how many guesses the Juggler got correct.',
    },
  ],
};
