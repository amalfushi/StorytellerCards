import type { CharacterDef } from '@/types/index.ts';

export const gnome: CharacterDef = {
  id: 'gnome',
  name: 'Gnome',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'All players start knowing a player of your alignment. You may choose to kill anyone who nominates them.',
  abilityDetailed: `The Gnome protects one player on their team.
• The Gnome starts as the same alignment as one other player - their "amigo". The Storyteller publicly announces which player this is.
• When their amigo is nominated, it is the Gnome's responsibility to speak up. The Storyteller may not prompt them to use their ability.
• If their amigo changes alignment, the Gnome's alignment does not change.
• The Gnome may use their ability any number of times over the course of the game, including zero. Their amigo may still only be nominated once per day.
• When the Gnome uses their ability, and the Storyteller confirms it, the nominator dies immediately. Voting for execution still occurs.
• Regardless of what the group wants, it is always the individual player's decision whether they wish to nominate or not, and always the Gnome player's decision on whether they wish to use their ability or not. If the Storyteller feels that a player is being pressured into nominating or using their ability when they don't want to, the Storyteller may not recognize that nomination or ability use.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gnome',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/gnomeIcon.png',
    medium: '/icons/characters/gnomeIcon.png',
    large: '/icons/characters/gnomeIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'gnome-amigo', text: 'AMIGO' }],
};
