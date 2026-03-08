import type { CharacterDef } from '@/types/index.ts';

export const pacifist: CharacterDef = {
  id: 'pacifist',
  name: 'Pacifist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Executed good players might not die.',
  abilityDetailed: `The Pacifist prevents good players from dying by execution.
• When a good player is executed, the Storyteller chooses whether they die or live.
• As always, when abilities like this function in obvious ways, the group is not told why something has happened, only what has happened. The group learns that an execution succeeded, but that the executed player did not die—that is all.
• If a player is executed and remains alive, that still counts as the execution for today. No other nominations may happen.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Pacifist',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/pacifistIcon.webp',
    medium: '/icons/characters/pacifistIcon.webp',
    large: '/icons/characters/pacifistIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor: 'Distrust all in whom the impulse to punish is powerful.',
  edition: 'bmr',
};
