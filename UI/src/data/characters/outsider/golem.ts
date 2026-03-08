import type { CharacterDef } from '@/types/index.ts';

export const golem: CharacterDef = {
  id: 'golem',
  name: 'Golem',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'You may only nominate once per game. When you do, if the nominee is not the Demon, they die.',
  abilityDetailed: `The Golem kills the player they nominate.
• When the Golem nominates a player, that player immediately dies. The nomination process continues.
• If the Golem nominates the Demon, nothing happens. The Storyteller doesn’t confirm or deny that the Golem nominated, and continues with the voting process as normal. The Storyteller may say “nothing happens” if clarity is asked for.
• After the Golem has nominated once, whether or not the nominee dies, the Golem may not nominate again this game. It is the player’s responsibility to refrain from nominating, not the Storyteller’s. Deliberately nominating when they shouldn’t is considered cheating.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Golem',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/golemIcon.webp',
    medium: '/icons/characters/golemIcon.webp',
    large: '/icons/characters/golemIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  flavor: 'Golem help? Golem smash! Golem help.',
  edition: 'carousel',
};
