import type { CharacterDef } from '@/types/index.ts';

export const wizard: CharacterDef = {
  id: 'wizard',
  name: 'Wizard',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Once per game, choose to make a wish. If granted, it might have a price & leave a clue as to its nature.',
  abilityDetailed: `The Wizard makes a wish.
• This wish is limited only by the player’s imagination. It can be anything at all. The Wizard can write their wish on their phone and wake at night to show the Storyteller, or talk with the Storyteller in private during the day. The Wizard could even make a wish publicly if they are feeling foolish.
• If the Storyteller tells the group that the Wizard has made a wish, they need not do so immediately, and can do so at any point later on.
• Many wishes have a price. The price changes the game in some way, or changes the wish in some way. It can be anything at all, and is decided by the Storyteller. The Storyteller may or may not tell the Wizard what the price is. The purpose of the price is to rebalance a wish that is unfair for the good team on a mechanical level.
• Many wishes leave a clue. The clue can be anything at all, is decided by the Storyteller, and is declared publicly. The purpose of a clue is to rebalance a wish that is unfair to the good team on an informational level.
• When the Wizard dies, the wish may or may not still be in effect, depending on the nature of the wish and the nature of the price.
• If the Wizard makes a wish that the Storyteller doesn’t understand, or feels like it would be impossible to implement, the Storyteller may ask the Wizard to wish again, or cancel the wish.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Wizard',
  firstNight: {
    order: 30,
    helpText: "Do whatever needs to be done to satisfy the Wizard's ability.",
    subActions: [
      {
        id: 'wizard-fn-1',
        description: "Do whatever needs to be done to satisfy the Wizard's ability.",
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 13,
    helpText: "Do whatever needs to be done to satisfy the Wizard's ability.",
    subActions: [
      {
        id: 'wizard-on-1',
        description: "Do whatever needs to be done to satisfy the Wizard's ability.",
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/wizardIcon.png',
    medium: '/icons/characters/wizardIcon.png',
    large: '/icons/characters/wizardIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [],
};
