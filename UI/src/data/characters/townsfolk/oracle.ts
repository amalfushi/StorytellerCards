import type { CharacterDef } from '@/types/index.ts';

export const oracle: CharacterDef = {
  id: 'oracle',
  name: 'Oracle',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night*, you learn how many dead players are evil.',
  abilityDetailed: `The Oracle knows how many dead players are evil.
• Because the Oracle acts after the Demon attacks each night, the Oracle’s info refers to the players that are dead when dawn breaks and all players open their eyes.
• The Oracle detects dead Minions and Demons, but also any other players that are evil, such as evil Travellers, or Townsfolk and Outsiders that have been turned evil.
• When counting the number of dead players, remember to count Townsfolk and Outsider tokens that are upside-down, which means their alignment is the opposite of what is printed.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Oracle',
  firstNight: null,
  otherNights: {
    order: 75,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'oracle-on-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/oracleIcon.png',
    medium: '/icons/characters/oracleIcon.png',
    large: '/icons/characters/oracleIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
