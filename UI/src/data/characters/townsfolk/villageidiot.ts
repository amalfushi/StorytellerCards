import type { CharacterDef } from '@/types/index.ts';

export const villageidiot: CharacterDef = {
  id: 'villageidiot',
  name: 'Village Idiot',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose a player: you learn their alignment. [+0 to +2 Village Idiots. 1 of the extras is drunk]',
  abilityDetailed: `The Village Idiots are a group that learn players’ alignments.
• The Village Idiot that is drunk is chosen by the Storyteller during the game setup.
• There may be one, two, or three Village Idiots in play, irrespective of the number of players.
• If there is only one Village Idiot in play, they are sober.
• The drunk Village Idiot may get true information.
• When Village Idiots are added to the game during setup, they replace other Townsfolk.
• If a Village Idiot is created mid-game, only one is created.
• Village Idiots act one at a time, not all together.
• If all sober Village Idiots exit play, the remaining drunk Village Idiot remains drunk.
• If a sober Village Idiot becomes drunk or poisoned by other means, the drunk Village Idiot remains drunk.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Village_Idiot',
  firstNight: {
    order: 62,
    helpText:
      'If there are multiple Village Idiots, mark one as DRUNK. Wake the Village Idiots one at a time to choose a player. Give a thumb signal.',
    subActions: [
      {
        id: 'villageidiot-fn-1',
        description: 'If there are multiple Village Idiots, mark one as DRUNK.',
        isConditional: true,
      },
      {
        id: 'villageidiot-fn-2',
        description: 'Wake the Village Idiots one at a time to choose a player.',
        isConditional: false,
      },
      {
        id: 'villageidiot-fn-3',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 79,
    helpText: 'Wake the Village Idiots one at a time to choose a player. Give a thumb signal.',
    subActions: [
      {
        id: 'villageidiot-on-1',
        description: 'Wake the Village Idiots one at a time to choose a player.',
        isConditional: false,
      },
      {
        id: 'villageidiot-on-2',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/villageidiotIcon.png',
    medium: '/icons/characters/villageidiotIcon.png',
    large: '/icons/characters/villageidiotIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
