import type { CharacterDef } from '@/types/index.ts';

export const fortuneteller: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
  abilityDetailed: `The Fortune Teller detects who the Demon is, but sometimes thinks good players are Demons.
• Each night, the Fortune Teller chooses two players and learns if at least one of them is a Demon. They do not learn which of them is a Demon, just that one of them is. If neither is the Demon, they learn this instead.
• Unfortunately, one player, called the Red Herring, will register as a Demon to the Fortune Teller if chosen. The Red Herring is the same player throughout the entire game. This player may be any good player, even the Fortune Teller themself, and the Fortune Teller does not know which player it is.
• The Fortune Teller may choose any two players—alive or dead, or even themself. If they choose a dead Demon, then the Fortune Teller still receives a nod.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fortune_Teller',
  firstNight: {
    order: 51,
    helpText:
      'The Fortune Teller chooses 2 players. Nod if either is the Demon (or the RED HERRING).',
    subActions: [
      {
        id: 'fortuneteller-fn-1',
        description: 'The Fortune Teller chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'fortuneteller-fn-2',
        description: 'Nod if either is the Demon (or the RED HERRING).',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  otherNights: {
    order: 70,
    helpText:
      'The Fortune Teller chooses 2 players. Nod if either is the Demon (or the RED HERRING).',
    subActions: [
      {
        id: 'fortuneteller-on-1',
        description: 'The Fortune Teller chooses 2 players.',
        isConditional: false,
      },
      {
        id: 'fortuneteller-on-2',
        description: 'Nod if either is the Demon (or the RED HERRING).',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: {
    small: '/icons/characters/fortunetellerIcon.png',
    medium: '/icons/characters/fortunetellerIcon.png',
    large: '/icons/characters/fortunetellerIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
