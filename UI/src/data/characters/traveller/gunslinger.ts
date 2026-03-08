import type { CharacterDef } from '@/types/index.ts';

export const gunslinger: CharacterDef = {
  id: 'gunslinger',
  name: 'Gunslinger',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each day, after the 1st vote has been tallied, you may choose a player that voted: they die.',
  abilityDetailed: `The Gunslinger kills players who vote.
• Each day, after the first vote for execution has been tallied, the Gunslinger may publicly choose a player that just voted to die immediately. The Gunslinger does not have to kill a player—it is entirely up to them. Whether they use their ability or not, the Gunslinger cannot kill any further players that day.
• It is the Gunslinger’s responsibility to speak up and let the Storyteller know that they wish to use their ability.
• Since exiles are not affected by character abilities in any way, the Gunslinger cannot use their ability to kill a player that supports an exile.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gunslinger',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/gunslingerIcon.webp',
    medium: '/icons/characters/gunslingerIcon.webp',
    large: '/icons/characters/gunslingerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor: "It's time someone took matters into their own hands. That someone... is me.",
  edition: 'tb',
};
