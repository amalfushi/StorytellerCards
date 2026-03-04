import type { CharacterDef } from '@/types/index.ts';

export const revolutionary: CharacterDef = {
  id: 'revolutionary',
  name: 'Revolutionary',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    '2 neighboring players are known to be the same alignment. Once per game, 1 of them registers falsely.',
  abilityDetailed: `Use the Revolutionary to help disadvantaged players participate.
• If a player has an intellectual disability, is unable to understand the rules of the game, is blind or deaf, or is unable to communicate or participate as normal, they may still play by teaming up with a player that they trust.
• These two players are the same alignment and sit next to each other so they can whisper or signal to each other throughout the game. The experienced player can help the disadvantaged player in whatever way is needed, talking on their behalf or suggesting what to do.
• The Revolutionary is also useful for couples or good friends who wish to play, but are uncomfortable with lying to or mistrusting each other, even in a game.
• Once per game, the Storyteller can make either player register as a different character, alignment, or both.
• The Storyteller may wake both players at night, instead of just the player due to wake, if that helps understanding.
• If an ability would change a Revolutionary’s alignment, this ability has no effect or it changes both Revolutionaries’ alignment, Storyteller’s choice.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Revolutionary',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/revolutionaryIcon.png',
    medium: '/icons/characters/revolutionaryIcon.png',
    large: '/icons/characters/revolutionaryIcon.png',
    placeholder: '#ff9800',
  },
  reminders: [],
};
