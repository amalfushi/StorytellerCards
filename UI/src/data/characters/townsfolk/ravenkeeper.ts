import type { CharacterDef } from '@/types/index.ts';

export const ravenkeeper: CharacterDef = {
  id: 'ravenkeeper',
  name: 'Ravenkeeper',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'If you die at night, you are woken to choose a player: you learn their character.',
  abilityDetailed: `If the Ravenkeeper dies at night, they get to learn one player's character.
• The Ravenkeeper is woken on the night that they die, and chooses a player immediately.
• The Ravenkeeper may choose a dead player if they wish.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Ravenkeeper',
  firstNight: null,
  otherNights: {
    order: 68,
    helpText:
      "If the Ravenkeeper died tonight, the Ravenkeeper chooses a player. Show that player's character token.",
    subActions: [
      {
        id: 'ravenkeeper-on-1',
        description: 'If the Ravenkeeper died tonight, the Ravenkeeper chooses a player.',
        isConditional: true,
      },
      {
        id: 'ravenkeeper-on-2',
        description: "Show that player's character token.",
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/ravenkeeperIcon.png',
    medium: '/icons/characters/ravenkeeperIcon.png',
    large: '/icons/characters/ravenkeeperIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'Each night*, the Leviathan chooses an alive player (different to previous nights): a chosen Ravenkeeper uses their ability but does not die.',
    },
    {
      characterId: 'riot',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Ravenkeeper uses their ability but does not die.',
    },
  ],
};
