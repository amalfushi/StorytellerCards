import type { CharacterDef } from '@/types/index.ts';

export const savant: CharacterDef = {
  id: 'savant',
  name: 'Savant',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each day, you may visit the Storyteller to learn 2 things in private: 1 is true & 1 is false.',
  abilityDetailed: `The Savant gets crazy, amazing information that is different every day and every game, but exactly half of it is completely false.
• Each day, the Storyteller chooses two pieces of information to give the Savant... so get creative! One must be true, and one must be false, and the Savant won’t know which is which.
• It is up to the Savant to talk with the Storyteller, not the other way around. This isn’t a public conversation, and the group can’t listen in. It’s private.
• The Savant can choose to not visit the Storyteller if they wish.
• A drunk or poisoned Savant might get two pieces of true information or two pieces of false information.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Savant',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/savantIcon.png',
    medium: '/icons/characters/savantIcon.png',
    large: '/icons/characters/savantIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
