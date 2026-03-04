import type { CharacterDef } from '@/types/index.ts';

export const boffin: CharacterDef = {
  id: 'boffin',
  name: 'Boffin',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    "The Demon (even if drunk or poisoned) has a not-in-play good character's ability. You both know which.",
  abilityDetailed: `The Boffin replicates a good ability.
• While the Boffin is alive, the Demon has a single Townsfolk ability or Outsider ability.
• If the Demon is drunk or poisoned, the Demon keeps this good ability. If the Boffin is drunk or poisoned, the Demon temporarily loses this good ability.
• If the Demon dies and has an ability that functions while dead, such as the Sweetheart, the Demon keeps this ability.
• If a new Demon is created, such as via a Scarlet Woman or a Barber, this new Demon has an ability from the Boffin. This ability may be different to the previous Demon's ability.
• If there are multiple Demons alive, only one alive Demon has an ability from the Boffin.
• If the Demon has an ability that modifies the setup, such as a Choirboy, these changes are made during setup, as normal.
• Both the Demon and the Boffin learn which good ability the Demon has. The Storyteller may wake these players independently, or together.
• The not-in-play character may be 1 of the Demon's 3 bluffs.
• The Demon also wakes at night at the time that the good character would normally wake.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Boffin',
  firstNight: {
    order: 8,
    helpText:
      'Wake the Boffin and the Demon. Show the THIS CHARACTER SELECTED YOU & Boffin tokens, then the not-in-play good character token.',
    subActions: [
      {
        id: 'boffin-fn-1',
        description: 'Wake the Boffin and the Demon.',
        isConditional: false,
      },
      {
        id: 'boffin-fn-2',
        description:
          'Show the THIS CHARACTER SELECTED YOU & Boffin tokens, then the not-in-play good character token.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/boffinIcon.png',
    medium: '/icons/characters/boffinIcon.png',
    large: '/icons/characters/boffinIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'If the Alchemist has the Boffin ability, the Alchemist does not learn what ability the Demon has.',
    },
    {
      characterId: 'cultleader',
      description:
        'If the Demon has the Cult Leader ability, they can’t turn good due to this ability.',
    },
    { characterId: 'drunk', description: 'The Demon cannot have the Drunk ability.' },
    {
      characterId: 'goon',
      description: 'If the Demon has the Goon ability, they can’t turn good due to this ability.',
    },
    { characterId: 'heretic', description: 'The Demon cannot have the Heretic ability.' },
    { characterId: 'ogre', description: 'The Demon cannot have the Ogre ability.' },
    { characterId: 'politician', description: 'The Demon cannot have the Politician ability.' },
    {
      characterId: 'villageidiot',
      description:
        'If there is a spare token, the Boffin can give the Demon the Village Idiot ability.',
    },
  ],
};
