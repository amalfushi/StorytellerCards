import type { CharacterDef } from '@/types/index.ts';

export const acrobat: CharacterDef = {
  id: 'acrobat',
  name: 'Acrobat',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night*, choose a player: if they are or become drunk or poisoned tonight, you die.',
  abilityDetailed: `The Acrobat dies when they find a drunk or poisoned player.
• Each night except the first, the Acrobat chooses a player. If the chosen player is sober and healthy, nothing happens. If the player is drunk or poisoned, the Acrobat dies.
• If the Acrobat is drunk or poisoned, they cannot die to their own ability.
• The Acrobat may choose any player, dead or alive, even themself.
• If the chosen player is sober and healthy at the time the Acrobat picks, but becomes drunk or poisoned later in the night, the Acrobat dies.
• The Acrobat does not learn if the player they selected was drunk, or poisoned, or both.
• The Drunk registers as drunk to the Acrobat.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Acrobat',
  firstNight: null,
  otherNights: {
    order: 15,
    helpText: 'The Acrobat chooses a player.',
    subActions: [
      {
        id: 'acrobat-on-1',
        description: 'The Acrobat chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/acrobatIcon.webp',
    medium: '/icons/characters/acrobatIcon.webp',
    large: '/icons/characters/acrobatIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor: 'Welcome, one and all, to the greatest show on earth.',
  edition: 'carousel',
};
