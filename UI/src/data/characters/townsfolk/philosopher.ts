import type { CharacterDef } from '@/types/index.ts';

export const philosopher: CharacterDef = {
  id: 'philosopher',
  name: 'Philosopher',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose a good character: gain that ability. If this character is in play, they are drunk.',
  firstNight: {
    order: 9,
    helpText: 'The Philosopher might choose a character. If necessary, swap their character token.',
    subActions: [
      {
        id: 'philosopher-fn-1',
        description: 'The Philosopher might choose a character.',
        isConditional: false,
      },
      {
        id: 'philosopher-fn-2',
        description: 'If necessary, swap their character token.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  otherNights: {
    order: 4,
    helpText: 'The Philosopher might choose a character. If necessary, swap their character token.',
    subActions: [
      {
        id: 'philosopher-on-1',
        description: 'The Philosopher might choose a character.',
        isConditional: false,
      },
      {
        id: 'philosopher-on-2',
        description: 'If necessary, swap their character token.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  icon: { placeholder: '#1976d2' },
  reminders: [],
};
