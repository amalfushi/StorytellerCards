import type { CharacterDef } from '@/types/index.ts';

export const baron: CharacterDef = {
  id: 'baron',
  name: 'Baron',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort: 'There are extra Outsiders in play. [+2 Outsiders]',
  abilityDetailed: `The Baron changes the number of Outsiders present in the game.
• This change happens during setup, and it does not revert if the Baron dies. A change in characters during setup, regardless of what happens during the game, is shown on character sheets and tokens in square brackets at the end of a character's description—like [this].
• The added Outsiders always replace Townsfolk, not other character types.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Baron',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/baronIcon.webp',
    medium: '/icons/characters/baronIcon.webp',
    large: '/icons/characters/baronIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  setupModification: {
    description: 'There are extra Outsiders in play. [+2 Outsiders]',
  },
  jinxes: [
    {
      characterId: 'heretic',
      description: 'Only 1 jinxed character can be in play.',
    },
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Baron ability, up to two players become Outsiders.',
    },
  ],
  flavor:
    "This town has gone to the dogs, what? Cheap foreign labor... that's the ticket. Stuff them in the mine, I say. A bit of hard work never hurt anyone, and a clip'o'the ears to any brigand who says otherwise. It's all about the bottom line, what?",
  edition: 'tb',
  setup: true,
};
