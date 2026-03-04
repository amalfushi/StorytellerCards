import type { CharacterDef } from '@/types/index.ts';

export const princess: CharacterDef = {
  id: 'princess',
  name: 'Princess',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'On your 1st day, if you nominated & executed a player, the Demon doesn’t kill tonight.',
  abilityDetailed: `The Princess decides which player dies first.
• For the Princess ability to work, the player that the Princess nominated must be the one executed. Players executed but nominated by others don’t count.
• The executed player does not have to die for the Princess ability to work.
• Exiles don’t count for the Princess ability.
• If the Princess is drunk during the day, then sober at night, they prevent the Demon from killing. If the Princess is sober during the day, but drunk at night, they do not.
• At night, non-Demon kills happen as normal.
• At night, the Demon still chooses a player to kill, but they do not die. Other parts of the Demon’s ability, such as poisoning players, making false information, etc. happen as normal.
• The Princess does not have to nominate on their 1st day.
• If a Princess is created mid-game, and they nominate and execute a player on their 1st day as a Princess, the Demon doesn’t kill that night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Princess',
  firstNight: null,
  otherNights: {
    order: 31,
    helpText:
      "If the Princess nominated the player who was executed today, wake the Demon as normal, but no one dies to the Demon's ability.",
    subActions: [
      {
        id: 'princess-on-1',
        description:
          "If the Princess nominated the player who was executed today, wake the Demon as normal, but no one dies to the Demon's ability.",
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/princessIcon.png',
    medium: '/icons/characters/princessIcon.png',
    large: '/icons/characters/princessIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alhadikhia',
      description:
        'If the Princess nominated & executed a player on their 1st day, no one dies to the Al-Hadikhia tonight.',
    },
    {
      characterId: 'cannibal',
      description:
        'If the Cannibal nominated, executed, & killed the Princess today, the Demon doesn’t kill tonight.',
    },
  ],
};
