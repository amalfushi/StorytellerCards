import type { CharacterDef } from '@/types/index.ts';

export const bigwig: CharacterDef = {
  id: 'bigwig',
  name: 'Big Wig',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort:
    'Each nominee chooses a player: until voting, only they may speak & they are mad the nominee is good or they might die.',
  abilityDetailed: `The Big Wig gives nominees a defence lawyer.
• When nominated, that player must choose a player to speak on their behalf. They may choose living or dead players.
• Other players are not allowed to speak during this period. This includes the nominated player. If necessary, the Storyteller may use the Hell’s Librarian to enforce this.
• If the chosen player is mad that the nominee is evil, or not mad enough that the nominee is good, the Storyteller might kill that player.
• Being mad that ‘the nominee should not be executed’ might be similar enough to being mad that ‘the nominee is good’ to avoid being killed by the Storyteller.
• The Storyteller will make it obvious when the period of silence begins. It ends when voting begins.
• The player chosen by the nominee may vote for the nominee.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Big_Wig',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/bigwigIcon.png',
    medium: '/icons/characters/bigwigIcon.png',
    large: '/icons/characters/bigwigIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [],
};
