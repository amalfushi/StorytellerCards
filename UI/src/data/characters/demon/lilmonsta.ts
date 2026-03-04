import type { CharacterDef } from '@/types/index.ts';

export const lilmonsta: CharacterDef = {
  id: 'lilmonsta',
  name: "Lil' Monsta",
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, Minions choose who babysits Lil\' Monsta & "is the Demon". Each night*, a player might die.',
  abilityDetailed: `Lil’ Monsta isn’t a player, and is instead babysat by a Minion.
• Each night, all Minions wake together and decide amongst themselves who babysits the Lil’ Monsta. The Minions decide by pointing to a player, or otherwise make it obvious they have reached a decision. If they can not reach a unanimous decision, the Storyteller decides.
• If the Storyteller thinks it is funny, they may give this player the Lil’ Monsta token, which they will need to hide in a pocket, under their hat, or somewhere appropriate. Players may not request that others empty their pockets.
• The player with the Lil’ Monsta token “is the Demon”. Good wins if they die. They register as a Demon for characters like the Fortune Teller etc.
• If a good player babysits Lil’ Monsta, they “are the Demon” but they remain good. A dead player babysitting Lil’ Monsta ends the game because the Demon “is dead”.
• Minions babysitting Lil’ Monsta keep their Minion ability.
• Lil’ Monsta isn’t a player, so can’t be drunk or poisoned.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Lil%27_Monsta',
  firstNight: {
    order: 24,
    helpText:
      "Wake the Minions. They choose a player. Put the Minions to sleep. Wake the target. Show the YOU ARE & Lil' Monsta tokens.",
    subActions: [
      {
        id: 'lilmonsta-fn-1',
        description: 'Wake the Minions.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-fn-2',
        description: 'They choose a player.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-fn-3',
        description: 'Put the Minions to sleep.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-fn-4',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-fn-5',
        description: "Show the YOU ARE & Lil' Monsta tokens.",
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 46,
    helpText:
      "Wake the Minions. They choose a player. Put the Minions to sleep. Wake the target. Show the YOU ARE & Lil' Monsta tokens. A player might die.",
    subActions: [
      {
        id: 'lilmonsta-on-1',
        description: 'Wake the Minions.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-on-2',
        description: 'They choose a player.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-on-3',
        description: 'Put the Minions to sleep.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-on-4',
        description: 'Wake the target.',
        isConditional: false,
      },
      {
        id: 'lilmonsta-on-5',
        description: "Show the YOU ARE & Lil' Monsta tokens.",
        isConditional: false,
      },
      {
        id: 'lilmonsta-on-6',
        description: 'A player might die.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/lilmonstaIcon.png',
    medium: '/icons/characters/lilmonstaIcon.png',
    large: '/icons/characters/lilmonstaIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [
    { id: 'lilmonsta-minioninfo', text: 'MINION INFO' },
    { id: 'lilmonsta-demoninfo', text: 'DEMON INFO' },
    { id: 'lilmonsta-isthedemon', text: 'IS THE DEMON' },
  ],
  jinxes: [
    {
      characterId: 'hatter',
      description:
        "If the Hatter dies & the Demon chooses Lil' Monsta, they also choose a Minion to become.",
    },
    {
      characterId: 'magician',
      description:
        "If the Magician is alive, the Storyteller chooses which Minion babysits Lil' Monsta.",
    },
    {
      characterId: 'marionette',
      description:
        'If there would be a Marionette in play, they enter play after the Demon & must start as their neighbor.',
    },
    {
      characterId: 'poppygrower',
      description:
        "If Lil' Monsta & the Poppy Grower are alive, Minions wake one by one, until one of them chooses to take the Lil' Monsta token.",
    },
    {
      characterId: 'psychopath',
      description: "If the Psychopath is babysitting Lil' Monsta, they die when executed.",
    },
    {
      characterId: 'scarletwoman',
      description:
        "If Lil' Monsta dies with 5 or more players alive, the Scarlet Woman babysits Lil' Monsta for the rest of the game.",
    },
    {
      characterId: 'vizier',
      description: "If the Vizier is babysitting Lil' Monsta, they die when executed.",
    },
  ],
};
