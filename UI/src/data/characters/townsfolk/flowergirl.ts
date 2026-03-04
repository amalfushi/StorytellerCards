import type { CharacterDef } from '@/types/index.ts';

export const flowergirl: CharacterDef = {
  id: 'flowergirl',
  name: 'Flowergirl',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night*, you learn if a Demon voted today.',
  abilityDetailed: `The Flowergirl knows if the Demon voted or not.
• A Demon’s vote counts whether or not the nominee was executed.
• The Flowergirl does not detect if the Demon raised their hand for other reasons, such as when the players “vote” on what to order for dinner, or when the players raise their hand to exile a Traveller.
• If the Demon changes players after the original Demon voted but before the Flowergirl wakes to learn their information, the Flowergirl detects the original Demon.
• If there are two (or more!) Demons, even dead Demons, the Flowergirl detects if any of them voted. If even one Demon voted, the Flowergirl learns a “yes”.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Flowergirl',
  firstNight: null,
  otherNights: {
    order: 73,
    helpText: 'Either nod or shake your head.',
    subActions: [
      {
        id: 'flowergirl-on-1',
        description: 'Either nod or shake your head.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'yesno', maxSelections: 1, label: 'Nod / Shake' }],
  },
  icon: {
    small: '/icons/characters/flowergirlIcon.png',
    medium: '/icons/characters/flowergirlIcon.png',
    large: '/icons/characters/flowergirlIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'flowergirl-demonnotvoted', text: 'DEMON NOT VOTED' },
    { id: 'flowergirl-demonvoted', text: 'DEMON VOTED' },
  ],
};
