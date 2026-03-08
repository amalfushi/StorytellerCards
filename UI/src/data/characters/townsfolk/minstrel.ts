import type { CharacterDef } from '@/types/index.ts';

export const minstrel: CharacterDef = {
  id: 'minstrel',
  name: 'Minstrel',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'When a Minion dies by execution, all other players (except Travellers) are drunk until dusk tomorrow.',
  abilityDetailed: `The Minstrel makes everybody drunk if a Minion dies.
• If a Minion is executed and dies, all players (except the Minstrel) become drunk immediately and stay drunk all through the night and all the following day. Townsfolk, Outsiders, Minions, and even Demons become drunk, but not Travellers. This doesn’t happen if a Minion died at night.
• If a dead Minion is executed, the Minstrel ability does not trigger—a dead character cannot die again! If a Minion is executed but does not die, the Minstrel’s ability does not trigger. If the Minstrel is drunk or poisoned when a Minion dies by execution, the Minstrel ability does not trigger.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Minstrel',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/minstrelIcon.webp',
    medium: '/icons/characters/minstrelIcon.webp',
    large: '/icons/characters/minstrelIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'minstrel-everyoneisdrunk', text: 'EVERYONE IS DRUNK' }],
  jinxes: [
    {
      characterId: 'legion',
      description:
        'If Legion died by execution today, Legion keeps their ability, but the Minstrel might learn they are Legion.',
    },
  ],
  flavor:
    "And I shall hear, tho' soft you tread above me... And all my dreams will warm and sweeter be... If you'll not fail to tell me that you love me... I simply sleep in peace until you come to me.",
  edition: 'bmr',
};
