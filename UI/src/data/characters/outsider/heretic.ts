import type { CharacterDef } from '@/types/index.ts';

export const heretic: CharacterDef = {
  id: 'heretic',
  name: 'Heretic',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'Whoever wins, loses & whoever loses, wins, even if you are dead.',
  abilityDetailed: `The Heretic turns a win into a loss, and a loss into a win.
• If the game ends due to the good team winning, then all good players lose, and all evil players win.
• If the game ends due to the evil team winning, then all evil players lose, and all good players win.
• The Heretic’s ability applies to all victory conditions, including the game ending due to just two players being alive, the Demon dying, or an ability ending the game.
• The Heretic’s ability functions even when the Heretic is dead, but not when the Heretic is drunk or poisoned.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Heretic',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/hereticIcon.png',
    medium: '/icons/characters/hereticIcon.png',
    large: '/icons/characters/hereticIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
  jinxes: [
    { characterId: 'baron', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'boffin', description: 'The Demon cannot have the Heretic ability.' },
    { characterId: 'godfather', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'lleech', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'pithag', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'spy', description: 'Only 1 jinxed character can be in play.' },
    { characterId: 'widow', description: 'Only 1 jinxed character can be in play.' },
  ],
};
