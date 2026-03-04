import type { CharacterDef } from '@/types/index.ts';

export const beggar: CharacterDef = {
  id: 'beggar',
  name: 'Beggar',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'You must use a vote token to vote. If a dead player gives you theirs, you learn their alignment. You are sober and healthy.',
  abilityDetailed: `The Beggar can not vote unless someone gives them a token to use, but they learn if the player that does so is good or evil.
• The Beggar cannot raise their hand to vote at all unless they have a vote token.
• When they do vote, they lose one vote token. If they have more than one, they may only use one at a time.
• Only a dead player may give their vote token to the Beggar, after which that dead player cannot vote. Each dead player decides for themself whether to give the Beggar their vote token. No one, including the Beggar, may move a player’s vote token on their behalf.
• When a player gives their vote token to the Beggar, the Beggar learns whether that player is good or evil.
• The Beggar can still nominate freely, and can still vote for an exile freely, because exiles are not affected by abilities.
• If the Beggar dies, they gain one vote token to use while dead, just like any other character would. However, the Beggar loses all their previously acquired vote tokens.
• If the Beggar would become drunk or poisoned, they do not.
• The ability to donate vote tokens is unique to the Beggar ability. Players may not give their vote token to a player that is not the Beggar, whether or not a Beggar is in play.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Beggar',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/beggarIcon.png',
    medium: '/icons/characters/beggarIcon.png',
    large: '/icons/characters/beggarIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
