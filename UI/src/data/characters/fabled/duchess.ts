import type { CharacterDef } from '@/types/index.ts';

export const duchess: CharacterDef = {
  id: 'duchess',
  name: 'Duchess',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'Each day, 3 players may choose to visit you. At night*, each visitor learns how many visitors are evil, but 1 gets false info.',
  abilityDetailed: `Add the Duchess if your script has too little information or too much misinformation.
• Sometimes, you may want to create a character list using the Script Tool that has hardly any good characters that gain information directly. Whilst having an abundance of abilities and a lack of information can be fun for some players, other players like something more. The Duchess adds regular information to such a game.
• Each player that visits the Duchess learns how many visitors are evil, including themself. However, one visitor of the Storyteller’s choice will get false information.
• Players that visit the Duchess still get to use their ability normally. The Duchess does not make their ability give false information.
• The players decide amongst themselves which players will be the three players to visit. If exactly three visitors cannot be decided upon, then the Duchess does not act tonight.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Duchess',
  firstNight: null,
  otherNights: {
    order: 1,
    helpText:
      'One at a time: Wake each player marked VISITOR or FALSE INFO. Show the THIS CHARACTER SELECTED YOU & Duchess tokens, then give a finger signal.',
    subActions: [
      {
        id: 'duchess-on-1',
        description: 'One at a time: Wake each player marked VISITOR or FALSE INFO.',
        isConditional: false,
      },
      {
        id: 'duchess-on-2',
        description:
          'Show the THIS CHARACTER SELECTED YOU & Duchess tokens, then give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/duchessIcon.webp',
    medium: '/icons/characters/duchessIcon.webp',
    large: '/icons/characters/duchessIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [
    { id: 'duchess-visitor', text: 'VISITOR' },
    { id: 'duchess-falseinfo', text: 'FALSE INFO' },
  ],
  flavor:
    'We shall entertain between the hours of 6 and 7 precisely. Tea at 6:15. Scones at 6:45. Do not be late. Formal wear applies, as always.',
  edition: 'fabled',
};
