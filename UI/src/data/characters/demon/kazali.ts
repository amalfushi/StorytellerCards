import type { CharacterDef } from '@/types/index.ts';

export const kazali: CharacterDef = {
  id: 'kazali',
  name: 'Kazali',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. [You choose which players are which Minions. -? to +? Outsiders]',
  abilityDetailed: `The Kazali chooses their own Minions.
• If a Kazali is created mid game, the Kazali does not choose new Minion players.
• The Storyteller can give the Minions’ original good characters as bluffs to the Demon, since they are not in play.
• The Kazali acts at a time that is technically both during setup and during the first night.
• The Storyteller may keep the Kazali awake, or put the Kazali to sleep, when waking the Minions to tell them which Minion that they are.
• Only Minions that are on the script may be chosen. Duplicate Minion characters are not allowed.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Kazali',
  firstNight: {
    order: 7,
    helpText:
      'The Kazali chooses which players are which Minions. Wake each target. Show the YOU ARE and Minion tokens & give a thumbs-down.',
    subActions: [
      {
        id: 'kazali-fn-1',
        description: 'The Kazali chooses which players are which Minions.',
        isConditional: false,
      },
      {
        id: 'kazali-fn-2',
        description: 'Wake each target.',
        isConditional: false,
      },
      {
        id: 'kazali-fn-3',
        description: 'Show the YOU ARE and Minion tokens & give a thumbs-down.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 48,
    helpText: 'The Kazali chooses a player.',
    subActions: [
      {
        id: 'kazali-on-1',
        description: 'The Kazali chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/kazaliIcon.png',
    medium: '/icons/characters/kazaliIcon.png',
    large: '/icons/characters/kazaliIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'kazali-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
