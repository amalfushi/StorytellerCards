import type { CharacterDef } from '@/types/index.ts';

export const eviltwin: CharacterDef = {
  id: 'eviltwin',
  name: 'Evil Twin',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    "You & an opposing player know each other. If the good player is executed, evil wins. Good can't win if you both live.",
  abilityDetailed: `The Evil Twin mirrors a good character, so that the players don't know which twin is good and which twin is evil.
• The Evil Twin is paired with a good player, chosen by the Storyteller, called the Good Twin.
• On the first night, the Evil Twin and Good Twin both wake, make eye contact, and learn each other’s character.
• If the Good Twin is executed, evil wins. If the Evil Twin is executed, the game continues. A dead Evil Twin has no ability, so evil doesn’t win if the Good Twin is later executed.
• Good cannot win while both twins are alive. Even if the Demon is killed, the game continues. Good will need to kill the Evil Twin as well as the Demon to win.
• If a good player is turned into an Evil Twin, they are still a good player, with an evil player becoming their twin. It doesn’t matter which twin is which character, what matters is their alignment—the good team can execute the evil player safely, but if they execute the good player, evil wins.
• If both Twins are the same alignment, the Storyteller chooses a new Twin.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Evil_Twin',
  firstNight: {
    order: 35,
    helpText:
      "Wake both twins. Allow eye contact. Show the good twin's character token to the Evil Twin & vice versa.",
    subActions: [
      {
        id: 'eviltwin-fn-1',
        description: 'Wake both twins.',
        isConditional: false,
      },
      {
        id: 'eviltwin-fn-2',
        description: 'Allow eye contact.',
        isConditional: false,
      },
      {
        id: 'eviltwin-fn-3',
        description: "Show the good twin's character token to the Evil Twin & vice versa.",
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/eviltwinIcon.png',
    medium: '/icons/characters/eviltwinIcon.png',
    large: '/icons/characters/eviltwinIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'eviltwin-twin', text: 'TWIN' }],
  jinxes: [
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Evil Twin ability, a player becomes the Evil Twin.',
    },
  ],
};
