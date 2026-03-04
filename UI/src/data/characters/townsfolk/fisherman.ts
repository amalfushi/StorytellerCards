import type { CharacterDef } from '@/types/index.ts';

export const fisherman: CharacterDef = {
  id: 'fisherman',
  name: 'Fisherman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, during the day, visit the Storyteller for some advice to help your team win.',
  abilityDetailed: `The Fisherman knows something that nobody else can know: what should be done.
• The Fisherman player chooses when to use their ability.
• When they visit the Storyteller, the Storyteller chooses what piece of advice to give the Fisherman.
• The Storyteller’s pieces of advice are not necessarily “facts”. They are strategy tips that the Storyteller believes will help the Fisherman win, if they are followed.
• If the Fisherman is drunk or poisoned, the Storyteller may give the Fisherman bad advice.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fisherman',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/fishermanIcon.png',
    medium: '/icons/characters/fishermanIcon.png',
    large: '/icons/characters/fishermanIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
};
