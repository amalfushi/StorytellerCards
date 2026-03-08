import type { CharacterDef } from '@/types/index.ts';

export const widow: CharacterDef = {
  id: 'widow',
  name: 'Widow',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'On your 1st night, look at the Grimoire & choose a player: they are poisoned. 1 good player knows a Widow is in play.',
  abilityDetailed: `The Widow sees the Grimoire and poisons a character of their choice.
• The Widow acts on their first night only, poisoning one player.
• The player that the Widow poisons is poisoned until the Widow dies.
• On the same night that the Widow acts, one good player learns that the Widow is in play, but not which player is the Widow, and not which player is poisoned.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Widow',
  firstNight: {
    order: 28,
    helpText:
      'Show the Grimoire for as long as the Widow needs. The Widow chooses a player. Put the Widow to sleep. Wake the player marked KNOW & show the Widow token.',
    subActions: [
      {
        id: 'widow-fn-1',
        description: 'Show the Grimoire for as long as the Widow needs.',
        isConditional: false,
      },
      {
        id: 'widow-fn-2',
        description: 'The Widow chooses a player.',
        isConditional: false,
      },
      {
        id: 'widow-fn-3',
        description: 'Put the Widow to sleep.',
        isConditional: false,
      },
      {
        id: 'widow-fn-4',
        description: 'Wake the player marked KNOW & show the Widow token.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/widowIcon.webp',
    medium: '/icons/characters/widowIcon.webp',
    large: '/icons/characters/widowIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [
    { id: 'widow-know', text: 'KNOW' },
    { id: 'widow-poisoned', text: 'POISONED' },
  ],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'An Alchemist-Widow has no Widow ability & a Widow is in play. After each execution, a living Alchemist-Widow may publicly guess a living player as the Widow. If correct, the Demon must choose the Widow tonight.',
    },
    {
      characterId: 'damsel',
      description: 'If the Widow is (or has been) in play, the Damsel is poisoned.',
    },
    { characterId: 'heretic', description: 'Only 1 jinxed character can be in play.' },
    {
      characterId: 'magician',
      description:
        "When the Widow sees the Grimoire, the Demon and Magician's character tokens are removed.",
    },
    {
      characterId: 'poppygrower',
      description: 'If the Poppy Grower has their ability, the Widow does not see the Grimoire.',
    },
  ],
  flavor: 'More wine? Château d’Ergot ’07 is a very special vintage. My yes, very special indeed.',
  edition: 'carousel',
};
