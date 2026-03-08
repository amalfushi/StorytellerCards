import type { CharacterDef } from '@/types/index.ts';

export const leviathan: CharacterDef = {
  id: 'leviathan',
  name: 'Leviathan',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'If more than 1 good player is executed, evil wins. All players know you are in play. After day 5, evil wins.',
  abilityDetailed: `The Leviathan doesn't kill.
• All players know the Leviathan is in play, even if the Leviathan is created mid-game.
• Any number of evil players may be executed, but if more than one good player is executed, evil wins. It doesn’t matter which characters were executed, only the alignment of the player at the time they were executed.
• When the fifth day ends and night begins, if the Leviathan is still alive, evil wins.
• All types of execution count, even if the player doesn’t die. A player executed due to the Virgin, or due to revealing that they are the Mutant, is still executed. An executed player who lives due to the Pacifist is still executed.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Leviathan',
  firstNight: {
    order: 73,
    helpText: 'Announce that the Leviathan is in play.',
    subActions: [
      {
        id: 'leviathan-fn-1',
        description: 'Announce that the Leviathan is in play.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 92,
    helpText:
      'Change the Leviathan reminder token to the relevant day. You may announce that the Leviathan is in play.',
    subActions: [
      {
        id: 'leviathan-on-1',
        description: 'Change the Leviathan reminder token to the relevant day.',
        isConditional: false,
      },
      {
        id: 'leviathan-on-2',
        description: 'You may announce that the Leviathan is in play.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/leviathanIcon.webp',
    medium: '/icons/characters/leviathanIcon.webp',
    large: '/icons/characters/leviathanIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'leviathan-goodplayerexecuted', text: 'GOOD PLAYER EXECUTED' }],
  jinxes: [
    {
      characterId: 'banshee',
      description:
        'Each night*, the Leviathan chooses an alive good player (different to previous nights): a chosen Banshee dies & gains their ability.',
    },
    {
      characterId: 'exorcist',
      description: 'If the Leviathan nominates and executes the Exorcist-chosen player, good wins.',
    },
    {
      characterId: 'farmer',
      description:
        'Each night*, the Leviathan chooses an alive good player (different to previous nights): a chosen Farmer uses their ability but does not die.',
    },
    {
      characterId: 'grandmother',
      description: 'If the Leviathan is in play and the Grandchild dies by execution, evil wins.',
    },
    { characterId: 'hatter', description: 'The Leviathan cannot enter play after day 5.' },
    {
      characterId: 'innkeeper',
      description:
        'If the Leviathan nominates and executes an Innkeeper-protected player, good wins.',
    },
    {
      characterId: 'king',
      description:
        'If the Leviathan is in play, and at least 1 player is dead, the King learns an alive character each night.',
    },
    {
      characterId: 'mayor',
      description:
        'If the Leviathan and the Mayor are alive on day 5 & no execution occurs, good wins.',
    },
    {
      characterId: 'monk',
      description: 'If the Leviathan nominates and executes the Monk-protected player, good wins.',
    },
    { characterId: 'pithag', description: 'The Leviathan cannot enter play after day 5.' },
    {
      characterId: 'ravenkeeper',
      description:
        'Each night*, the Leviathan chooses an alive player (different to previous nights): a chosen Ravenkeeper uses their ability but does not die.',
    },
    {
      characterId: 'sage',
      description:
        'Each night*, the Leviathan chooses an alive good player (different to previous nights): a chosen Sage uses their ability but does not die.',
    },
    {
      characterId: 'soldier',
      description: 'If the Leviathan nominates and executes the Soldier, good wins.',
    },
  ],
  flavor:
    'To the last, I grapple with thee. From Hell’s heart, I stab at thee. For hate’s sake, I spit my last breath at thee.',
  edition: 'carousel',
};
