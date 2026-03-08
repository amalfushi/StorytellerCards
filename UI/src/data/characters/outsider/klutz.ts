import type { CharacterDef } from '@/types/index.ts';

export const klutz: CharacterDef = {
  id: 'klutz',
  name: 'Klutz',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'When you learn that you died, publicly choose 1 alive player: if they are evil, your team loses.',
  abilityDetailed: `The Klutz might accidentally lose the game for their team, unless they are clever.
• When the Klutz dies, they must declare a player. They may take a few minutes to do so—after all, it’s a big decision, and other players may give advice on who to choose, but it is always the Klutz’s decision. If they choose an evil player, the game ends immediately and the good team loses. If they choose a good player, nothing happens and the game continues.
• It is not the Storyteller’s responsibility to prompt the Klutz to declare they are the Klutz and choose a player. The Klutz must do this shortly after they learn that they are dead. Deliberately not doing so is considered cheating.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Klutz',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/klutzIcon.webp',
    medium: '/icons/characters/klutzIcon.webp',
    large: '/icons/characters/klutzIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  flavor: 'Oops.',
  edition: 'snv',
};
