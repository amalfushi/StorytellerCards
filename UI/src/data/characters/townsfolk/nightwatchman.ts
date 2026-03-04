import type { CharacterDef } from '@/types/index.ts';

export const nightwatchman: CharacterDef = {
  id: 'nightwatchman',
  name: 'Nightwatchman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Once per game, at night, choose a player: they learn you are the Nightwatchman.',
  abilityDetailed: `The Nightwatchman is known by one player.
• At night, the Nightwatchman chooses a player. This player wakes, and learns which player the Nightwatchman is.
• The Nightwatchman and their chosen player do not make eye contact. They wake separately.
• The Nightwatchman player chooses which night to act.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Nightwatchman',
  firstNight: {
    order: 64,
    helpText:
      'The Nightwatchman might choose a player. Put the Nightwatchman to sleep. Wake the target. Show the THIS PLAYER IS & Nightwatchman tokens, then point to the Nightwatchman.',
    subActions: [
      {
        id: 'nightwatchman-fn-1',
        description: 'The Nightwatchman might choose a player.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-fn-2',
        description: 'Put the Nightwatchman to sleep.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-fn-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-fn-4',
        description:
          'Show the THIS PLAYER IS & Nightwatchman tokens, then point to the Nightwatchman.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 82,
    helpText:
      'The Nightwatchman might choose a player. Put the Nightwatchman to sleep. Wake the target. Show the THIS PLAYER IS & Nightwatchman tokens, then point to the Nightwatchman.',
    subActions: [
      {
        id: 'nightwatchman-on-1',
        description: 'The Nightwatchman might choose a player.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-on-2',
        description: 'Put the Nightwatchman to sleep.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'nightwatchman-on-4',
        description:
          'Show the THIS PLAYER IS & Nightwatchman tokens, then point to the Nightwatchman.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/nightwatchmanIcon.png',
    medium: '/icons/characters/nightwatchmanIcon.png',
    large: '/icons/characters/nightwatchmanIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'nightwatchman-noability', text: 'NO ABILITY' }],
};
