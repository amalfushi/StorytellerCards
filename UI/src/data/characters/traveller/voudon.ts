import type { CharacterDef } from '@/types/index.ts';

export const voudon: CharacterDef = {
  id: 'voudon',
  name: 'Voudon',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    "Only you & the dead can vote. They don't need a vote token to do so. A 50% majority isn't required.",
  abilityDetailed: `The Voudon gives the voting power to the dead instead of the living.
• The dead and the Voudon may vote as many times per day as they wish. They do not need a vote token to vote, and do not lose their vote token when they do so. Alive players cannot vote. It is not the case that they may put their hand up but the votes don’t count—their hands must stay down during voting.
• The number of votes required to execute a player is no longer half or more of the alive players. The player with the most votes is executed each day, but even a single vote is enough to execute a player if no other player gets more votes.
• The Voudon does not alter who can make nominations. As normal, alive players may make nominations, and dead players may not. Since Travellers are exiled, not executed, all players, alive or dead, may support exiling the Voudon or other Travellers.
• If a player is about to die and then the Voudon is exiled, that player is still about to die and nominations continue, but alive players vote as normal. If a later nomination gets more votes and it tallies to half or more of the alive players, this new player is about to die instead.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Voudon',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/voudonIcon.png',
    medium: '/icons/characters/voudonIcon.png',
    large: '/icons/characters/voudonIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
