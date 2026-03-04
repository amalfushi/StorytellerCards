import type { CharacterDef } from '@/types/index.ts';

export const summoner: CharacterDef = {
  id: 'summoner',
  name: 'Summoner',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'You get 3 bluffs. On the 3rd night, choose a player: they become an evil Demon of your choice. [No Demon]',
  abilityDetailed: `The Summoner creates a Demon.
• The Summoner may choose any player to become the Demon, even themselves.
• The new Demon does not learn which players are Minions, or vice versa. The evil players will need to talk amongst themselves to figure this out.
• Even though there is no Demon in play for two days, the game does not end. However, if the Summoner becomes unable to create a Demon (due to dying, becoming drunk on night 3 etc.) good wins.
• The newly created Demon acts on the same night that it is created.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Summoner',
  firstNight: {
    order: 17,
    helpText:
      'Show the THESE CHARACTERS ARE NOT IN PLAY token. Show 3 not-in-play good character tokens.',
    subActions: [
      {
        id: 'summoner-fn-1',
        description: 'Show the THESE CHARACTERS ARE NOT IN PLAY token.',
        isConditional: false,
      },
      {
        id: 'summoner-fn-2',
        description: 'Show 3 not-in-play good character tokens.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 27,
    helpText:
      'Change the Summoner reminder token to the relevant night. If it is night 3, the Summoner chooses a player & a Demon character. Put the Summoner to sleep. Wake the target. Show the YOU ARE and Demon tokens & give a thumbs-down.',
    subActions: [
      {
        id: 'summoner-on-1',
        description: 'Change the Summoner reminder token to the relevant night.',
        isConditional: false,
      },
      {
        id: 'summoner-on-2',
        description: 'If it is night 3, the Summoner chooses a player & a Demon character.',
        isConditional: true,
      },
      {
        id: 'summoner-on-3',
        description: 'Put the Summoner to sleep.',
        isConditional: false,
      },
      {
        id: 'summoner-on-4',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'summoner-on-5',
        description: 'Show the YOU ARE and Demon tokens & give a thumbs-down.',
        isConditional: false,
      },
    ],
    choices: [
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
      { type: 'character', maxSelections: 1, label: 'Choose a character' },
    ],
  },
  icon: {
    small: '/icons/characters/summonerIcon.png',
    medium: '/icons/characters/summonerIcon.png',
    large: '/icons/characters/summonerIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'The Alchemist-Summoner does not get bluffs, and chooses which Demon but not which player. If they die before this happens, evil wins. [No Demon]',
    },
    {
      characterId: 'clockmaker',
      description: 'The Summoner registers as the Demon to the Clockmaker.',
    },
    {
      characterId: 'courtier',
      description:
        'If the living Summoner has no ability, the Storyteller has the Summoner ability.',
    },
    {
      characterId: 'engineer',
      description:
        'If the living Summoner is removed from play, the Storyteller has the Summoner ability.',
    },
    {
      characterId: 'hatter',
      description: 'If the Summoner creates a second living Demon, deaths tonight are arbitrary.',
    },
    {
      characterId: 'kazali',
      description: 'If the Summoner creates a second living Demon, deaths tonight are arbitrary.',
    },
    {
      characterId: 'legion',
      description: 'If Legion is summoned, all evil players become Legion.',
    },
    {
      characterId: 'lordoftyphon',
      description:
        'If a Lord of Typhon is summoned, they must neighbor a Minion & their other neighbor becomes an evil Minion.',
    },
    {
      characterId: 'marionette',
      description:
        'If there would be a Marionette in play, they enter play after the Demon & must start as their neighbor.',
    },
    {
      characterId: 'pithag',
      description: 'If the Summoner creates a second living Demon, deaths tonight are arbitrary.',
    },
    {
      characterId: 'poppygrower',
      description:
        'If the Poppy Grower is alive on the 3rd night, the Summoner chooses which Demon but not which player.',
    },
    {
      characterId: 'preacher',
      description:
        'If the living Summoner has no ability, the Storyteller has the Summoner ability.',
    },
    {
      characterId: 'pukka',
      description: 'The Summoner may summon a Pukka on the 2nd night instead of the 3rd.',
    },
    {
      characterId: 'zombuul',
      description:
        'If the Summoner summons a dead player into the Zombuul, the Zombuul has already "died once".',
    },
  ],
};
