import type { CharacterDef } from '@/types/index.ts';

export const highpriestess: CharacterDef = {
  id: 'highpriestess',
  name: 'High Priestess',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night, learn which player the Storyteller believes you should talk to most.',
  abilityDetailed: `The High Priestess acts on intuition.
• The High Priestess can be shown the same player multiple times in a row, or a different player every night.
• The shown player can be alive or dead.
• The shown player can be good or evil.
• There are no official criteria that determine which player the Storyteller must show to the High Priestess. It is up to the Storyteller’s judgement as to what they think will most benefit the High Priestess and the good team in general. It could be because the player has important information that has not been revealed yet. Or because the player is evil and has a bluff that doesn’t make sense. Or because the player is trustworthy and needs to be trusted more. Or because the player is good but on the wrong track and needs to be corrected. Or something new.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/High_Priestess',
  firstNight: {
    order: 68,
    helpText: 'Point to a player.',
    subActions: [
      {
        id: 'highpriestess-fn-1',
        description: 'Point to a player.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 86,
    helpText: 'Point to a player.',
    subActions: [
      {
        id: 'highpriestess-on-1',
        description: 'Point to a player.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/highpriestessIcon.webp',
    medium: '/icons/characters/highpriestessIcon.webp',
    large: '/icons/characters/highpriestessIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    'There is life behind the personality that uses personalities as masks. There are times when life puts off the mask and deep answers to deep.',
  edition: 'carousel',
};
