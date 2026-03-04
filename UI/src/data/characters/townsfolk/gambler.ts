import type { CharacterDef } from '@/types/index.ts';

export const gambler: CharacterDef = {
  id: 'gambler',
  name: 'Gambler',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night*, choose a player & guess their character: if you guess wrong, you die.',
  abilityDetailed: `The Gambler can guess who is who... but pays the ultimate price if they guess wrong.
• Each night except the first, the Gambler chooses a player and guesses their character by pointing to its icon on the character sheet. If the guess is correct, nothing happens. If the guess is incorrect, the Gambler dies.
• The Gambler does not learn from the Storyteller whether their guess is correct or incorrect.
• The Gambler may choose any player, dead or alive, even themself.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gambler',
  firstNight: null,
  otherNights: {
    order: 14,
    helpText: 'The Gambler chooses a player & a character.',
    subActions: [
      {
        id: 'gambler-on-1',
        description: 'The Gambler chooses a player & a character.',
        isConditional: false,
      },
    ],
    choices: [
      { type: 'player', maxSelections: 1, label: 'Choose a player' },
      { type: 'character', maxSelections: 1, label: 'Choose a character' },
    ],
  },
  icon: {
    small: '/icons/characters/gamblerIcon.png',
    medium: '/icons/characters/gamblerIcon.png',
    large: '/icons/characters/gamblerIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
