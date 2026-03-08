import type { CharacterDef } from '@/types/index.ts';

export const doomsayer: CharacterDef = {
  id: 'doomsayer',
  name: 'Doomsayer',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'If 4 or more players live, each living player may publicly choose (once per game) that a player of their own alignment dies.',
  abilityDetailed: `Use the Doomsayer to make large games take less time.
• The Doomsayer allows players to sacrifice their allies in order to gain information, which shortens the game.
• Only alive players may use the Doomsayer ability, and each may do so only once per game. It is their responsibility to remember to not use it again.
• If a player says something like “I use the Doomsayer ability,” then the Storyteller chooses which player to kill, but they must kill an alive player of the same alignment as the player who used the Doomsayer ability. So, if a good player uses the ability, then a good player dies. If an evil player uses the ability, then an evil player dies.
• Once three players are left alive, the Doomsayer ability may no longer be used.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Doomsayer',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/doomsayerIcon.webp',
    medium: '/icons/characters/doomsayerIcon.webp',
    large: '/icons/characters/doomsayerIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [],
  flavor:
    'And on the Seventh Day, there shall be a great flood and a pestilence upon the People of the Village of the Ravens! The dead shall rise and the living shall repent! O Woe! O Unholy day! Only by great sacrifice shall they prevail! So sayeth the Sages of Nostros and so sayeth I.',
  edition: 'fabled',
};
