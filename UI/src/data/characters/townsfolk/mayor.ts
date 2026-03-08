import type { CharacterDef } from '@/types/index.ts';

export const mayor: CharacterDef = {
  id: 'mayor',
  name: 'Mayor',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.',
  abilityDetailed: `The Mayor can win by peaceful means on the final day.
• To survive, the Mayor sometimes "accidentally" gets someone else killed. If the Mayor is attacked and would die, the Storyteller may choose that a different player dies. Nobody learns how they died at night, just that they died.
• If there are just three players alive at the end of the day, and no execution occurred that day, then the game ends and good wins.
• Travellers count as players for the Mayor's victory, so must be exiled first. Remember that exiles are not executions.
• Fabled don't count as players for the Mayor's victory, as the Storyteller isn't a player.
• If the Demon attacks the Mayor, and the Storyteller instead chooses a dead player, the Soldier, or a player protected by the Monk, that player does not die tonight.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Mayor',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/mayorIcon.webp',
    medium: '/icons/characters/mayorIcon.webp',
    large: '/icons/characters/mayorIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'If the Leviathan and the Mayor are alive on day 5 & no execution occurs, good wins.',
    },
    {
      characterId: 'riot',
      description:
        'The Mayor may choose to stop the riot. If they do so when only 1 Riot is alive, good wins. Otherwise, evil wins.',
    },
  ],
  flavor:
    'We must put our differences aside, and cease this senseless killing. We are all taxpayers after all. Well, most of us.',
  edition: 'tb',
};
