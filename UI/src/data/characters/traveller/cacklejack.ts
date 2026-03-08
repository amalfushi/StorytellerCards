import type { CharacterDef } from '@/types/index.ts';

export const cacklejack: CharacterDef = {
  id: 'cacklejack',
  name: 'Cacklejack',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort: 'Each day, choose a player: a different player changes character tonight.',
  abilityDetailed: `The Cacklejack causes character-changing chaos.
• The Storyteller chooses one player to change character each night. This player can be evil or good, dead or alive.
• The Storyteller also chooses which character they become. This may be an in-play or a not-in-play character.
• Each day, the Cacklejack chooses a player that is immune - the Storyteller must choose a different player to change character that night.
• The Cacklejack may choose publicly or privately, but must choose during the day.
• Each time a player’s character changes, this is treated as a new instance of that character ability. For example, if a player becomes the Chef on Night 3, they immediately learn how many pairs of evil players there are.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Cacklejack',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/cacklejackIcon.webp',
    medium: '/icons/characters/cacklejackIcon.webp',
    large: '/icons/characters/cacklejackIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'cacklejack-notme', text: 'NOT ME' }],
  flavor:
    'Wire α To wire β. LigHt oN. BuZZer off. GAzOinks! Arms STra1ght. FingER 2 nose. hOooLd stiLL. BoiNgo-banGo! Ha-ha-ha!',
  edition: 'carousel',
};
