import type { CharacterDef } from '@/types/index.ts';

export const sentinel: CharacterDef = {
  id: 'sentinel',
  name: 'Sentinel',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort: 'There might be 1 extra or 1 fewer Outsider in play.',
  abilityDetailed: `Add the Sentinel to your script to keep the number of Outsiders in play mysterious.
• The official character lists are carefully constructed so that the number of Outsiders is never completely known, which lets evil players safely bluff as Outsiders. Many of the games you create using the Script Tool will not have this luxury. If, for one reason or another, the number of Outsiders in a game will become certain, the Storyteller can add a Sentinel. This will confuse matters and help the evil team either bluff as Outsiders or make existing Outsiders look suspicious.
• Games with a Sentinel in play might have one more Outsider than normal. They may have one less. They may have the normal amount. It is up to the Storyteller.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Sentinel',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/sentinelIcon.webp',
    medium: '/icons/characters/sentinelIcon.webp',
    large: '/icons/characters/sentinelIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [],
  flavor: 'Name, please. Papers, please. Weapons, please.',
  edition: 'fabled',
  setup: true,
};
