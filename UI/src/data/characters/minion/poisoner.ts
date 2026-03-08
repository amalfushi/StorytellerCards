import type { CharacterDef } from '@/types/index.ts';

export const poisoner: CharacterDef = {
  id: 'poisoner',
  name: 'Poisoner',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
  abilityDetailed: `The Poisoner secretly disrupts character abilities.
• Each night, the Poisoner chooses someone to poison for that night and the entire next day.
• A poisoned player has no ability, but the Storyteller pretends they do. They do not affect the game in any real way. However, to keep up the illusion that the poisoned player is not poisoned, the Storyteller wakes them at the appropriate time and goes through the motions as if they were not poisoned. If their ability gives them information, the Storyteller may give them false information.
• If a poisoned player uses a "once per game" ability while poisoned, they cannot use their ability again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Poisoner',
  firstNight: {
    order: 27,
    helpText: 'The Poisoner chooses a player.',
    subActions: [
      {
        id: 'poisoner-fn-1',
        description: 'The Poisoner chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 10,
    helpText: 'The Poisoner chooses a player.',
    subActions: [
      {
        id: 'poisoner-on-1',
        description: 'The Poisoner chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/poisonerIcon.webp',
    medium: '/icons/characters/poisonerIcon.webp',
    large: '/icons/characters/poisonerIcon.webp',
    placeholder: '#e53935',
  },
  reminders: [],
  flavor: 'Add compound Alpha to compound Beta... NOT TOO MUCH!',
  edition: 'tb',
};
