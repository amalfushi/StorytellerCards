import type { CharacterDef } from '@/types/index.ts';

export const bootlegger: CharacterDef = {
  id: 'bootlegger',
  name: 'Bootlegger',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort: 'This script has homebrew characters or rules.',
  abilityDetailed: `Add the Bootlegger to include homebrew characters or rules.
• The Bootlegger allows Storytellers to use characters they, or others, have created that are not official characters or allows them to use non-standard rules in the game.
• If there are homebrew characters on the character sheet, or homebrew rules in effect, the Storyteller tells all players what they are before play begins.
• The Bootlegger allows for multiple characters or rules to be in effect at once.
• As long as there is at least one homebrew character on the current script, this Loric will be in play and can only be removed by switching to a script that does not contain any homebrew characters.
• The Bootlegger is designed for use in the official app only.
• Bootlegger, despite many claims to the contrary, defeated , “the people’s choice”, in a hotly contested poll to decide the Loric's name.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Bootlegger',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/bootleggerIcon.png',
    medium: '/icons/characters/bootleggerIcon.png',
    large: '/icons/characters/bootleggerIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [],
};
