import type { CharacterDef } from '@/types/index.ts';

export const librarian: CharacterDef = {
  id: 'librarian',
  name: 'Librarian',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)',
  abilityDetailed: `The Librarian learns that a particular Outsider character is in play, but not exactly which player it is.
• During the first night, the Librarian learns that one of two players is a specific Outsider.
• They learn this only once and then learn nothing more.
• The Drunk is an Outsider. If the Librarian learns that one of two players is the Drunk, they do not learn the Townsfolk that the Drunk's player thinks they are.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Librarian',
  firstNight: {
    order: 47,
    helpText: 'Show the Outsider character token. Point to both the OUTSIDER and WRONG players.',
    subActions: [
      {
        id: 'librarian-fn-1',
        description: 'Show the Outsider character token.',
        isConditional: false,
      },
      {
        id: 'librarian-fn-2',
        description: 'Point to both the OUTSIDER and WRONG players.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/librarianIcon.webp',
    medium: '/icons/characters/librarianIcon.webp',
    large: '/icons/characters/librarianIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'librarian-outsider', text: 'OUTSIDER' },
    { id: 'librarian-wrong', text: 'WRONG' },
  ],
  flavor:
    'Certainly madam, under normal circumstances, you may borrow the Codex Malificarium from the library vaults. However, you do not seem to be a member.',
  edition: 'tb',
};
