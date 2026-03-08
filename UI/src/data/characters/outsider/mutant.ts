import type { CharacterDef } from '@/types/index.ts';

export const mutant: CharacterDef = {
  id: 'mutant',
  name: 'Mutant',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'If you are "mad" about being an Outsider, you might be executed.',
  abilityDetailed: `The Mutant is killed if they try to reveal who they are.
• “Madness” is a term that means “you are trying to convince the group of something.” So, if the Mutant player is mad about being the Mutant, this means they are trying to convince people that they are the Mutant. If they are mad about being an Outsider, this means they are trying to convince people that they are an Outsider.
• This can be by verbally hinting who they are, or by their silence when questioned. It is always up to the Storyteller to decide what the Mutant is doing. If you think they are trying to convince the group they are an Outsider in any way, you can execute them—even outside the nomination phase, or at night. If you do, no other executions may happen today by normal means, since there is only one execution per day.
• If the Mutant hints that they are the Mutant at night, you may execute them that night, even if an execution happened today. Declare they have died, and continue the night phase as normal. An execution may still happen the next day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Mutant',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/mutantIcon.webp',
    medium: '/icons/characters/mutantIcon.webp',
    large: '/icons/characters/mutantIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  flavor: 'I am not a freak! I am a human being! Have mercy!',
  edition: 'snv',
};
