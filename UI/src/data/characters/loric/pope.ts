import type { CharacterDef } from '@/types/index.ts';

export const pope: CharacterDef = {
  id: 'pope',
  name: 'Pope',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort: 'There are duplicate good characters in play. They might also be bluffs.',
  abilityDetailed: `The Pope creates duplicate character claims.
• A Townsfolk or an Outsider, or both, have multiple copies in play.
• There may be one character that has multiple copies in play, or multiple characters that have multiple copies in play.
• There may be 2 characters that are the same, or as many as the Storyteller has tokens to accommodate.
• These characters might be a part of the 3 bluffs given to the Demon.
• The Storyteller will need multiple copies of the game, or at least some way to access identical character tokens, in order to run this character... for now.
• Duplicate Outsider characters may cause an unusual number of Outsiders. Duplicate Townsfolk characters may not.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Pope',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/popeIcon.webp',
    medium: '/icons/characters/popeIcon.webp',
    large: '/icons/characters/popeIcon.webp',
    placeholder: '#558b2f',
  },
  reminders: [{ id: 'pope-demoninfo', text: 'DEMON INFO' }],
  flavor: '...Pulcherrimae.',
  edition: 'loric',
  setup: true,
};
