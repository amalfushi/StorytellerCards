import type { CharacterDef } from '@/types/index.ts';

export const damsel: CharacterDef = {
  id: 'damsel',
  name: 'Damsel',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'All Minions know a Damsel is in play. If a Minion publicly guesses you (once), your team loses.',
  firstNight: {
    order: 44,
    helpText:
      "During Minion Info, show the Minions the Damsel token. If you haven't done this yet, do so now. If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.",
    subActions: [
      {
        id: 'damsel-fn-1',
        description: 'During Minion Info, show the Minions the Damsel token.',
        isConditional: false,
      },
      {
        id: 'damsel-fn-2',
        description: "If you haven't done this yet, do so now.",
        isConditional: true,
      },
      {
        id: 'damsel-fn-3',
        description:
          'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
        isConditional: true,
      },
    ],
  },
  otherNights: {
    order: 61,
    helpText:
      'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'damsel-on-1',
        description:
          'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
        isConditional: true,
      },
    ],
  },
  icon: { placeholder: '#42a5f5' },
  reminders: [],
};
