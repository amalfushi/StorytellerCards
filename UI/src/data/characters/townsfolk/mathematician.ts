import type { CharacterDef } from '@/types/index.ts';

export const mathematician: CharacterDef = {
  id: 'mathematician',
  name: 'Mathematician',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    "Each night, you learn how many players' abilities worked abnormally (since dawn) due to another character's ability.",
  abilityDetailed: `The Mathematician knows how many things have gone wrong since dawn today.
• When an ability does not work in the intended way due to another character's interference, the Mathematician will learn that it happened. They'll learn that something went wrong if a piece of information was false but was supposed to be true, or if an ability should have worked but didn't, due to another character.
• The Mathematician does not learn which players this happened to, only how many times it happened.
• The Mathematician does not detect their own ability failing.
• The Mathematician does not detect drunkenness or poisoning itself, but does detect when drunk or poisoned players' abilities did not work as intended. The Recluse registering as evil to the Chef, and the poisoned Soldier dying from the Imp's attack, would each be detected. The poisoned Empath getting true information would not.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Mathematician',
  firstNight: {
    order: 71,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'mathematician-fn-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 89,
    helpText: 'Give a finger signal.',
    subActions: [
      {
        id: 'mathematician-on-1',
        description: 'Give a finger signal.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/mathematicianIcon.webp',
    medium: '/icons/characters/mathematicianIcon.webp',
    large: '/icons/characters/mathematicianIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'mathematician-abnormal', text: 'ABNORMAL' }],
  jinxes: [
    {
      characterId: 'chambermaid',
      description: 'The Chambermaid can detect if the Mathematician will wake tonight.',
    },
    {
      characterId: 'drunk',
      description:
        "The Mathematician might learn if the Drunk's ability yielded false info or failed to work properly.",
    },
    {
      characterId: 'lunatic',
      description:
        'The Mathematician might learn if the Lunatic attacks a different player than the real Demon attacked.',
    },
    {
      characterId: 'marionette',
      description:
        "The Mathematician might learn if the Marionette's ability yielded false info or failed to work properly.",
    },
  ],
  flavor:
    'Any consistent formal system x, within which a certain amount of elementary arithmetic can be carried out is incomplete; that is, there are statements of the language of x which can neither be proved nor disproved in x. Ergo, you are drunk.',
  edition: 'snv',
};
