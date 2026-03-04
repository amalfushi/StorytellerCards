import type { CharacterDef } from '@/types/index.ts';

export const pithag: CharacterDef = {
  id: 'pithag',
  name: 'Pit-Hag',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player & a character they become (if not in play). If a Demon is made, deaths tonight are arbitrary.',
  abilityDetailed: `The Pit-Hag changes players into different characters.
• Each night, the Pit-Hag chooses a player and a character to turn that player into.
• They can’t create duplicate characters. If the character is already in play, nothing happens.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Pit-Hag',
  firstNight: null,
  otherNights: {
    order: 22,
    helpText:
      'The Pit-Hag chooses a player & a character. If they chose a character that is not in play: Put the Pit-Hag to sleep. Wake the target. Show the YOU ARE token & their new character token.',
    subActions: [
      {
        id: 'pithag-on-1',
        description: 'The Pit-Hag chooses a player & a character.',
        isConditional: false,
      },
      {
        id: 'pithag-on-2',
        description: 'If they chose a character that is not in play: Put the Pit-Hag to sleep.',
        isConditional: true,
      },
      {
        id: 'pithag-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'pithag-on-4',
        description: 'Show the YOU ARE token & their new character token.',
        isConditional: false,
      },
    ],
    choices: [
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
      { type: 'character', maxSelections: 1, label: 'Choose a character' },
    ],
  },
  icon: {
    small: '/icons/characters/pithagIcon.png',
    medium: '/icons/characters/pithagIcon.png',
    large: '/icons/characters/pithagIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'cultleader',
      description:
        "If the Pit-Hag turns an evil player into the Cult Leader, they can't turn good due to their own ability.",
    },
    {
      characterId: 'damsel',
      description: 'If a Pit-Hag creates a Damsel, the Storyteller chooses which player it is.',
    },
    {
      characterId: 'goon',
      description:
        "If the Pit-Hag turns an evil player into the Goon, they can't turn good due to their own ability.",
    },
    { characterId: 'heretic', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'leviathan', description: 'The Leviathan cannot enter play after day 5.' },
    {
      characterId: 'ogre',
      description:
        "If the Pit-Hag turns an evil player into the Ogre, they can't turn good due to their own ability.",
    },
    {
      characterId: 'politician',
      description:
        "If the Pit-Hag turns an evil player into the Politician, they can't turn good due to their own ability.",
    },
    {
      characterId: 'summoner',
      description: 'If the Summoner creates a second living Demon, deaths tonight are arbitrary.',
    },
    {
      characterId: 'villageidiot',
      description:
        'If there is a spare token, the Pit-Hag can create an extra Village Idiot. If so, the drunk Village Idiot might change.',
    },
  ],
};
