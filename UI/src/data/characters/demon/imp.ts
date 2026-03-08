import type { CharacterDef } from '@/types/index.ts';

export const imp: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.',
  abilityDetailed: `The Imp kills a player each night, and can make copies of itself... for a terrible price.
• On each night except the first, the Imp chooses a player to kill. Because most characters act after the Demon, that player will probably not get to use their ability tonight.
• The Imp, because they're a Demon, knows which players are their Minions, and knows three not-in-play good characters that they can safely bluff as.
• If the Imp dies, the game ends and good wins. However, if the Imp kills themself at night, they die and an alive Minion becomes an Imp. This new Imp does not act that same night, but is now the Imp in every other way—they kill each night, and lose if they die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Imp',
  firstNight: null,
  otherNights: {
    order: 33,
    helpText:
      'The Imp chooses a player. If the Imp chose themselves: Replace 1 alive Minion token with a spare Imp token. Put the old Imp to sleep. Wake the new Imp. Show the YOU ARE token, then show the Imp token.',
    subActions: [
      {
        id: 'imp-on-1',
        description: 'The Imp chooses a player.',
        isConditional: false,
      },
      {
        id: 'imp-on-2',
        description:
          'If the Imp chose themselves: Replace 1 alive Minion token with a spare Imp token.',
        isConditional: true,
      },
      {
        id: 'imp-on-3',
        description: 'Put the old Imp to sleep.',
        isConditional: false,
      },
      {
        id: 'imp-on-4',
        description: 'Wake the new Imp.',
        isConditional: false,
      },
      {
        id: 'imp-on-5',
        description: 'Show the YOU ARE token, then show the Imp token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/impIcon.webp',
    medium: '/icons/characters/impIcon.webp',
    large: '/icons/characters/impIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'imp-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
  flavor:
    'We must keep our wits sharp and our sword sharper. Evil walks among us, and will stop at nothing to destroy us good, simple folk, bringing our fine town to ruin. Trust no-one. But, if you must trust someone, trust me.',
  edition: 'tb',
};
