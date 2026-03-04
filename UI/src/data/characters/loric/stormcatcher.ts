import type { CharacterDef } from '@/types/index.ts';

export const stormcatcher: CharacterDef = {
  id: 'stormcatcher',
  name: 'Storm Catcher',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort:
    'Name a good character. If in play, they can only die by execution, but evil players learn which player it is.',
  abilityDetailed: `Use the Storm Catcher to focus the game on a particular good character.
• If you want to construct a script based around the actions or information of one particular good character, if you want to have this character in every game (or at least have an evil player bluffing as this character), you can use the Storm Catcher. Your chosen character will play a big part in the game, will be the focus of a lot of group discussion, and will probably live until the final day.
• The Storyteller declares that one character can’t die, unless by execution. This character may be in play, or not in play. If it is in play, this good player lives as long as the good players want them to, since evil players cannot kill them. If it is not in play, all evil players learn this, so any evil player can easily bluff as this character. (They don’t have to, but they can.)`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Storm_Catcher',
  firstNight: {
    order: 4,
    helpText:
      'Announce which character is stormcaught. If that character is in play, mark that player as STORMCAUGHT. Wake each evil player and show them the character token, then the marked player. If not in play, wake each evil player, show them the THESE CHARACTERS ARE NOT IN PLAY token & the relevant character token.',
    subActions: [
      {
        id: 'stormcatcher-fn-1',
        description: 'Announce which character is stormcaught.',
        isConditional: false,
      },
      {
        id: 'stormcatcher-fn-2',
        description: 'If that character is in play, mark that player as STORMCAUGHT.',
        isConditional: true,
      },
      {
        id: 'stormcatcher-fn-3',
        description:
          'Wake each evil player and show them the character token, then the marked player.',
        isConditional: false,
      },
      {
        id: 'stormcatcher-fn-4',
        description:
          'If not in play, wake each evil player, show them the THESE CHARACTERS ARE NOT IN PLAY token & the relevant character token.',
        isConditional: true,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/stormcatcherIcon.png',
    medium: '/icons/characters/stormcatcherIcon.png',
    large: '/icons/characters/stormcatcherIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [{ id: 'stormcatcher-safe', text: 'SAFE' }],
};
