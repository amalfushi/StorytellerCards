import type { CharacterDef } from '@/types/index.ts';

export const fanggu: CharacterDef = {
  id: 'fanggu',
  name: 'Fang Gu',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. The 1st Outsider this kills becomes an evil Fang Gu & you die instead. [+1 Outsider]',
  abilityDetailed: `The Fang Gu possesses Outsiders.
• The first time a Fang Gu attacks and kills an Outsider, the Fang Gu dies, and the Outsider becomes a Fang Gu and turns evil.
• This can only happen once per game. If the new Fang Gu attacks an Outsider, the Outsider dies as normal.
• The new Fang Gu counts as the Demon, and good wins if they die. They do not learn which players are Minions.
• There is an extra Outsider in play.
• If the Fang Gu attacks an Outsider but that Outsider does not die, that Outsider does not become an evil Fang Gu and the Fang Gu does not die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fang_Gu',
  firstNight: null,
  otherNights: {
    order: 38,
    helpText:
      'The Fang Gu chooses a player. If they chose an Outsider (once only): Replace the Outsider token with the spare Fang Gu token. Put the Fang Gu to sleep. Wake the target. Show the YOU ARE and Fang Gu tokens & give a thumbs-down.',
    subActions: [
      {
        id: 'fanggu-on-1',
        description: 'The Fang Gu chooses a player.',
        isConditional: false,
      },
      {
        id: 'fanggu-on-2',
        description:
          'If they chose an Outsider (once only): Replace the Outsider token with the spare Fang Gu token.',
        isConditional: true,
      },
      {
        id: 'fanggu-on-3',
        description: 'Put the Fang Gu to sleep.',
        isConditional: false,
      },
      {
        id: 'fanggu-on-4',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'fanggu-on-5',
        description: 'Show the YOU ARE and Fang Gu tokens & give a thumbs-down.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/fangguIcon.webp',
    medium: '/icons/characters/fangguIcon.webp',
    large: '/icons/characters/fangguIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'fanggu-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
  setupModification: {
    description: 'There is an extra Outsider in play. [+1 Outsider]',
  },
  flavor: 'Your walls and your weapons are but smoke in dreams.',
  edition: 'snv',
  setup: true,
};
