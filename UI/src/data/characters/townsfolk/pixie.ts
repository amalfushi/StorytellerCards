import type { CharacterDef } from '@/types/index.ts';

export const pixie: CharacterDef = {
  id: 'pixie',
  name: 'Pixie',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing 1 in-play Townsfolk. If you were mad that you were this character, you gain their ability when they die.',
  abilityDetailed: `The Pixie pretends to be the same character as someone else.
• On the first night, the Pixie learns an in-play Townsfolk. The Storyteller chooses which Townsfolk this is. The Pixie does not learn which player is this character.
• If the Pixie player pretends that they are this Townsfolk, they gain the ability of this Townsfolk when the Townsfolk dies. They could have spoken loudly about being the character for one day, or pretended to be the character each day this game, or accused the Townsfolk of being a liar—the Storyteller is the judge of whether or not the player was convincing, by “being mad that they are this character”.
• When the Townsfolk player dies, the Pixie does not learn this, and is not told that they have gained a new ability. They may learn this has happened if they wake at night and start gaining information, or are prompted to choose players.
• If the player the Pixie learns about changes character then dies, the Pixie gains the ability of the Townsfolk the Pixie learnt about, not the new character.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Pixie',
  firstNight: {
    order: 42,
    helpText: 'Show the Townsfolk character token marked MAD.',
    subActions: [
      {
        id: 'pixie-fn-1',
        description: 'Show the Townsfolk character token marked MAD.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/pixieIcon.webp',
    medium: '/icons/characters/pixieIcon.webp',
    large: '/icons/characters/pixieIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    'Round and round the garden, go. Little girls run to and fro. Little boys climb up the tree. Which of these should Pixie be? Ladies smile and go to town.  Lords with axe chop forest down. What’s yours is mine. What’s mine, divine. Silly little Pixie, me.',
  edition: 'carousel',
};
