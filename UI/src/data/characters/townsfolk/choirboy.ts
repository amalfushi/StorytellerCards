import type { CharacterDef } from '@/types/index.ts';

export const choirboy: CharacterDef = {
  id: 'choirboy',
  name: 'Choirboy',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'If the Demon kills the King, you learn which player is the Demon. [+the King]',
  abilityDetailed: `The Choirboy learns who the Demon is when the King is slain.
• The King can be in play without the Choirboy. During the setup phase, if the Choirboy is in play and the King isn’t, the King is added. If a King is already in play, the Choirboy doesn’t add a second King.
• If the Demon kills the King using their ability, the Choirboy learns which player is the Demon. The Demon nominating and executing the King doesn’t count. Minions that kill the King, such as the Assassin, don’t count either.
• If the Demon attacks the King but doesn’t kill the King, the Choirboy doesn’t learn who the Demon is.
• The Choirboy learns which player the Demon is, but does not learn which character.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Choirboy',
  firstNight: null,
  otherNights: {
    order: 59,
    helpText: 'If the Demon killed the King, point to the Demon player.',
    subActions: [
      {
        id: 'choirboy-on-1',
        description: 'If the Demon killed the King, point to the Demon player.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/choirboyIcon.webp',
    medium: '/icons/characters/choirboyIcon.webp',
    large: '/icons/characters/choirboyIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    'I saw it, I did. I was in the pews, tidying the hymn books, when a dreadful tune started from the pipe organ. The organist had a long cloak, and long fingers on the keys. And a hat that looked… just like… yours.',
  edition: 'carousel',
  setup: true,
};
