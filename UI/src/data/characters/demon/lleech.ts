import type { CharacterDef } from '@/types/index.ts';

export const lleech: CharacterDef = {
  id: 'lleech',
  name: 'Lleech',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. You start by choosing a player: they are poisoned. You die if & only if they are dead.',
  abilityDetailed: `The Lleech lives if their host lives, and dies if their host dies.
• On the first night, the Lleech chooses a player, who is poisoned for the rest of the game.
• If this player is alive, the Lleech cannot die. If the Lleech is executed, the Storyteller tells the group that the player lives, but not why.
• If the player that the Lleech chose dies, the Lleech dies as well. If this means that only one or two players are left alive, good still wins, because the Demon is dead.
• From the second night onwards, players that the Lleech attacks die but are not poisoned.
• If a Lleech is created mid-game, they poison a player that night. They must choose an alive player.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Lleech',
  firstNight: {
    order: 25,
    helpText: 'The Lleech chooses a player.',
    subActions: [
      {
        id: 'lleech-fn-1',
        description: 'The Lleech chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 45,
    helpText: 'The Lleech chooses a player.',
    subActions: [
      {
        id: 'lleech-on-1',
        description: 'The Lleech chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/lleechIcon.webp',
    medium: '/icons/characters/lleechIcon.webp',
    large: '/icons/characters/lleechIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'lleech-poisoned', text: 'POISONED' }],
  jinxes: [
    { characterId: 'heretic', description: 'Only 1 jinxed character can be in play.' },
    {
      characterId: 'mastermind',
      description:
        'If the Mastermind is alive and the Lleech host dies by execution, the Lleech lives but loses their ability.',
    },
    { characterId: 'slayer', description: 'If the Slayer slays the Lleech host, the host dies.' },
  ],
  flavor:
    'Tasty, tasty, tasty, tasty, tasty, tasty, tasty, tasty brai- I mean pie! Yes. Tasty pie. That’s what I meant to say.',
  edition: 'carousel',
};
