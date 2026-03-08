import type { CharacterDef } from '@/types/index.ts';

export const alhadikhia: CharacterDef = {
  id: 'alhadikhia',
  name: 'Al-Hadikhia',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, you may choose 3 players (all players learn who): each silently chooses to live or die, but if all live, all die.',
  abilityDetailed: `The Al-Hadikhia puts three players in a dilemma — who will choose to die, so that others can live?
• The Al-Hadikhia may choose three players per night. Everyone learns which three were chosen. Each player makes their choice before the next player is revealed.
• All players must be silent when the Al-Hadikhia acts at night. This period lasts from when the Storyteller first declares that a player has been chosen, until the Storyteller says that it ends.
• If the Al-Hadikhia chooses no one, no announcement is made and nobody dies to the Al-Hadikhia tonight.
• At night, the Storyteller asks players out loud if they choose to live. If they nod their head, they live. If they shake their head, they die. Players may be brought back to life this way.
• If all players choose to live, then they all die instead. If a player chose to die but did not die, they count as alive for this calculation.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Al-Hadikhia',
  firstNight: null,
  otherNights: {
    order: 44,
    helpText:
      'The Al-Hadikhia chooses 3 players. In order, wake each target. They nod or shake their head. Put them to sleep before waking the next target.',
    subActions: [
      {
        id: 'alhadikhia-on-1',
        description: 'The Al-Hadikhia chooses 3 players.',
        isConditional: false,
      },
      {
        id: 'alhadikhia-on-2',
        description: 'In order, wake each target.',
        isConditional: false,
      },
      {
        id: 'alhadikhia-on-3',
        description: 'They nod or shake their head.',
        isConditional: false,
      },
      {
        id: 'alhadikhia-on-4',
        description: 'Put them to sleep before waking the next target.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 3, label: 'Choose 3 players' }],
  },
  icon: {
    small: '/icons/characters/alhadikhiaIcon.webp',
    medium: '/icons/characters/alhadikhiaIcon.webp',
    large: '/icons/characters/alhadikhiaIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'mastermind',
      description:
        'If the Al-Hadikhia dies by execution, and the Mastermind is alive, the Al-Hadikhia chooses 3 good players tonight: if all 3 choose to live, evil wins. Otherwise, good wins.',
    },
    {
      characterId: 'princess',
      description:
        'If the Princess nominated & executed a player on their 1st day, no one dies to the Al-Hadikhia tonight.',
    },
    {
      characterId: 'scarletwoman',
      description:
        'If there would be two Demons, one of which was the Scarlet Woman, the Scarlet Woman becomes the Scarlet Woman again.',
    },
  ],
  flavor: 'Alsukut min dhahab.',
  edition: 'carousel',
};
