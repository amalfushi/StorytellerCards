import type { CharacterDef } from '@/types/index.ts';

export const vizier: CharacterDef = {
  id: 'vizier',
  name: 'Vizier',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'All players know you are the Vizier. You cannot die during the day. If good voted, you may choose to execute immediately.',
  abilityDetailed: `The Vizier executes players without the town’s consent.
• On the first day, all players learn that the Vizier is in play, and which player it is.
• During the day, the Vizier can not die by any means.
• After a vote is tallied, if the Vizier chooses to execute the nominee (and at least one good player voted), they are executed immediately. This counts as the 1 execution allowed each day.
• After a vote is tallied, if the Vizier chooses to execute the nominee (and no good players voted), nothing happens.
• Even if the vote tally is less than 50% of the living players, the Vizier may still execute. Even if another player has more votes than the current player, the Vizier may still execute.
• The Vizier does not have to force an execution each day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Vizier',
  firstNight: {
    order: 74,
    helpText: 'Announce which player is the Vizier.',
    subActions: [
      {
        id: 'vizier-fn-1',
        description: 'Announce which player is the Vizier.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/vizierIcon.webp',
    medium: '/icons/characters/vizierIcon.webp',
    large: '/icons/characters/vizierIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alsaahir',
      description: "The Storyteller doesn't declare the Vizier is in play.",
    },
    {
      characterId: 'courtier',
      description:
        'If the Vizier loses their ability, they learn this, and cannot die during the day.',
    },
    {
      characterId: 'fearmonger',
      description:
        'The Vizier wakes with the Fearmonger, learns who they choose and cannot choose to immediately execute that player.',
    },
    {
      characterId: 'investigator',
      description: "The Storyteller doesn't declare the Vizier is in play.",
    },
    {
      characterId: 'lilmonsta',
      description: "If the Vizier is babysitting Lil' Monsta, they die when executed.",
    },
    {
      characterId: 'magician',
      description:
        "If the Vizier is in play, the Magician has no ability but is immune to the Vizier's ability.",
    },
    {
      characterId: 'politician',
      description: 'The Politician might register as evil to the Vizier.',
    },
    {
      characterId: 'preacher',
      description:
        'If the Vizier loses their ability, they learn this, and cannot die during the day.',
    },
    { characterId: 'zealot', description: 'The Zealot might register as evil to the Vizier.' },
  ],
  flavor:
    'An excellent decision, as always, sire. Such a petty crime as bumping into the Bishop indeed deserves your ‘justice’ and ‘mercy’. Take a stroll in the gardens. Visit the gallery and peruse the sculptures of Von Strauf. Relax, sire. Leave everything… to me.',
  edition: 'carousel',
};
