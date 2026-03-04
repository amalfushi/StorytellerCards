import type { CharacterDef } from '@/types/index.ts';

export const witch: CharacterDef = {
  id: 'witch',
  name: 'Witch',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose a player: if they nominate tomorrow, they die. If just 3 players live, you lose this ability.',
  abilityDetailed: `The Witch curses players, so that they die if they nominate.
• Each night, the Witch chooses a player to curse. That player dies if they nominate any player on the next day, although their nomination still counts.
• The Witch’s curse lasts only for one day, but the Witch may curse the same player again and again each night.
• As soon as just three players are left alive, the Witch’s curse is immediately removed, and the Witch acts no more.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Witch',
  firstNight: {
    order: 36,
    helpText: 'The Witch chooses a player.',
    subActions: [
      {
        id: 'witch-fn-1',
        description: 'The Witch chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 20,
    helpText: 'The Witch chooses a player.',
    subActions: [
      {
        id: 'witch-on-1',
        description: 'The Witch chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/witchIcon.png',
    medium: '/icons/characters/witchIcon.png',
    large: '/icons/characters/witchIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'witch-cursed', text: 'CURSED' }],
};
