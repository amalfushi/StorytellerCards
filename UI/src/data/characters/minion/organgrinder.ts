import type { CharacterDef } from '@/types/index.ts';

export const organgrinder: CharacterDef = {
  id: 'organgrinder',
  name: 'Organ Grinder',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'All players keep their eyes closed when voting and the vote tally is secret. Each night, choose if you are drunk until dusk.',
  abilityDetailed: `The Organ Grinder makes voting secret.
• When a player is nominated, players vote with eyes closed.
• The Storyteller does not count the votes out loud, and does not reveal how many players voted once voting is complete.
• The Storyteller doesn’t reveal which player is “about to die”.
• After nominations have closed, the Storyteller reveals which player is executed, as normal.
• Dead players may vote once if they have a vote token. Their vote token is removed at the end of the day instead of after the vote.
• If the Organ Grinder is drunk, the vote happens with eyes open, as normal. The Storyteller makes no comment as to whether the Organ Grinder is dead or alive. That night, the Organ Grinder chooses to become sober or drunk again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Organ_Grinder',
  firstNight: {
    order: 33,
    helpText:
      'The Organ Grinder either nods their head yes to be drunk, or shakes their head no to be sober.',
    subActions: [
      {
        id: 'organgrinder-fn-1',
        description:
          'The Organ Grinder either nods their head yes to be drunk, or shakes their head no to be sober.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 18,
    helpText:
      'The Organ Grinder either nods their head yes to be drunk, or shakes their head no to be sober.',
    subActions: [
      {
        id: 'organgrinder-on-1',
        description:
          'The Organ Grinder either nods their head yes to be drunk, or shakes their head no to be sober.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/organgrinderIcon.webp',
    medium: '/icons/characters/organgrinderIcon.webp',
    large: '/icons/characters/organgrinderIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [
    { id: 'organgrinder-drunk', text: 'DRUNK' },
    { id: 'organgrinder-abouttodie', text: 'ABOUT TO DIE' },
  ],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'If the Alchemist has the Organ Grinder ability, the Organ Grinder is in play. If both are sober, both are drunk.',
    },
    {
      characterId: 'butler',
      description:
        'If the Organ Grinder is causing eyes closed voting, the Butler may raise their hand to vote but their vote is only counted if their master voted too.',
    },
  ],
  flavor: 'Round and round the handles go. The more you dance the less you know.',
  edition: 'carousel',
};
