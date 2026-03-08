import type { CharacterDef } from '@/types/index.ts';

export const vigormortis: CharacterDef = {
  id: 'vigormortis',
  name: 'Vigormortis',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. Minions you kill keep their ability & poison 1 Townsfolk neighbor. [-1 Outsider]',
  abilityDetailed: `The Vigormortis kills their own Minions, but those Minions keep their ability.
• Every time the Vigormortis kills a Minion, they die but keep their ability for as long as the Vigormortis remains alive. The Witch, Cerenovus, and Pit-Hag still act each night.
• Somewhat like the No Dashii, the dead Minion’s closest clockwise or closest counterclockwise Townsfolk becomes poisoned, even if they are dead. If the Vigormortis dies or otherwise loses their ability, then those players become healthy again. One Townsfolk per Minion will always be poisoned this way, as neighboring Outsiders, Minions, or Travellers are skipped. The Storyteller chooses which of the two Townsfolk is poisoned.
• All Minions killed by the Vigormortis keep their ability and poison a Townsfolk, not just the most recent.
• If a dead Minion becomes a non-Minion character, they no longer poison a Townsfolk and have no ability. If a dead Minion becomes drunk or poisoned, they lose their ability until they become sober and healthy again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Vigormortis',
  firstNight: null,
  otherNights: {
    order: 42,
    helpText:
      'The Vigormortis chooses a player. If that player is a Minion, poison a neighboring Townsfolk.',
    subActions: [
      {
        id: 'vigormortis-on-1',
        description: 'The Vigormortis chooses a player.',
        isConditional: false,
      },
      {
        id: 'vigormortis-on-2',
        description: 'If that player is a Minion, poison a neighboring Townsfolk.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/vigormortisIcon.webp',
    medium: '/icons/characters/vigormortisIcon.webp',
    large: '/icons/characters/vigormortisIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [
    { id: 'vigormortis-hasability', text: 'HAS ABILITY' },
    { id: 'vigormortis-poisoned', text: 'POISONED' },
  ],
  setupModification: {
    description:
      'Each night*, choose a player: they die. Minions you kill keep their ability & poison 1 Townsfolk neighbor. [-1 Outsider]',
  },
  jinxes: [
    {
      characterId: 'mastermind',
      description: 'A Mastermind that has their ability keeps it if the Vigormortis dies.',
    },
  ],
  flavor:
    'All doors are one door. All keys are one key. All cups are one cup, but whosoever drinketh of the water that I give shall never thirst, but the water shall be in him a well springing up into everlasting life.',
  edition: 'snv',
  setup: true,
};
