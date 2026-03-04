import type { CharacterDef } from '@/types/index.ts';

export const gardener: CharacterDef = {
  id: 'gardener',
  name: 'Gardener',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort: "The Storyteller assigns 1 or more players' characters.",
  abilityDetailed: `Use the Gardener to assign characters to particular players.
• After the Storyteller has put the Gardener into play, they can manually assign and edit which characters are going to be given to which seated players before sending them out.
• If a player has an issue with a particular character, you may use the Gardener to affect setup so that player doesn’t draw the relevant token.
• The Gardener can also be useful if a particular player has drawn evil many times over a single session.
• The Gardener is designed for use in the official app only.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gardener',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/gardenerIcon.png',
    medium: '/icons/characters/gardenerIcon.png',
    large: '/icons/characters/gardenerIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [],
};
