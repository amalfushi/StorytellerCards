import type { CharacterDef } from '@/types/index.ts';

export const hindu: CharacterDef = {
  id: 'hindu',
  name: 'Hindu',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort:
    'The first 4 players to die are immediately reincarnated as Travellers of the same alignment.',
  abilityDetailed: `The Hindu gives players that die early a new life.
• The first four players to die become Travellers.
• It doesn’t matter how the players died.
• The Storyteller chooses which Traveller the player becomes. This is different to the normal rule that players choose their Traveller. The players’ alignment stays the same as it was before death.
• If the script has five recommended Travellers, the Storyteller chooses from those.
• Death is never simultaneous. For example, if the Shabaloth kills two players at night, it kills one, then the other.
• If the Demon is one of the first four players to die, the game ends and good wins.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Hindu',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/hinduIcon.png',
    medium: '/icons/characters/hinduIcon.png',
    large: '/icons/characters/hinduIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [],
};
