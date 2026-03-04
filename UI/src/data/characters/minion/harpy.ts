import type { CharacterDef } from '@/types/index.ts';

export const harpy: CharacterDef = {
  id: 'harpy',
  name: 'Harpy',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose 2 players: tomorrow, the 1st player is mad that the 2nd is evil, or one or both might die.',
  abilityDetailed: `The Harpy creates discord and distrust between good players.
• At night, the Harpy player chooses one player at a time, not two at once.
• A player chosen by the Harpy is affected by the ability until the next Harpy choice.
• If the Storyteller decides to kill players with the Harpy ability, they do not need to kill both. The Storyteller can decide to kill only one, or none.
• The Harpy can choose a dead player. If so, the Storyteller can kill just the living player, since dead players can not die again.
• The order of deaths due to the Harpy ability can be chosen by the Storyteller, should that be important.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Harpy',
  firstNight: {
    order: 39,
    helpText:
      'The Harpy chooses 2 players. Put the Harpy to sleep. Wake the 1st target. Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
    subActions: [
      {
        id: 'harpy-fn-1',
        description: 'The Harpy chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-2',
        description: 'Put the Harpy to sleep.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-3',
        description: 'Wake the 1st target.',
        isConditional: false,
      },
      {
        id: 'harpy-fn-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 24,
    helpText:
      'The Harpy chooses 2 players. Put the Harpy to sleep. Wake the 1st target. Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
    subActions: [
      {
        id: 'harpy-on-1',
        description: 'The Harpy chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'harpy-on-2',
        description: 'Put the Harpy to sleep.',
        isConditional: false,
      },
      {
        id: 'harpy-on-3',
        description: 'Wake the 1st target.',
        isConditional: false,
      },
      {
        id: 'harpy-on-4',
        description:
          'Show the THIS CHARACTER SELECTED YOU token, the Harpy token, then point to the 2nd target.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: {
    small: '/icons/characters/harpyIcon.png',
    medium: '/icons/characters/harpyIcon.png',
    large: '/icons/characters/harpyIcon.png',
    placeholder: '#e53935',
  },
  reminders: [],
};
