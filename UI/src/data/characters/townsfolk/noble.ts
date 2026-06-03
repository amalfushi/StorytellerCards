import type { CharacterDef } from '@/types/index.ts';

export const noble: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You start knowing 3 players, 1 and only 1 of which is evil.',
  abilityDetailed: `The Noble learns that one of three players is evil.
• The Noble learns their information on the first night only.
• If a Noble is created mid-game, the Noble learns their information on their first night.
• The Noble learns two good players and one evil player. They may not learn one good player and two evil players. They may not learn three evil players.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Noble',
  firstNight: {
    order: 59,
    helpText: 'Point to the 3 players marked KNOW.',
    subActions: [
      {
        id: 'noble-fn-1',
        description: 'Point to the 3 players marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/nobleIcon.webp',
    medium: '/icons/characters/nobleIcon.webp',
    large: '/icons/characters/nobleIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'noble-know-1', text: 'Know', sourceCharacterId: 'noble' },
    { id: 'noble-know-2', text: 'Know', sourceCharacterId: 'noble' },
    { id: 'noble-know-3', text: 'Know', sourceCharacterId: 'noble' },
  ],
  firstNightReminderSetup: [
    {
      id: 'know-tokens',
      description: 'Place 3 Know reminders on the players Noble will learn (exactly 1 evil).',
      reminderTokenIds: ['noble-know-1', 'noble-know-2', 'noble-know-3'],
    },
  ],
  flavor:
    'Sarcasm is indeed the lowest form of wit. But speaking in response to your criticism, Sir, it is, nevertheless, a form of wit.',
  edition: 'carousel',
};
