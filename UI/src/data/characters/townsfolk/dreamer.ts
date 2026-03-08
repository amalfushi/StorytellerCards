import type { CharacterDef } from '@/types/index.ts';

export const dreamer: CharacterDef = {
  id: 'dreamer',
  name: 'Dreamer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose a player (not yourself or Travellers): you learn 1 good & 1 evil character, 1 of which is correct.',
  abilityDetailed: `The Dreamer learns players' characters, but is not sure if their information is entirely correct.
• Each night, the Dreamer chooses a player and learns two characters—one that the player is, and one that the player isn’t.
• The false character token depends on the chosen player’s true character type. If the Dreamer chooses a player who is a Townsfolk or Outsider, the false character token is any Minion or Demon. If they choose a player who is a Minion or Demon, the false character token is a Townsfolk or Outsider.
• The Dreamer may not choose themself, and may not choose a Traveller.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Dreamer',
  firstNight: {
    order: 55,
    helpText:
      'The Dreamer points to a player. Show 1 good & 1 evil character token, 1 of which is their character.',
    subActions: [
      {
        id: 'dreamer-fn-1',
        description: 'The Dreamer points to a player.',
        isConditional: false,
      },
      {
        id: 'dreamer-fn-2',
        description: 'Show 1 good & 1 evil character token, 1 of which is their character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 72,
    helpText:
      'The Dreamer points to a player. Show 1 good & 1 evil character token, 1 of which is their character.',
    subActions: [
      {
        id: 'dreamer-on-1',
        description: 'The Dreamer points to a player.',
        isConditional: false,
      },
      {
        id: 'dreamer-on-2',
        description: 'Show 1 good & 1 evil character token, 1 of which is their character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/dreamerIcon.webp',
    medium: '/icons/characters/dreamerIcon.webp',
    large: '/icons/characters/dreamerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    'I remember the Clockmaker. The sky was red and it was raining fractal triangles. There was a smell of violets and a bubbling sound. A woman with glowing eyes and a scraggly beard was hissing at the sky. Then, I awoke.',
  edition: 'snv',
};
