import type { CharacterDef } from '@/types/index.ts';

export const baron: CharacterDef = {
  id: 'baron',
  name: 'Baron',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'There are extra Outsiders in play. [+2 Outsiders]',
  abilityDetailed: `The Baron changes the number of Outsiders present in the game.
• This change happens during setup, and it does not revert if the Baron dies. A change in characters during setup, regardless of what happens during the game, is shown on character sheets and tokens in square brackets at the end of a character's description—like [this].
• The added Outsiders always replace Townsfolk, not other character types.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Baron',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/baronIcon.png',
    medium: '/icons/characters/baronIcon.png',
    large: '/icons/characters/baronIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  setupModification: {
    description: 'There are extra Outsiders in play. [+2 Outsiders]',
  },
};
