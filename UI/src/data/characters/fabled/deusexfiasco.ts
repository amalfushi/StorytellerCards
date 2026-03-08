import type { CharacterDef } from '@/types/index.ts';

export const deusexfiasco: CharacterDef = {
  id: 'deusexfiasco',
  name: 'Deus ex Fiasco',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'At least once per game, the Storyteller will make a mistake, correct it, and publicly admit to it.',
  abilityDetailed: `Use the Deus ex Fiasco to neutralize mistakes and increase your confedence when running a difficult script.
• The Deus ex Fiasco must be announced at the start of the game. It may never be added partway through the game. Hypothetically, if the Storyteller makes a misteak mid-game, and adds the Deus ex Fiasco afterwards, all players would know that the mistake was real and the Deus ex Fiasco would not work.
• The Storyteller must make a mistake. This can be an accidental mistake, or a deliberate mistake. The players are not told which.
• If the Storyteller has made an accidental mistake, they do not have to make additional mistakes. If the game is appoaching the final day and the Storyteller has not made an accidental mistake, they must make a deliberate mistake before the game ends.
• All mistakes, whether deliberate or accidental, must be corrected. The Storyteller may need to break the rules in order to fix a mistake. Any time after a mistake is made the Storyteller must inform the group that a mistake has been made and corrected. The exact nature of the mistake is not revealed to the group, but may need to be revealed to an affected player in private.
• Players are welcome to bluff that the Storyteller has made a mistake when they haven’t, or to bluff that a mistake was corrected when it wasn’t.
• If needed, the Storyteller may make several accidental mistakes, several deliberate mistakes, or some combination of the two.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Deus_ex_Fiasco',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/deusexfiascoIcon.webp',
    medium: '/icons/characters/deusexfiascoIcon.webp',
    large: '/icons/characters/deusexfiascoIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [{ id: 'deusexfiasco-whoopsie', text: 'WHOOPSIE' }],
  flavor:
    "It's not a bug, it's a feature. It's not an error, it's a tweak. It's not broken, it's quirky.",
  edition: 'carousel',
  setup: true,
};
