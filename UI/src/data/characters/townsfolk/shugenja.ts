import type { CharacterDef } from '@/types/index.ts';

export const shugenja: CharacterDef = {
  id: 'shugenja',
  name: 'Shugenja',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing if your closest evil player is clockwise or anti-clockwise. If equidistant, this info is arbitrary.',
  abilityDetailed: `The Shugenja trusts players to their left, or to their right.
• The closest evil player is the player with the smallest number of steps from the Shugenja to the evil player.
• If the evil players are ‘equidistant’, that means that the closest evil player clockwise is the same number of steps away from the Shugenja as the closest evil player anti-clockwise.
• If the evil players are equidistant, the storyteller gives ‘arbitrary’ information to the Shugenja. This means that the Storyteller chooses whether to tell the Shugenja that the closest evil player is clockwise or anti-clockwise.
• The Shugenja doesn’t know whether their information is arbitrary or not.
• The Shugenja does not learn how many steps away the evil player is.
• If a Shugenja is created mid-game, the Shugenja wakes that night to receive their information.
• The Storyteller communicates with the Shugenja by pointing a finger in the appropriate direction, but may use other methods if they wish.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Shugenja',
  firstNight: {
    order: 61,
    helpText: 'Point clockwise or anticlockwise.',
    subActions: [
      {
        id: 'shugenja-fn-1',
        description: 'Point clockwise or anticlockwise.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/shugenjaIcon.png',
    medium: '/icons/characters/shugenjaIcon.png',
    large: '/icons/characters/shugenjaIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
