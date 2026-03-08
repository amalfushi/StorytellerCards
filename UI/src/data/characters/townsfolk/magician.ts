import type { CharacterDef } from '@/types/index.ts';

export const magician: CharacterDef = {
  id: 'magician',
  name: 'Magician',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'The Demon thinks you are a Minion. Minions think you are a Demon.',
  abilityDetailed: `The Magician confuses the evil players about who is evil and who isn’t.
• On the first night, instead of learning which player is the Demon, the Minions are told that both players—the Demon and the Magician—are the Demon.
• On the first night, the Demon learns that the Magician player is one of its Minions.
• The Magician does not wake to learn anything.
• The Storyteller can point to the Magician and the evil players in any order, so that the evil players won’t know which player is the Magician.
• If the Poppy Grower dies and the Demon and Minions learn who each other are mid-game, the Magician ability has an effect that night, just as if it was the first night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Magician',
  firstNight: {
    order: 13,
    helpText:
      'During Minion Info, point to the Magician and the Demon. During Demon Info, point to the Magician and the Minions.',
    subActions: [
      {
        id: 'magician-fn-1',
        description: 'During Minion Info, point to the Magician and the Demon.',
        isConditional: false,
      },
      {
        id: 'magician-fn-2',
        description: 'During Demon Info, point to the Magician and the Minions.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/magicianIcon.webp',
    medium: '/icons/characters/magicianIcon.webp',
    large: '/icons/characters/magicianIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'legion',
      description:
        'The Magician wakes with Legion and might register as evil. Legion knows if a Magician is in play, but not which player it is.',
    },
    {
      characterId: 'lilmonsta',
      description:
        "If the Magician is alive, the Storyteller chooses which Minion babysits Lil' Monsta.",
    },
    {
      characterId: 'marionette',
      description:
        "If the Magician is alive, the Demon doesn't know which neighbor is the Marionette.",
    },
    {
      characterId: 'spy',
      description:
        "When the Spy sees the Grimoire, the Demon and Magician's character tokens are removed.",
    },
    {
      characterId: 'vizier',
      description:
        "If the Vizier is in play, the Magician has no ability but is immune to the Vizier's ability.",
    },
    {
      characterId: 'widow',
      description:
        "When the Widow sees the Grimoire, the Demon and Magician's character tokens are removed.",
    },
    {
      characterId: 'wraith',
      description:
        'After each execution, the living Magician may publicly guess a living player as the Wraith. If correct, the Demon must choose the Wraith tonight.',
    },
  ],
  flavor:
    '1... 2... Abra... 3... 4... Cadabra... *poof!* And, as you can see, ladies and gentlemen, Captain Farnsworth’s bag of gold has disappeared! Gone! Without a trace! Thank you, and goodnight!',
  edition: 'carousel',
};
