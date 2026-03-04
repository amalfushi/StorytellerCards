import type { CharacterDef } from '@/types/index.ts';

export const chef: CharacterDef = {
  id: 'chef',
  name: 'Chef',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing how many pairs of evil players there are.',
  abilityDetailed: `The Chef knows if evil players are sitting next to each other.
• On the first night, the Chef learns exactly how many pairs of evil players there are in total. A pair is two players, but one player may be a part of two pairs. So, two players sitting next to each other is one pair. Three players sitting next to each other is two pairs. Four players sitting next to each other is three pairs. And so on.
• The Chef detects evil Travellers just like other character types, but only if those Travellers joined the game before the Chef acts.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Chef',
  firstNight: {
    order: 49,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'chef-fn-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/chefIcon.png',
    medium: '/icons/characters/chefIcon.png',
    large: '/icons/characters/chefIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
