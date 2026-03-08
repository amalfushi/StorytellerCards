import type { CharacterDef } from '@/types/index.ts';

export const general: CharacterDef = {
  id: 'general',
  name: 'General',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, you learn which alignment the Storyteller believes is winning: good, evil, or neither.',
  abilityDetailed: `The General knows who is winning.
• If the good team is winning, the Storyteller gives a thumbs up. If the evil team is winning, the Storyteller gives a thumbs down. If neither team is winning, or the Storyteller isn’t sure, the Storyteller gives a thumbs to the side.
• The Storyteller is the judge on which team is winning. Many factors may be included, such as how many players of each team are still alive, how much information the good team has, how successful the evil team’s bluffs seem to be, which players the group wants to execute next, or how experienced the Demon player is. All of these, and more, will inform the Storyteller’s judgment.
• The Storyteller decides who is winning at the point that the General wakes. Previous events in the night may affect their decision.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/General',
  firstNight: {
    order: 69,
    helpText: 'Give a thumb signal.',
    subActions: [
      {
        id: 'general-fn-1',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 87,
    helpText: 'Give a thumb signal.',
    subActions: [
      {
        id: 'general-on-1',
        description: 'Give a thumb signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/generalIcon.webp',
    medium: '/icons/characters/generalIcon.webp',
    large: '/icons/characters/generalIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor: 'I don’t have time for quotes.',
  edition: 'carousel',
};
