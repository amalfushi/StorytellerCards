import type { CharacterDef } from '@/types/index.ts';

export const chambermaid: CharacterDef = {
  id: 'chambermaid',
  name: 'Chambermaid',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, choose 2 alive players (not yourself): you learn how many woke tonight due to their ability.',
  abilityDetailed: `The Chambermaid learns who woke up at night.
• Each night, the Chambermaid chooses two players and learns if they woke tonight. They must choose alive players, and may not choose themself. This does not detect which of those players woke, only how many.
• This ability only detects characters who woke in order to use their ability. It does not detect characters who woke for any other reason—such as if the Storyteller woke a Minion to let them know who the Demon is, woke the Demon to give them their starting Demon info, woke a player due to the ability of a different character, or woke someone accidentally.
• If the character woke on a previous night but not this night, they are not detected by the Chambermaid.
• Players that woke tonight due to their ability but are drunk or poisoned still count as having woke tonight.
• If the Chambermaid chooses a dead player accidentally, the Storyteller prompts them to choose again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Chambermaid',
  firstNight: {
    order: 70,
    helpText: 'The Chambermaid chooses 2 living players. Give a finger signal.',
    subActions: [
      {
        id: 'chambermaid-fn-1',
        description: 'The Chambermaid chooses 2 living players.',
        isConditional: false,
      },
      {
        id: 'chambermaid-fn-2',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 2, label: 'Choose 2 living players' }],
  },
  otherNights: {
    order: 88,
    helpText: 'The Chambermaid chooses 2 living players. Give a finger signal.',
    subActions: [
      {
        id: 'chambermaid-on-1',
        description: 'The Chambermaid chooses 2 living players.',
        isConditional: false,
      },
      {
        id: 'chambermaid-on-2',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 2, label: 'Choose 2 living players' }],
  },
  icon: {
    small: '/icons/characters/chambermaidIcon.webp',
    medium: '/icons/characters/chambermaidIcon.webp',
    large: '/icons/characters/chambermaidIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'mathematician',
      description: 'The Chambermaid can detect if the Mathematician will wake tonight.',
    },
  ],
  flavor:
    "I aint seen nothin' untoward, Milady. Begging your pardon, but if I did see somethin', it certainly weren't the master o' the house sneaking into the professor's laboratory 'round eleven o'clock and mixing up fancy potions, just like you said, Miss.",
  edition: 'bmr',
};
