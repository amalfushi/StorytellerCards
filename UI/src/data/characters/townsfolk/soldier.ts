import type { CharacterDef } from '@/types/index.ts';

export const soldier: CharacterDef = {
  id: 'soldier',
  name: 'Soldier',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'You are safe from the Demon.',
  abilityDetailed: `The Soldier can not be killed by the Demon.
• The Soldier cannot die from the Demon's ability. So, if the Imp attacks the Soldier at night, nothing happens. Nobody dies. The Imp does not get to choose another player to attack instead.
• The Soldier can still die by execution, even if the nominator was the Demon. The Soldier is protected from the Demon's ability to kill, not the actions of the Demon player.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Soldier',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/soldierIcon.png',
    medium: '/icons/characters/soldierIcon.png',
    large: '/icons/characters/soldierIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'leviathan',
      description: 'If the Leviathan nominates and executes the Soldier, good wins.',
    },
    { characterId: 'riot', description: 'If Riot nominates and executes the Soldier, good wins.' },
  ],
};
