import type { CharacterDef } from '@/types/index.ts';

export const politician: CharacterDef = {
  id: 'politician',
  name: 'Politician',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'If you were the player most responsible for your team losing, you change alignment & win, even if dead.',
  abilityDetailed: `The Politician changes teams if they are losing.
• When the game ends, if the Politician was responsible for good losing, then the Politician turns evil and wins too.
• The player needs to be very influential when determining who wins. Simply spreading false information or voting for good players is usually not enough – they need to be the player that was more responsible for the good team losing than any other good player, and preferably more responsible than any one evil player too. The Storyteller is the judge of whether the Politician’s actions qualify.
• The Politician may still win with the good team, as normal.
• A drunk or poisoned Politician can not change teams.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Politician',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/politicianIcon.png',
    medium: '/icons/characters/politicianIcon.png',
    large: '/icons/characters/politicianIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
  jinxes: [
    { characterId: 'boffin', description: 'The Demon cannot have the Politician ability.' },
    { characterId: 'legion', description: 'The Politician might register as evil to Legion.' },
    {
      characterId: 'pithag',
      description:
        "If the Pit-Hag turns an evil player into the Politician, they can't turn good due to their own ability.",
    },
    { characterId: 'vizier', description: 'The Politician might register as evil to the Vizier.' },
  ],
};
