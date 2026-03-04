import type { CharacterDef } from '@/types/index.ts';

export const preacher: CharacterDef = {
  id: 'preacher',
  name: 'Preacher',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose a player: a Minion, if chosen, learns this. All chosen Minions have no ability.',
  abilityDetailed: `The Preacher removes Minion abilities.
• If the Preacher chooses a Minion, that Minion is woken to learn that they have been preached, and can no longer act while the Preacher is alive, sober, and healthy.
• If the Preacher chooses a player who is not a Minion, nothing happens.
• The Preacher may choose dead players.
• If the Preacher is drunk or poisoned at the time they choose a player, that player is not affected by the Preacher’s ability.
• If the Preacher becomes drunk or poisoned, preached Minions regain their abilities until the Preacher is sober and healthy.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Preacher',
  firstNight: {
    order: 23,
    helpText:
      'The Preacher chooses a player. If they chose a Minion: Put the Preacher to sleep. Wake the target. Show the THIS CHARACTER SELECTED YOU & Preacher tokens.',
    subActions: [
      {
        id: 'preacher-fn-1',
        description: 'The Preacher chooses a player.',
        isConditional: false,
      },
      {
        id: 'preacher-fn-2',
        description: 'If they chose a Minion: Put the Preacher to sleep.',
        isConditional: true,
      },
      {
        id: 'preacher-fn-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'preacher-fn-4',
        description: 'Show the THIS CHARACTER SELECTED YOU & Preacher tokens.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 8,
    helpText:
      'The Preacher chooses a player. If they chose a Minion: Put the Preacher to sleep. Wake the target. Show the THIS CHARACTER SELECTED YOU & Preacher tokens.',
    subActions: [
      {
        id: 'preacher-on-1',
        description: 'The Preacher chooses a player.',
        isConditional: false,
      },
      {
        id: 'preacher-on-2',
        description: 'If they chose a Minion: Put the Preacher to sleep.',
        isConditional: true,
      },
      {
        id: 'preacher-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'preacher-on-4',
        description: 'Show the THIS CHARACTER SELECTED YOU & Preacher tokens.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/preacherIcon.png',
    medium: '/icons/characters/preacherIcon.png',
    large: '/icons/characters/preacherIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'preacher-noability', text: 'NO ABILITY' }],
  jinxes: [
    {
      characterId: 'legion',
      description:
        'If the Preacher chooses Legion, Legion keeps their ability, but the Preacher might learn they are Legion.',
    },
    {
      characterId: 'summoner',
      description:
        'If the living Summoner has no ability, the Storyteller has the Summoner ability.',
    },
    {
      characterId: 'vizier',
      description:
        'If the Vizier loses their ability, they learn this, and cannot die during the day.',
    },
  ],
};
