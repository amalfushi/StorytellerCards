import type { CharacterDef } from '@/types/index.ts';

export const huntsman: CharacterDef = {
  id: 'huntsman',
  name: 'Huntsman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose a living player: the Damsel, if chosen, becomes a not-in-play Townsfolk. [+the Damsel]',
  abilityDetailed: `The Huntsman saves the Damsel before the Minions find her... hopefully.
• The Damsel can be in play without the Huntsman. During the setup phase, if the Huntsman is in play and the Damsel isn’t, the Damsel is added. If a Damsel is already in play, the Huntsman doesn’t add a second Damsel.
• If the Huntsman correctly chooses the Damsel at night, the Damsel becomes a not-in-play Townsfolk immediately. The Storyteller chooses which Townsfolk character, and the Damsel learns which one.
• When the Damsel becomes a Townsfolk, they gain that Townsfolk ability and lose the Damsel ability.
• The Huntsman gets one guess, and makes it at night.
• The Minions get one guess in total, and make it publicly during the day. If a Minion guesses who the Damsel is, evil wins. If a Minion incorrectly guesses who the Damsel is, the guess is used, and other Minions cannot win by correctly guessing the Damsel.
• If the Damsel is drunk or poisoned but the Huntsman is sober and healthy, the Damsel can still become a Townsfolk.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Huntsman',
  firstNight: {
    order: 43,
    helpText:
      'The Huntsman might choose a player. If they chose the Damsel: Put the Huntsman to sleep. Wake the target. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'huntsman-fn-1',
        description: 'The Huntsman might choose a player.',
        isConditional: false,
      },
      {
        id: 'huntsman-fn-2',
        description: 'If they chose the Damsel: Put the Huntsman to sleep.',
        isConditional: true,
      },
      {
        id: 'huntsman-fn-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'huntsman-fn-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 60,
    helpText:
      'The Huntsman might choose a player. If they chose the Damsel: Put the Huntsman to sleep. Wake the target. Show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'huntsman-on-1',
        description: 'The Huntsman might choose a player.',
        isConditional: false,
      },
      {
        id: 'huntsman-on-2',
        description: 'If they chose the Damsel: Put the Huntsman to sleep.',
        isConditional: true,
      },
      {
        id: 'huntsman-on-3',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'huntsman-on-4',
        description: 'Show the YOU ARE info token & their new character token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/huntsmanIcon.png',
    medium: '/icons/characters/huntsmanIcon.png',
    large: '/icons/characters/huntsmanIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
