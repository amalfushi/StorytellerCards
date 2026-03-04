import type { CharacterDef } from '@/types/index.ts';

export const ogre: CharacterDef = {
  id: 'ogre',
  name: 'Ogre',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    "On your 1st night, choose a player (not yourself): you become their alignment (you don't know which) even if drunk or poisoned.",
  abilityDetailed: `The Ogre is someone's best friend.
• The Ogre's chosen player does not change, even if the Ogre is drunk or poisoned when they chose.
• The Ogre becomes the same alignment as their chosen player immediately on the first night, even if the Ogre is drunk or poisoned.
• The Ogre is not told their alignment at the beginning of the game.
• If the Ogre changes alignment by other means, the Ogre learns their new alignment, as normal.
• If an Ogre is created mid-game, the Ogre chooses a player that night, and becomes their alignment.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Ogre',
  firstNight: {
    order: 67,
    helpText: 'The Ogre chooses a player.',
    subActions: [
      {
        id: 'ogre-fn-1',
        description: 'The Ogre chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/ogreIcon.png',
    medium: '/icons/characters/ogreIcon.png',
    large: '/icons/characters/ogreIcon.png',
    placeholder: '#1565c0',
  },
  reminders: [],
};
