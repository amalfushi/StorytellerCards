import type { CharacterDef } from '@/types/index.ts';

export const riot: CharacterDef = {
  id: 'riot',
  name: 'Riot',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'On day 3, Minions become Riot & nominees die but nominate an alive player immediately. This must happen.',
  abilityDetailed: `Riot kills everybody in a panic.
• On the 3rd day, each player that is nominated dies immediately. Even though they are dead, they nominate again.
• The player that was nominated must nominate again immediately or lose their chance to do so. The Storyteller counts down “3... 2... 1...” to let the player know how long they have to nominate, should they wish to. If they don’t, the Storyteller nominates instead.
• The good team wins if all Riot players are dead. If the last Riot dies and only two players are alive, they do not nominate, and the good team wins.
• If nobody nominates on the 3rd day, the Storyteller makes the 1st nomination instead.
• Minions may change into Riot as the nomination phase begins on the 3rd day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Riot',
  firstNight: null,
  otherNights: {
    order: 90,
    helpText:
      'Change the Riot reminder token to the relevant day. If it is night 3, you may wake the Minions. Show the YOU ARE & Riot tokens.',
    subActions: [
      {
        id: 'riot-on-1',
        description: 'Change the Riot reminder token to the relevant day.',
        isConditional: false,
      },
      {
        id: 'riot-on-2',
        description: 'If it is night 3, you may wake the Minions.',
        isConditional: true,
      },
      {
        id: 'riot-on-3',
        description: 'Show the YOU ARE & Riot tokens.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/riotIcon.png',
    medium: '/icons/characters/riotIcon.png',
    large: '/icons/characters/riotIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'atheist',
      description:
        'During a riot, if the Storyteller is nominated, players vote. If they are "about to die", the game ends. If not, they nominate again.',
    },
    {
      characterId: 'banshee',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Banshee dies & gains their ability.',
    },
    {
      characterId: 'exorcist',
      description: 'If Riot nominates and executes the Exorcist-chosen player, good wins.',
    },
    {
      characterId: 'farmer',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Farmer uses their ability but does not die.',
    },
    {
      characterId: 'grandmother',
      description: 'If Riot is in play and the Grandchild dies by execution, evil wins.',
    },
    {
      characterId: 'innkeeper',
      description: 'If Riot nominates and executes an Innkeeper-protected player, good wins.',
    },
    {
      characterId: 'king',
      description:
        'If Riot is in play, and at least 1 player is dead, the King learns an alive character each night.',
    },
    {
      characterId: 'mayor',
      description:
        'The Mayor may choose to stop the riot. If they do so when only 1 Riot is alive, good wins. Otherwise, evil wins.',
    },
    {
      characterId: 'monk',
      description: 'If Riot nominates and executes the Monk-protected player, good wins.',
    },
    {
      characterId: 'ravenkeeper',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Ravenkeeper uses their ability but does not die.',
    },
    {
      characterId: 'sage',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Sage uses their ability but does not die.',
    },
    {
      characterId: 'soldier',
      description: 'If Riot nominates and executes the Soldier, good wins.',
    },
  ],
};
