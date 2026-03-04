import type { CharacterDef } from '@/types/index.ts';

export const harlot: CharacterDef = {
  id: 'harlot',
  name: 'Harlot',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Each night*, choose a living player: if they agree, you learn their character, but you both might die.',
  abilityDetailed: `The Harlot learns the character of whoever agrees to reveal it, but at great risk for them both.
• Each night, the Harlot chooses a player. That player has a decision to make: do they reveal their character to the Harlot? If they do, the Storyteller may decide that both this player and the Harlot die tonight.
• The Harlot only learns the character of the chosen player, not that player’s alignment.
• The Harlot may discuss during the day which character they would like to pick at night, and other players may offer to be picked, but they may go back on their word and choose differently when night comes.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Harlot',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/harlotIcon.png',
    medium: '/icons/characters/harlotIcon.png',
    large: '/icons/characters/harlotIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
