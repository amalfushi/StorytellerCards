import type { CharacterDef } from '@/types/index.ts';

export const hatter: CharacterDef = {
  id: 'hatter',
  name: 'Hatter',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'If you died today or tonight, the Minion & Demon players may choose new Minion & Demon characters to be.',
  abilityDetailed: `The Hatter allows the evil players to change characters.
• Each player with a Minion or Demon character may choose to become any character of the same type as their current character.
• They may choose not to change characters.
• If a player becomes a new character, they gain the new ability, even if it was a "you start knowing" ability or a once per game ability that had already been used.
• Once a player has changed character, their previous character ability has no further effect on the game.
• If a player dies then becomes the Hatter, the evil players do not change characters tonight.
• Once a character has been chosen, a second player cannot choose the same character. If it is already in play, the player with that character must choose a new character.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Hatter',
  firstNight: null,
  otherNights: {
    order: 52,
    helpText:
      'If the Hatter died, wake the Minions & Demons. Each may choose a new character. If they do, show the YOU ARE token & their new character token.',
    subActions: [
      {
        id: 'hatter-on-1',
        description: 'If the Hatter died, wake the Minions & Demons.',
        isConditional: true,
      },
      {
        id: 'hatter-on-2',
        description: 'Each may choose a new character.',
        isConditional: false,
      },
      {
        id: 'hatter-on-3',
        description: 'If they do, show the YOU ARE token & their new character token.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/hatterIcon.webp',
    medium: '/icons/characters/hatterIcon.webp',
    large: '/icons/characters/hatterIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'hatter-teapartytonight', text: 'TEA PARTY TONIGHT' }],
  jinxes: [
    {
      characterId: 'legion',
      description:
        'If Legion is created, all evil players become Legion. If Legion is in play, the Hatter has no ability.',
    },
    { characterId: 'leviathan', description: 'The Leviathan cannot enter play after day 5.' },
    {
      characterId: 'lilmonsta',
      description:
        "If the Hatter dies & the Demon chooses Lil' Monsta, they also choose a Minion to become.",
    },
    {
      characterId: 'summoner',
      description: 'If the Summoner creates a second living Demon, deaths tonight are arbitrary.',
    },
  ],
  flavor: 'One Hat. Too Hat. Three Hat. Tea Hat. Fore Hat. Thrive Hat. Six Hat. Sticks Hat.',
  edition: 'carousel',
};
