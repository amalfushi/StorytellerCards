import type { CharacterDef } from '@/types/index.ts';

export const slayer: CharacterDef = {
  id: 'slayer',
  name: 'Slayer',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
  abilityDetailed: `The Slayer can kill the Demon by guessing who they are.
• The Slayer can choose to use their ability at any time during the day, and must declare to everyone when they're using it. If the Slayer chooses the Demon, the Demon dies immediately. Otherwise, nothing happens.
• The players do not learn the identity of the dead player. After all, it may have been the Recluse!
• A Slayer that uses their ability while poisoned or drunk may not use it again.
• The Slayer will want to choose an alive player. Even if the Slayer chooses a dead Imp, nothing happens, because a dead player can't die again.
• Players may say whatever they want at any time, so a player who's pretending to be the Slayer may pretend to use the Slayer ability.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Slayer',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/slayerIcon.webp',
    medium: '/icons/characters/slayerIcon.webp',
    large: '/icons/characters/slayerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'lleech',
      description: 'If the Slayer slays the Lleech host, the host dies.',
    },
  ],
  flavor: 'Die.',
  edition: 'tb',
};
