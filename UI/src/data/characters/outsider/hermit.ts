import type { CharacterDef } from '@/types/index.ts';

export const hermit: CharacterDef = {
  id: 'hermit',
  name: 'Hermit',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'You have all Outsider abilities. [-0 or -1 Outsider]',
  abilityDetailed: `The Hermit isn’t really here.
• The Hermit has the abilities of all the other Outsiders on the Script, all at once. They do not have the abilities of Outsiders that are not on the script.
• If a custom script has more than 4 Outsiders, the Hermit has all these Outsider abilities.
• If one of the Outsider abilities continues after death, such as the Recluse’s, the Hermit keeps that ability when they die, but does not keep their other Outsider abilities.
• A Hermit with the Drunk ability does not know that they are the Hermit, and their other Outsider abilities function as normal. A Hermit with the Recluse ability can register as a different character etc.
• If an Outsider has a jinx, that jinx applies to the Hermit too.
• The Hermit may remove the Hermit from play during setup, resulting in one less Outsider than normal. If this happens, the Hermit may still be a bluff given to the Demon.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Hermit',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/hermitIcon.webp',
    medium: '/icons/characters/hermitIcon.webp',
    large: '/icons/characters/hermitIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  flavor: 'In the lost and forgotten places of the earth, the soul’s light beckons.',
  edition: 'carousel',
  setup: true,
};
