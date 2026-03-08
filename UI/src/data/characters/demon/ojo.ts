import type { CharacterDef } from '@/types/index.ts';

export const ojo: CharacterDef = {
  id: 'ojo',
  name: 'Ojo',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose a character: they die. If they are not in play, the Storyteller chooses who dies.',
  abilityDetailed: `The Ojo chooses specifically which character dies.
• Unlike other Demons, the Ojo must choose a character, not a player. The Storyteller may need to remind the player of this. We recommend that all players have their character sheet handy during the night phase.
• The Ojo can kill evil characters, if they wish.
• If there are multiple copies of a particular character in play, and the Ojo chooses that character to die, only one of those characters dies.
• If the Ojo chooses a character that is not in play, the Storyteller will almost always kill a living good player. It is possible, but uncommon, for the Storyteller to choose a dead player or an evil player to die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Ojo',
  firstNight: null,
  otherNights: {
    order: 43,
    helpText: 'The Ojo chooses a character.',
    subActions: [
      {
        id: 'ojo-on-1',
        description: 'The Ojo chooses a character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  icon: {
    small: '/icons/characters/ojoIcon.webp',
    medium: '/icons/characters/ojoIcon.webp',
    large: '/icons/characters/ojoIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'ojo-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
  flavor: 'Like a bonfire on a moonless night… I see you, mortal.',
  edition: 'carousel',
};
