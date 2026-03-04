import type { CharacterDef } from '@/types/index.ts';

export const mastermind: CharacterDef = {
  id: 'mastermind',
  name: 'Mastermind',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'If the Demon dies by execution (ending the game), play for 1 more day. If a player is then executed, their team loses.',
  abilityDetailed: `The Mastermind can still win after the Demon is dead.
• If the Demon dies by execution, the game continues. The players do not learn that the Demon died. The following day, if a good player is executed—whether or not they die from it—then evil wins. If an evil player is executed or nobody is executed, then the good team wins.
• A dead Demon does not get to attack. They lose their ability, as normal. During this extra night and day, other characters’ abilities function as normal.
• If the Demon dies and just two players are left alive, the game still continues for another day—evil does not win from two players being alive, and good did not win by killing the Demon. The Mastermind ability says “play for one more day,” and abilities override standard game rules.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Mastermind',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/mastermindIcon.png',
    medium: '/icons/characters/mastermindIcon.png',
    large: '/icons/characters/mastermindIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alhadikhia',
      description:
        'If the Al-Hadikhia dies by execution, and the Mastermind is alive, the Al-Hadikhia chooses 3 good players tonight: if all 3 choose to live, evil wins. Otherwise, good wins.',
    },
    {
      characterId: 'alchemist',
      description:
        'An Alchemist-Mastermind has no Mastermind ability & the Mastermind is not-in-play.',
    },
    {
      characterId: 'lleech',
      description:
        'If the Mastermind is alive and the Lleech host dies by execution, the Lleech lives but loses their ability.',
    },
    {
      characterId: 'vigormortis',
      description: 'A Mastermind that has their ability keeps it if the Vigormortis dies.',
    },
  ],
};
