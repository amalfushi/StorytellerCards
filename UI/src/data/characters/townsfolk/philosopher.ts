import type { CharacterDef } from '@/types/index.ts';

export const philosopher: CharacterDef = {
  id: 'philosopher',
  name: 'Philosopher',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose a good character: gain that ability. If this character is in play, they are drunk.',
  abilityDetailed: `The Philosopher has no ability until they decide which character they want to emulate.
• They can do this once per game. When they do so, they gain that character’s ability. They do not become that character.
• They may want to wait a while to choose. If the Philosopher chooses a character that is already in play, the player of that character becomes drunk. If the Philosopher then dies or becomes drunk or poisoned, the player they are making drunk becomes sober again.
• If the Philosopher chose a character that was not in play at the time but is in play now, that character is drunk.
• If the Philosopher gains an ability that works at night, they wake when that character would wake. If this ability is used on the first night only, they use it tonight.
• If the Philosopher regains their ability via the Bone Collector, or uses their ability twice via the Barista, the Philosopher may choose a new ability, or the same ability as before.
• If the Philosopher’s ability works while dead, such as the Klutz’s, it works if the Philosopher is dead.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Philosopher',
  firstNight: {
    order: 9,
    helpText: 'The Philosopher might choose a character. If necessary, swap their character token.',
    subActions: [
      {
        id: 'philosopher-fn-1',
        description: 'The Philosopher might choose a character.',
        isConditional: false,
      },
      {
        id: 'philosopher-fn-2',
        description: 'If necessary, swap their character token.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  otherNights: {
    order: 4,
    helpText: 'The Philosopher might choose a character. If necessary, swap their character token.',
    subActions: [
      {
        id: 'philosopher-on-1',
        description: 'The Philosopher might choose a character.',
        isConditional: false,
      },
      {
        id: 'philosopher-on-2',
        description: 'If necessary, swap their character token.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  icon: {
    small: '/icons/characters/philosopherIcon.webp',
    medium: '/icons/characters/philosopherIcon.webp',
    large: '/icons/characters/philosopherIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'bountyhunter',
      description:
        'If the Philosopher gains the Bounty Hunter ability, a Townsfolk might turn evil.',
    },
  ],
  flavor: 'If anything is real, beer is real. Drink, for tomorrow we may die.',
  edition: 'snv',
  remindersGlobal: [
    { id: 'philosopher-global-isthephilosopher', text: 'Is The Philosopher', isGlobal: true },
  ],
};
