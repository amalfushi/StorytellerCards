import type { CharacterDef } from '@/types/index.ts';

export const towncrier: CharacterDef = {
  id: 'towncrier',
  name: 'Town Crier',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night*, you learn if a Minion nominated today.',
  abilityDetailed: `The Town Crier knows when Minions nominate.
• Each night, the Town Crier learns either a “yes” or a “no”.
• They do not learn which players are Minions or how many Minions made nominations, just whether or not any Minions made nominations today.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Town_Crier',
  firstNight: null,
  otherNights: {
    order: 74,
    helpText: 'Either nod or shake your head.',
    subActions: [
      {
        id: 'towncrier-on-1',
        description: 'Either nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'yesno', maxSelections: 1, label: 'Nod / Shake' }],
  },
  icon: {
    small: '/icons/characters/towncrierIcon.png',
    medium: '/icons/characters/towncrierIcon.png',
    large: '/icons/characters/towncrierIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'towncrier-minionsnotnominated', text: 'MINIONS NOT NOMINATED' },
    { id: 'towncrier-minionnominated', text: 'MINION NOMINATED' },
  ],
};
