import type { CharacterDef } from '@/types/index.ts';

export const fanggu: CharacterDef = {
  id: 'fanggu',
  name: 'Fang Gu',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. The 1st Outsider this kills becomes an evil Fang Gu & you die instead. [+1 Outsider]',
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
  icon: { placeholder: '#b71c1c' },
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
};
