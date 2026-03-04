import type { CharacterDef } from '@/types/index.ts';

export const banshee: CharacterDef = {
  id: 'banshee',
  name: 'Banshee',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'If the Demon kills you, all players learn this. From now on, you may nominate twice per day and vote twice per nomination.',
  abilityDetailed: `The Banshee becomes more powerful when dead, nominating and voting twice as much.
• When alive, the Banshee nominates and votes as normal.
• When dead, they may nominate twice per day, even though dead players may normally not nominate at all.
• When dead, they may vote for any nomination they wish and do not need a vote token to do so. They may vote twice for the same nomination.
• The Banshee only gains these powers if they were killed by the Demon. Dying by execution or to a non-Demon ability does not count.
• To vote twice, the Banshee player raises both hands when votes are counted. If the player is unable to do this due to a disability, the Storyteller can count their normal vote twice.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Banshee',
  firstNight: null,
  otherNights: {
    order: 57,
    helpText: 'If the Banshee was killed by the Demon tonight, announce that the Banshee has died.',
    subActions: [
      {
        id: 'banshee-on-1',
        description:
          'If the Banshee was killed by the Demon tonight, announce that the Banshee has died.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/bansheeIcon.png',
    medium: '/icons/characters/bansheeIcon.png',
    large: '/icons/characters/bansheeIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'banshee-hasability', text: 'HAS ABILITY' }],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'Each night*, the Leviathan chooses an alive good player (different to previous nights): a chosen Banshee dies & gains their ability.',
    },
    {
      characterId: 'riot',
      description:
        'Each night*, Riot chooses an alive good player (different to previous nights): a chosen Banshee dies & gains their ability.',
    },
    {
      characterId: 'vortox',
      description: 'If the Vortox kills the Banshee, all players learn that the Banshee has died.',
    },
  ],
};
