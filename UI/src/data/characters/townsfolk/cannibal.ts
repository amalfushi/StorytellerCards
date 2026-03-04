import type { CharacterDef } from '@/types/index.ts';

export const cannibal: CharacterDef = {
  id: 'cannibal',
  name: 'Cannibal',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You have the ability of the recently killed executee. If they are evil, you are poisoned until a good player dies by execution.',
  abilityDetailed: `The Cannibal eats executed characters, gaining their ability.
• If a good player dies by execution, the Cannibal gains that player’s ability. If an evil player dies by execution, the Cannibal only thinks that they gain an ability, since the Cannibal is poisoned. The Storyteller may be lying to them.
• Each time a player dies by execution, the Cannibal loses the ability of the previous player.
• Executing a dead player won’t grant the Cannibal an ability. Executing a living player who doesn’t die won’t grant the Cannibal an ability. A player must be executed and die for the Cannibal to gain their ability.
• The Cannibal is not told which ability they have gained. They must figure that out for themselves.
• If the Cannibal has an “even if dead” ability, such as the Recluse, or an ability that implies it works while dead, such as the Ravenkeeper or Sweetheart, the Cannibal keeps that ability when they die, but loses their Cannibal ability.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Cannibal',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/cannibalIcon.png',
    medium: '/icons/characters/cannibalIcon.png',
    large: '/icons/characters/cannibalIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
