import type { CharacterDef } from '@/types/index.ts';

export const cultleader: CharacterDef = {
  id: 'cultleader',
  name: 'Cult Leader',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, you become the alignment of an alive neighbor. If all good players choose to join your cult, your team wins.',
  abilityDetailed: `The Cult Leader wins if everyone joins their cult.
• At the end of each night, the Cult Leader becomes the alignment of a living neighbor.
• Once per day, the Cult Leader may publicly choose to form a cult. If all good players vote to join the cult, the game ends immediately and the Cult Leader’s team wins.
• The Cult Leader may form a cult at any point in the day.
• Voting to join a cult does not require a vote token.
• Players may say whatever they want at any time, so a player bluffing as the Cult Leader may pretend to form a cult.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Cult_Leader',
  firstNight: {
    order: 65,
    helpText:
      'The Cult Leader might change alignment. If so, show the YOU ARE info token & give a thumb signal.',
    subActions: [
      {
        id: 'cultleader-fn-1',
        description: 'The Cult Leader might change alignment.',
        isConditional: false,
      },
      {
        id: 'cultleader-fn-2',
        description: 'If so, show the YOU ARE info token & give a thumb signal.',
        isConditional: true,
      },
    ],
  },
  otherNights: {
    order: 83,
    helpText:
      'The Cult Leader might change alignment. If so, show the YOU ARE info token & give a thumb signal.',
    subActions: [
      {
        id: 'cultleader-on-1',
        description: 'The Cult Leader might change alignment.',
        isConditional: false,
      },
      {
        id: 'cultleader-on-2',
        description: 'If so, show the YOU ARE info token & give a thumb signal.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/cultleaderIcon.png',
    medium: '/icons/characters/cultleaderIcon.png',
    large: '/icons/characters/cultleaderIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'boffin',
      description:
        'If the Demon has the Cult Leader ability, they can’t turn good due to this ability.',
    },
    {
      characterId: 'pithag',
      description:
        "If the Pit-Hag turns an evil player into the Cult Leader, they can't turn good due to their own ability.",
    },
  ],
};
