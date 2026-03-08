import type { CharacterDef } from '@/types/index.ts';

export const sage: CharacterDef = {
  id: 'sage',
  name: 'Sage',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'If the Demon kills you, you learn that it is 1 of 2 players.',
  abilityDetailed: `The Sage knows nothing while alive, but learns the most important information of all at the moment of their death - who killed them.
• The Sage only gets this information when killed by a Demon attack. Being executed does not count.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Sage',
  firstNight: null,
  otherNights: {
    order: 56,
    helpText:
      'If the Demon killed the Sage, wake the Sage and point to 2 players, 1 of which is the Demon.',
    subActions: [
      {
        id: 'sage-on-1',
        description:
          'If the Demon killed the Sage, wake the Sage and point to 2 players, 1 of which is the Demon.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/sageIcon.webp',
    medium: '/icons/characters/sageIcon.webp',
    large: '/icons/characters/sageIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'Each night*, the Leviathan chooses an alive good player (different to previous nights): a chosen Sage uses their ability but does not die.',
    },
    {
      characterId: 'riot',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Sage uses their ability but does not die.',
    },
  ],
  flavor:
    'These mountainous tomes guard the secret, I am sure of it! Twixt word and word, it lies in wait. More candles, boy! More ink! These notes may look arcane, but the infernal puzzle is revealing itself.',
  edition: 'snv',
};
