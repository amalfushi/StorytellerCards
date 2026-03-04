import type { CharacterDef } from '@/types/index.ts';

export const grandmother: CharacterDef = {
  id: 'grandmother',
  name: 'Grandmother',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing a good player & their character. If the Demon kills them, you die too.',
  abilityDetailed: `The Grandmother knows who their grandchild is, but if they are killed by the Demon, the Grandmother dies too.
• During the first night, the Grandmother learns their Grandchild—a good player who is a Townsfolk or Outsider. The Grandchild does not learn that they have a Grandmother.
• If the Demon kills the Grandchild, the Grandmother dies too. If the Grandchild dies by any other means—such as execution, or another type of death at night—the Grandmother does not also die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Grandmother',
  firstNight: {
    order: 53,
    helpText: 'Point to the grandchild player & show their character token.',
    subActions: [
      {
        id: 'grandmother-fn-1',
        description: 'Point to the grandchild player & show their character token.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 66,
    helpText: 'If the grandchild was killed by the Demon, the Grandmother dies too.',
    subActions: [
      {
        id: 'grandmother-on-1',
        description: 'If the grandchild was killed by the Demon, the Grandmother dies too.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/grandmotherIcon.png',
    medium: '/icons/characters/grandmotherIcon.png',
    large: '/icons/characters/grandmotherIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'grandmother-grandchild', text: 'GRANDCHILD' }],
  jinxes: [
    {
      characterId: 'leviathan',
      description: 'If the Leviathan is in play and the Grandchild dies by execution, evil wins.',
    },
    {
      characterId: 'riot',
      description: 'If Riot is in play and the Grandchild dies by execution, evil wins.',
    },
  ],
};
