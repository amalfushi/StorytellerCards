import type { CharacterDef } from '@/types/index.ts';

export const vortox: CharacterDef = {
  id: 'vortox',
  name: 'Vortox',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a player: they die. Townsfolk abilities yield false info. Each day, if no-one is executed, evil wins.',
  abilityDetailed: `The Vortox makes all information false.
• Anytime a Townsfolk player gets information from their ability, they get false information. Even if they are drunk or poisoned, it must be false.
• The Vortox does not affect information gained by other means, such as when the Storyteller explains the rules, or when a player’s character or alignment changes.
• When night falls, if nobody was executed today, evil wins. Exiling a Traveller does not count.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Vortox',
  firstNight: null,
  otherNights: {
    order: 40,
    helpText: 'The Vortox chooses a player.',
    subActions: [
      {
        id: 'vortox-on-1',
        description: 'The Vortox chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/vortoxIcon.webp',
    medium: '/icons/characters/vortoxIcon.webp',
    large: '/icons/characters/vortoxIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'banshee',
      description: 'If the Vortox kills the Banshee, all players learn that the Banshee has died.',
    },
  ],
  flavor:
    'Black is White. Right is Wrong. Left is Right. Up is Long. Down is Sight. Short is Blind. Follow me. Answers find.',
  edition: 'snv',
};
