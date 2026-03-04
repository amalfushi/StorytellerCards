import type { CharacterDef } from '@/types/index.ts';

export const gossip: CharacterDef = {
  id: 'gossip',
  name: 'Gossip',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each day, you may make a public statement. Tonight, if it was true, a player dies.',
  abilityDetailed: `The Gossip deliberately speaks lies, in the hope of uncovering the truth.
• Each day, the Gossip may make a public statement. If this statement is true, the Storyteller kills a player that night. If it is false, then no players die due to the Gossip.
• Mumbled words, whispers, statements the Storyteller doesn’t know are true or false, or statements that someone cannot hear don’t count. Like the Slayer’s ability, the Storyteller and every player must be able to hear and understand the Gossip and be aware that the Gossip is using their ability in order for the Storyteller to judge what happens next.
• If the Gossip made a true statement during the day while drunk or poisoned, but is sober and healthy when their ability triggers that night, the Storyteller still kills a player.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gossip',
  firstNight: null,
  otherNights: {
    order: 51,
    helpText: 'If the Gossip is due to kill a player, they die.',
    subActions: [
      {
        id: 'gossip-on-1',
        description: 'If the Gossip is due to kill a player, they die.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/gossipIcon.png',
    medium: '/icons/characters/gossipIcon.png',
    large: '/icons/characters/gossipIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
