import type { CharacterDef } from '@/types/index.ts';

export const goblin: CharacterDef = {
  id: 'goblin',
  name: 'Goblin',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'If you publicly claim to be the Goblin when nominated & are executed that day, your team wins.',
  abilityDetailed: `The Goblin takes revenge if the town knowingly executes them.
• If the Goblin is executed, evil wins.
• ...but for this to happen the Goblin needs to tell the group that they are the Goblin when they are nominated, but before votes happen, and to do so in a way that everyone hears. The good players need to know the risk.
• If the Goblin is executed without telling the group that they are the Goblin when nominated, the Goblin dies and the game continues as normal.
• The Goblin must have claimed to be the Goblin today for their ability to work. Telling the group yesterday, or even every previous day, doesn't count.
• Any player may claim to be the Goblin when nominated.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Goblin',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/goblinIcon.webp',
    medium: '/icons/characters/goblinIcon.webp',
    large: '/icons/characters/goblinIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'goblin-claimed', text: 'CLAIMED' }],
  jinxes: [
    {
      characterId: 'cerenovus',
      description: 'The Cerenovus may choose to make a player mad that they are the Goblin.',
    },
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Goblin ability, a Minion gains it, and learns this.',
    },
  ],
  flavor:
    'You don’t want to insult the goblins. You really, really don’t. On a completely different note… can I have another piece of cake?',
  edition: 'carousel',
};
