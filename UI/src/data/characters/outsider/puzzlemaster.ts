import type { CharacterDef } from '@/types/index.ts';

export const puzzlemaster: CharacterDef = {
  id: 'puzzlemaster',
  name: 'Puzzlemaster',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    '1 player is drunk, even if you die. If you guess (once) who it is, learn the Demon player, but guess wrong & get false info.',
  abilityDetailed: `The Puzzlemaster tries to figure out who is drunk.
• A player is drunk for the whole game. It will most often be a Townsfolk, but could be an Outsider. This player does not know that they are drunk.
• Once per game, the Puzzlemaster may guess which player it is. They may guess publicly, or privately. Whatever their guess, the Storyteller privately tells the Puzzlemaster the name of one player. If the Puzzlemaster guessed correctly, they learn which player the Demon is. If the Puzzlemaster guessed incorrectly, they learn a different player instead.
• The Puzzlemaster isn’t told if they guessed correctly or not.
• Only the player made drunk by the Puzzlemaster counts as a successful guess. Players drunk by other means don’t count.
• If the Puzzlemaster dies, the drunk player is still drunk. A dead Puzzlemaster may not make a guess, as they don’t have that part of their ability.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Puzzlemaster',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/puzzlemasterIcon.webp',
    medium: '/icons/characters/puzzlemasterIcon.webp',
    large: '/icons/characters/puzzlemasterIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [
    { id: 'puzzlemaster-drunk', text: 'DRUNK' },
    { id: 'puzzlemaster-guessused', text: 'GUESS USED' },
  ],
  flavor:
    'When one begins to think that some thing is merely some other thing, one is usually on the brink of an error. Patience, patience. Don’t confuse just and should with is and isn’t.',
  edition: 'carousel',
};
