import type { CharacterDef } from '@/types/index.ts';

export const hellslibrarian: CharacterDef = {
  id: 'hellslibrarian',
  name: "Hell's Librarian",
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'Something bad might happen to whoever talks when the Storyteller has asked for silence.',
  abilityDetailed: `Use the Hell’s Librarian to allow a softly-spoken Storyteller to be heard when needed.
• As the Storyteller, you’ll find the Hell’s Librarian useful when it is difficult to get the group’s attention. Maybe you need to explain a game rule? Or get attention for a crucial final-day vote? It can also be used to prevent players from talking about their characters before the game begins or from narrating what they are doing at night. Players instinctively stay quieter during the pre-game period and at night, so you may never need it.
• It is best to give the players fair warning before you bring the hammer down. Like the Angel, the threat of a mysterious penalty is more important than the actual penalty. The purpose of this character is to make games run smoothly, not to punish minor infringements.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Hell%27s_Librarian',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/hellslibrarianIcon.webp',
    medium: '/icons/characters/hellslibrarianIcon.webp',
    large: '/icons/characters/hellslibrarianIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [{ id: 'hellslibrarian-somethingbad', text: 'SOMETHING BAD' }],
  flavor:
    "Shhhhhh. Please be quiet. It is best not to disturb the Librarian. I've heard it has a temper.",
  edition: 'fabled',
};
