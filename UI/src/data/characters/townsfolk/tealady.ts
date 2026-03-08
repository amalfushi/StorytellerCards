import type { CharacterDef } from '@/types/index.ts';

export const tealady: CharacterDef = {
  id: 'tealady',
  name: 'Tea Lady',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: "If both your alive neighbors are good, they can't die.",
  abilityDetailed: `The Tea Lady protects her neighbours from death... as long as they are good.
• If both alive neighbours  of the Tea Lady are currently good, those neighbours cannot die. The Demon cannot kill them, nor the Godfather, nor the Gossip. If they are executed, they do not die. The only exception is the Assassin, who can kill someone protected from death.
• The Tea Lady’s alive neighbours are the two alive players closest to the Tea Lady—one clockwise and one counterclockwise. Skip past any dead neighbours.
• However, if either alive neighbours is evil, or both are, then the Tea Lady does not protect her alive neighbours . If an evil player dies and the Tea Lady is now neighbouring two good players, then neither can die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Tea_Lady',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/tealadyIcon.webp',
    medium: '/icons/characters/tealadyIcon.webp',
    large: '/icons/characters/tealadyIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'tealady-cannotdie', text: 'CANNOT DIE' }],
  flavor:
    'If you are cold, tea will warm you. If you are too heated, tea will cool you. If you are depressed, tea will cheer you. If you are excited, tea will calm you.',
  edition: 'bmr',
};
