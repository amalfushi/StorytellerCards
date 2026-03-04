import type { CharacterDef } from '@/types/index.ts';

export const steward: CharacterDef = {
  id: 'steward',
  name: 'Steward',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing 1 good player.',
  abilityDetailed: `The Steward knows 1 good player.
• The Steward learns a player, but not their character.
• The Steward learns their information on the first night of the game.
• If created mid-game, then the Steward learns their information that night instead.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Steward',
  firstNight: {
    order: 57,
    helpText: 'Point to the player marked KNOW.',
    subActions: [
      {
        id: 'steward-fn-1',
        description: 'Point to the player marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/stewardIcon.png',
    medium: '/icons/characters/stewardIcon.png',
    large: '/icons/characters/stewardIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
