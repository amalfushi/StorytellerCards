import type { CharacterDef } from '@/types/index.ts';

export const scarletwoman: CharacterDef = {
  id: 'scarletwoman',
  name: 'Scarlet Woman',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    "If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don't count)",
  abilityDetailed: `The Scarlet Woman becomes the Demon when the Demon dies.
• If there are five or more players just before the Demon dies—that is, four or more players left alive after the Demon dies—then the Scarlet Woman immediately becomes the Demon, and the game continues as if nothing happened.
• Travellers do not count as players when seeing if the Scarlet Woman's ability triggers.
• If less than five players are alive when the Demon is executed, then the game ends and good wins.
• If five or more players are alive when the Imp kills themself at night, the Scarlet Woman must become the new Imp.
• If the Scarlet Woman becomes the Demon, they are that Demon in every way. Good wins if they are executed. They attack each night. They register as the Demon.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Scarlet_Woman',
  firstNight: null,
  otherNights: {
    order: 26,
    helpText:
      'If the Scarlet Woman became the Demon today, show them the YOU ARE token, then the Demon token.',
    subActions: [
      {
        id: 'scarletwoman-on-1',
        description:
          'If the Scarlet Woman became the Demon today, show them the YOU ARE token, then the Demon token.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/scarletwomanIcon.webp',
    medium: '/icons/characters/scarletwomanIcon.webp',
    large: '/icons/characters/scarletwomanIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Scarlet Woman ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'alhadikhia',
      description:
        'If there would be two Demons, one of which was the Scarlet Woman, the Scarlet Woman becomes the Scarlet Woman again.',
    },
    {
      characterId: 'lilmonsta',
      description:
        "If Lil' Monsta dies with 5 or more players alive, the Scarlet Woman babysits Lil' Monsta for the rest of the game.",
    },
  ],
  flavor:
    'You have shown me the secrets of the Council of the Purple Flame. We have lain together in fire and in lust and in beastly commune, and I am forever your servant. But tonight, my dear, I am your master.',
  edition: 'tb',
};
