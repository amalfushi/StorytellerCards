import type { CharacterDef } from '@/types/index.ts';

export const butler: CharacterDef = {
  id: 'butler',
  name: 'Butler',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
  abilityDetailed: `The Butler may only vote when their Master (another player) votes.
• Each night, the Butler chooses a player to be their Master. This may be the same player as last night or a different one.
• If the Master has their hand raised to vote, or if the Master's vote has already been counted, the Butler may raise their hand to vote.
• If the Master has their hand down, signaling that they are not voting, or if the Master lowers their hand before their vote is tallied, the Butler must lower their hand too.
• It is not the Storyteller's responsibility to monitor the Butler. They're responsible for their own voting. Deliberately voting when they shouldn't is considered cheating.
• Because exiles are never affected by abilities, the Butler can vote freely for an exile.
• Dead players may only raise their hand to vote if they have a vote token. If the Butler chooses a dead player as their Master, this still applies.
• The Butler is never forced to vote.
• The Butler's vote may be tallied by the Storyteller before or after their Master's. Seating position is not important.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Butler',
  firstNight: {
    order: 52,
    helpText: 'The Butler chooses a player.',
    subActions: [
      {
        id: 'butler-fn-1',
        description: 'The Butler chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 84,
    helpText: 'The Butler chooses a player.',
    subActions: [
      {
        id: 'butler-on-1',
        description: 'The Butler chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/butlerIcon.png',
    medium: '/icons/characters/butlerIcon.png',
    large: '/icons/characters/butlerIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'butler-master', text: 'MASTER' }],
  jinxes: [
    {
      characterId: 'cannibal',
      description: 'If the Cannibal gains the Butler ability, the Cannibal learns this.',
    },
    {
      characterId: 'organgrinder',
      description:
        'If the Organ Grinder is causing eyes closed voting, the Butler may raise their hand to vote but their vote is only counted if their master voted too.',
    },
  ],
};
