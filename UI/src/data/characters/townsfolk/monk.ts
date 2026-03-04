import type { CharacterDef } from '@/types/index.ts';

export const monk: CharacterDef = {
  id: 'monk',
  name: 'Monk',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night*, choose a player (not yourself): they are safe from the Demon tonight.',
  abilityDetailed: `The Monk protects other players from the Demon.
• Each night except the first, the Monk may choose to protect any player except themself.
• If the Demon attacks a player who has been protected by the Monk, then that player does not die. The Demon does not get to attack another player—there is simply no death tonight.
• The Monk does not protect against the Demon nominating and executing someone.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Monk',
  firstNight: null,
  otherNights: {
    order: 17,
    helpText: 'The Monk chooses a player.',
    subActions: [
      {
        id: 'monk-on-1',
        description: 'The Monk chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/monkIcon.png',
    medium: '/icons/characters/monkIcon.png',
    large: '/icons/characters/monkIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
