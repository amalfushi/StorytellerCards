import type { CharacterDef } from '@/types/index.ts';

export const balloonist: CharacterDef = {
  id: 'balloonist',
  name: 'Balloonist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, you learn a player of a different character type than last night. [+0 or +1 Outsider]',
  abilityDetailed: `The Balloonist learns players of different character types.
• Each time the Balloonist learns a player, the player must have a different character type to the previously shown player.
• The Balloonist does not learn the character type of the player they learn.
• The shown player can be alive or dead.
• The shown player can be good or evil.
• If the Balloonist is drunk or poisoned, they may learn a character of the same type as the previously shown player. When the Balloonist becomes sober and healthy, they must learn a player of a different character type to the previously shown player.
• During setup, the Storyteller may choose to add an Outsider due to the Balloonist’s ability.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Balloonist',
  firstNight: {
    order: 60,
    helpText: 'Point to any player.',
    subActions: [
      {
        id: 'balloonist-fn-1',
        description: 'Point to any player.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 78,
    helpText: 'Point to a player with a different character type to the previously shown player.',
    subActions: [
      {
        id: 'balloonist-on-1',
        description:
          'Point to a player with a different character type to the previously shown player.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/balloonistIcon.png',
    medium: '/icons/characters/balloonistIcon.png',
    large: '/icons/characters/balloonistIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
