import type { CharacterDef } from '@/types/index.ts';

export const legion: CharacterDef = {
  id: 'legion',
  name: 'Legion',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, a player might die. Executions fail if only evil voted. You register as a Minion too. [Most players are Legion]',
  abilityDetailed: `Legion is many Demons.
• The recommended number of good and evil players is the reverse of the normal. For example, for a ten player game, there are roughly seven Legion and three good players.
• The players that are not Legion may be Townsfolk or Outsiders, in any combination.
• If at least one good player voted for the nomination, and that player is “about to die”, then the execution happens as normal. If only evil players vote for a nomination, the vote tally for that nominee is zero.
• Each Legion registers as a Minion as well as a Demon.
• The Storyteller chooses which player dies at night.
• If only one good player remains alive, the Storyteller may declare that evil wins, since good cannot win.
• The Storyteller can decide not to give Legion players bluffs.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Legion',
  firstNight: null,
  otherNights: {
    order: 32,
    helpText: 'A player might die.',
    subActions: [
      {
        id: 'legion-on-1',
        description: 'A player might die.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/legionIcon.png',
    medium: '/icons/characters/legionIcon.png',
    large: '/icons/characters/legionIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'legion-abouttodie', text: 'ABOUT TO DIE' }],
  jinxes: [
    {
      characterId: 'engineer',
      description:
        'If Legion is created, all evil players become Legion. If Legion is in play, the Engineer starts knowing this but has no ability.',
    },
    {
      characterId: 'hatter',
      description:
        'If Legion is created, all evil players become Legion. If Legion is in play, the Hatter has no ability.',
    },
    {
      characterId: 'magician',
      description:
        'The Magician wakes with Legion and might register as evil. Legion knows if a Magician is in play, but not which player it is.',
    },
    {
      characterId: 'minstrel',
      description:
        'If Legion died by execution today, Legion keeps their ability, but the Minstrel might learn they are Legion.',
    },
    { characterId: 'politician', description: 'The Politician might register as evil to Legion.' },
    {
      characterId: 'preacher',
      description:
        'If the Preacher chooses Legion, Legion keeps their ability, but the Preacher might learn they are Legion.',
    },
    {
      characterId: 'summoner',
      description: 'If Legion is summoned, all evil players become Legion.',
    },
    { characterId: 'zealot', description: 'The Zealot might register as evil to Legion.' },
  ],
};
