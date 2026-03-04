import type { CharacterDef } from '@/types/index.ts';

export const matron: CharacterDef = {
  id: 'matron',
  name: 'Matron',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each day, you may choose up to 3 sets of 2 players to swap seats. Players may not leave their seats to talk in private.',
  abilityDetailed: `The Matron chooses which players sit where.
• The Matron may swap two players’ seating positions, up to three times per day. The new seating order is permanent, unless changed again by the Matron.
• The same player may be moved multiple times.
• Some players may find moving difficult due to a physical disability or impediment. In these cases, they are immune to the Matron’s ability and can stay put.
• With the Matron in play, players may not talk privately except with their immediate neighbors while sitting down. Players may not leave their seat to whisper something to any player, and may not even talk about the game to each other when going to the bathroom, and so on. Players should self-police this.
• If the Matron swaps just one or two sets of players, they may not swap another set of players later that day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Matron',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/matronIcon.png',
    medium: '/icons/characters/matronIcon.png',
    large: '/icons/characters/matronIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
