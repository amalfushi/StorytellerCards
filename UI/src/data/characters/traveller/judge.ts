import type { CharacterDef } from '@/types/index.ts';

export const judge: CharacterDef = {
  id: 'judge',
  name: 'Judge',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Once per game, if another player nominated, you may choose to force the current execution to pass or fail.',
  abilityDetailed: `The Judge can determine if an execution succeeds or not, regardless of who voted.
• The Judge can decide to pardon a player that they think is innocent, to condemn a player that they think is guilty, or vice versa.
• If the nominee is pardoned, then they are not executed today, and none of the votes for them count. If the nominee is condemned, then they are executed immediately, regardless of how many votes they received, and regardless of whether another player was about to die by execution. Then the day ends, because there can normally only be one execution per day.
• The Judge may use their ability during or after the votes are tallied. However, once a new player has been nominated, then the Judge may only use their ability on this new nominee. The Judge may only use their ability once, and only if a different player made a nomination.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Judge',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/judgeIcon.png',
    medium: '/icons/characters/judgeIcon.png',
    large: '/icons/characters/judgeIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'judge-noability', text: 'NO ABILITY' }],
};
