import type { CharacterDef } from '@/types/index.ts';

export const spiritofivory: CharacterDef = {
  id: 'spiritofivory',
  name: 'Spirit of Ivory',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort: "There can't be more than 1 extra evil player.",
  abilityDetailed: `Add the Spirit of Ivory to your script to keep the number of evil players fair and balanced.
• When creating character lists using the Script Tool, it is a good idea to include no more than one character that adds evil characters. If two or more players turn evil, then the evil team can win simply by revealing who they are and winning due to their voting majority. Adding the Spirit of Ivory prevents too many players turning evil, creating a more fun and fair game for the good players.
• With a Spirit of Ivory in play, only one more player than normal can ever be evil. If a second player would become evil, they stay good instead.
• The normal number of evil players is printed on the Traveller sheet and on the Setup sheet.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Spirit_of_Ivory',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/spiritofivoryIcon.png',
    medium: '/icons/characters/spiritofivoryIcon.png',
    large: '/icons/characters/spiritofivoryIcon.png',
    placeholder: '#ff9800',
  },
  reminders: [],
};
