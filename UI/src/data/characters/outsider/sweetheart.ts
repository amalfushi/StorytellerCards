import type { CharacterDef } from '@/types/index.ts';

export const sweetheart: CharacterDef = {
  id: 'sweetheart',
  name: 'Sweetheart',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'When you die, 1 player is drunk from now on.',
  abilityDetailed: `The Sweetheart, when they die, causes someone to be drunk for the rest of the game.
• The Storyteller chooses which player becomes drunk.
• This ability works while the Sweetheart is dead.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Sweetheart',
  firstNight: null,
  otherNights: {
    order: 54,
    helpText:
      "If the Sweetheart died, a player became drunk immediately. If you haven't done this yet, do so now.",
    subActions: [
      {
        id: 'sweetheart-on-1',
        description: 'If the Sweetheart died, a player became drunk immediately.',
        isConditional: true,
      },
      {
        id: 'sweetheart-on-2',
        description: "If you haven't done this yet, do so now.",
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/sweetheartIcon.png',
    medium: '/icons/characters/sweetheartIcon.png',
    large: '/icons/characters/sweetheartIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'sweetheart-drunk', text: 'DRUNK' }],
};
