import type { CharacterDef } from '@/types/index.ts';

export const snitch: CharacterDef = {
  id: 'snitch',
  name: 'Snitch',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'Each Minion gets 3 bluffs.',
  abilityDetailed: `The Snitch accidentally gives information to the evil team.
• The Minions learn three not-in-play characters at the start of the game, just like the Demon does.
• These characters may be the same three that the Demon learns, or different characters.
• Each Minion may learn different characters to each other. Or they may all learn the same three characters.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Snitch',
  firstNight: {
    order: 15,
    helpText:
      'Wake each Minion. Show the THESE CHARACTERS ARE NOT IN PLAY token. Show 3 not-in-play character tokens.',
    subActions: [
      {
        id: 'snitch-fn-1',
        description: 'Wake each Minion.',
        isConditional: false,
      },
      {
        id: 'snitch-fn-2',
        description: 'Show the THESE CHARACTERS ARE NOT IN PLAY token.',
        isConditional: false,
      },
      {
        id: 'snitch-fn-3',
        description: 'Show 3 not-in-play character tokens.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/snitchIcon.png',
    medium: '/icons/characters/snitchIcon.png',
    large: '/icons/characters/snitchIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
};
