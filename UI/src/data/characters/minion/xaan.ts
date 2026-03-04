import type { CharacterDef } from '@/types/index.ts';

export const xaan: CharacterDef = {
  id: 'xaan',
  name: 'Xaan',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'On night X, all Townsfolk are poisoned until dusk. [X Outsiders]',
  abilityDetailed: `The Xaan poisons all Townsfolk.
• The Xaan poisons all Townsfolk players for one night then one day. The night that this happens equals the number of Outsiders in play. For example, if there are 2 Outsiders, the Xaan poisons on night 2.
• There can be any number of Outsiders in play, but usually 1 to 4. This can be the normal number of Outsiders if the Xaan was not in play, or something different. This overrides other characters that add or remove Outsiders, such as the Baron.
• If the number of Outsiders changes during the game, the Xaan poisons on the night corresponding to the number of Outsiders during setup.
• The Xaan needs to be alive in order to poison.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Xaan',
  firstNight: {
    order: 26,
    helpText: 'If X is 1, mark the Xaan with the X reminder token.',
    subActions: [
      {
        id: 'xaan-fn-1',
        description: 'If X is 1, mark the Xaan with the X reminder token.',
        isConditional: true,
      },
    ],
  },
  otherNights: {
    order: 9,
    helpText:
      'Change the Xaan reminder token to the relevant night. If it is night X, mark the Xaan with the X reminder token.',
    subActions: [
      {
        id: 'xaan-on-1',
        description: 'Change the Xaan reminder token to the relevant night.',
        isConditional: false,
      },
      {
        id: 'xaan-on-2',
        description: 'If it is night X, mark the Xaan with the X reminder token.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/xaanIcon.png',
    medium: '/icons/characters/xaanIcon.png',
    large: '/icons/characters/xaanIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
};
