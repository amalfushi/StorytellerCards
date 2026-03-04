import type { CharacterDef } from '@/types/index.ts';

export const wraith: CharacterDef = {
  id: 'wraith',
  name: 'Wraith',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'You may choose to open your eyes at night. You wake when other evil players do.',
  abilityDetailed: `The Wraith knows and shares what happens at night.
• The Wraith may open their eyes at any point during the night, for as long or as short a time as they wish.
• They may open their eyes fully, or just peek.
• The Storyteller wakes the Wraith when other evil players also wake, such as when the Demon kills a player, an evil Traveller uses their ability, or a Cult Leader learns that they are evil.
• When several players have their eyes open at once, they may communicate if they wish.
• If a good player catches the Wraith with their eyes open, there is no mechanical effect.
• A dead Wraith may not open their eyes at night. A drunk or poisoned Wraith is told by the Storyteller that they may not open their eyes that night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Wraith',
  firstNight: {
    order: 5,
    helpText: 'Wake the Wraith whenever other evil players wake.',
    subActions: [
      {
        id: 'wraith-fn-1',
        description: 'Wake the Wraith whenever other evil players wake.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 3,
    helpText: 'Wake the Wraith whenever other evil players wake.',
    subActions: [
      {
        id: 'wraith-on-1',
        description: 'Wake the Wraith whenever other evil players wake.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/wraithIcon.png',
    medium: '/icons/characters/wraithIcon.png',
    large: '/icons/characters/wraithIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'An Alchemist-Wraith has no Wraith ability & a Wraith is in play. After each execution, a living Alchemist-Wraith may publicly guess a living player as the Wraith. If correct, the Demon must choose the Wraith tonight.',
    },
    {
      characterId: 'magician',
      description:
        'After each execution, the living Magician may publicly guess a living player as the Wraith. If correct, the Demon must choose the Wraith tonight.',
    },
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Wraith ability, a Minion gains it, and learns this.',
    },
  ],
};
