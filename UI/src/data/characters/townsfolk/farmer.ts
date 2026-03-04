import type { CharacterDef } from '@/types/index.ts';

export const farmer: CharacterDef = {
  id: 'farmer',
  name: 'Farmer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'When you die at night, an alive good player becomes a Farmer.',
  abilityDetailed: `The Farmer creates more farmers.
• If a Farmer dies at night, another player becomes a Farmer too.
• Only players that are good can become Farmers this way.
• If this new Farmer also dies at night, another Farmer is created.
• Farmers that die during the day, such as by execution, do not create more Farmers.
• Farmers that have turned evil, such as from the Mezepheles’ ability, can create more Farmers. But Townsfolk and Outsiders that have turned evil cannot become a Farmer.
• Farmers do not learn who each other are, but each player that becomes a Farmer learns that they are now a Farmer.
• When a player becomes a Farmer, they are no longer their old character, and do not have that ability. Any ongoing effects of their old ability immediately end.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Farmer',
  firstNight: null,
  otherNights: {
    order: 63,
    helpText:
      'If the Farmer died tonight, wake a living good player. Show the YOU ARE info token and a Farmer token.',
    subActions: [
      {
        id: 'farmer-on-1',
        description: 'If the Farmer died tonight, wake a living good player.',
        isConditional: true,
      },
      {
        id: 'farmer-on-2',
        description: 'Show the YOU ARE info token and a Farmer token.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/farmerIcon.png',
    medium: '/icons/characters/farmerIcon.png',
    large: '/icons/characters/farmerIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
