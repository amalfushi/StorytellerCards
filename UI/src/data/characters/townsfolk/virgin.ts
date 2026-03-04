import type { CharacterDef } from '@/types/index.ts';

export const virgin: CharacterDef = {
  id: 'virgin',
  name: 'Virgin',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.',
  abilityDetailed: `The Virgin may inadvertently execute their accuser, confirming which players are Townsfolk in the process.
• If a Townsfolk nominates the Virgin, then that Townsfolk is executed immediately. Because there can only be one execution per day, the nomination process immediately ends, even if a player was about to die.
• Only Townsfolk are executed due to the Virgin's ability. If an Outsider, Minion, or Demon nominates the Virgin, nothing happens, and voting continues.
• The Virgin's ability is powerful because if a Townsfolk nominates them and dies, then both characters are almost certainly Townsfolk.
• After being nominated for the first time, the Virgin loses their ability, even if the nominator did not die, and even if the Virgin was poisoned or drunk.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Virgin',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/virginIcon.png',
    medium: '/icons/characters/virginIcon.png',
    large: '/icons/characters/virginIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'virgin-noability', text: 'NO ABILITY' }],
};
