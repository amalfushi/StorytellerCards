import type { CharacterDef } from '@/types/index.ts';

export const amnesiac: CharacterDef = {
  id: 'amnesiac',
  name: 'Amnesiac',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You do not know what your ability is. Each day, privately guess what it is: you learn how accurate you are.',
  abilityDetailed: `The Amnesiac doesn’t know their own ability.
• The Storyteller decides what the Amnesiac’s ability is. It may be the same ability as another character in Blood On The Clocktower, something similar, or something original.
• The Amnesiac may wake at any time during the night to learn information or to choose a player, or their ability may be passive—not requiring action from the Amnesiac player.
• Each day, the Amnesiac talks to the Storyteller in private, and makes a guess as to what their ability is. The Storyteller answers “cold” if the guess is very wrong, “warm” if the guess is on the right track, “hot” if the guess is very close, and “bingo” if the guess is spot on.
• Their guess may be specific, such as “Am I learning two players each night that are the same alignment?”, or vague, such as “Is my ability something to do with dead players?”`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Amnesiac',
  firstNight: {
    order: 45,
    helpText: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
    subActions: [
      {
        id: 'amnesiac-fn-1',
        description: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 62,
    helpText: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
    subActions: [
      {
        id: 'amnesiac-on-1',
        description: "Do whatever needs to be done to satisfy the Amnesiac's ability.",
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/amnesiacIcon.png',
    medium: '/icons/characters/amnesiacIcon.png',
    large: '/icons/characters/amnesiacIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
