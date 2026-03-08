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
  reminders: [],
  flavor:
    'Sarcasm is indeed the lowest form of wit. But speaking in response to your criticism, Sir, it is, nevertheless, a form of wit.',
  edition: 'carousel',
};
