import type { CharacterDef } from '@/types/index.ts';

export const knight: CharacterDef = {
  id: 'knight',
  name: 'Knight',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing 2 players that are not the Demon.',
  abilityDetailed: `The Knight knows players that are not the Demon.
• On the first night, the Knight learns two players who are not the Demon.
• On subsequent nights, they learn nothing more.
• The Knight can learn Townsfolk, Outsiders or even Minions but does not learn which character type they are.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Knight',
  firstNight: {
    order: 58,
    helpText: 'Point to the 2 players marked KNOW.',
    subActions: [
      {
        id: 'knight-fn-1',
        description: 'Point to the 2 players marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/knightIcon.webp',
    medium: '/icons/characters/knightIcon.webp',
    large: '/icons/characters/knightIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'knight-know-1', text: 'Know', sourceCharacterId: 'knight' },
    { id: 'knight-know-2', text: 'Know', sourceCharacterId: 'knight' },
  ],
  firstNightReminderSetup: [
    {
      id: 'know-tokens',
      description: 'Place 2 Know reminders on the players Knight will learn are not the Demon.',
      reminderTokenIds: ['knight-know-1', 'knight-know-2'],
    },
  ],
  flavor: 'When a man lies, he murders some part of the world.',
  edition: 'carousel',
};
