import type { CharacterDef } from '@/types/index.ts';

export const damsel: CharacterDef = {
  id: 'damsel',
  name: 'Damsel',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'All Minions know a Damsel is in play. If a Minion publicly guesses you (once), your team loses.',
  abilityDetailed: `The Damsel needs to avoid being found by the Minions.
• If a Minion guesses that you are the Damsel, and does so publicly (so that all players know that they are a Minion), evil wins.
• No matter how many Minions are in play, they only get one guess, total. If a Minion makes a guess and is wrong, future guesses by this Minion or by other Minions don’t count.
• If the Demon pretends to be a Minion making a guess, that doesn’t count as a guess. Minions may still make a guess and win.
• Minions may make a guess at any time.
• If the Damsel dies, they are no longer at risk of being guessed by a Minion, since the Damsel loses their ability when dead.
• There may not be a Huntsman in play. But if there is, and the Huntsman chooses the Damsel at night, the Damsel becomes a not-in-play Townsfolk, and is no longer the Damsel. The Damsel learns which Townsfolk and has that Townsfolk ability from then on.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Damsel',
  firstNight: {
    order: 44,
    helpText:
      "During Minion Info, show the Minions the Damsel token. If you haven't done this yet, do so now. If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.",
    subActions: [
      {
        id: 'damsel-fn-1',
        description: 'During Minion Info, show the Minions the Damsel token.',
        isConditional: false,
      },
      {
        id: 'damsel-fn-2',
        description: "If you haven't done this yet, do so now.",
        isConditional: true,
      },
      {
        id: 'damsel-fn-3',
        description:
          'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
        isConditional: true,
      },
    ],
  },
  otherNights: {
    order: 61,
    helpText:
      'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
    subActions: [
      {
        id: 'damsel-on-1',
        description:
          'If the Damsel was chosen by the Huntsman, show the YOU ARE info token & their new character token.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/damselIcon.webp',
    medium: '/icons/characters/damselIcon.webp',
    large: '/icons/characters/damselIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'pithag',
      description: 'If a Pit-Hag creates a Damsel, the Storyteller chooses which player it is.',
    },
    {
      characterId: 'widow',
      description: 'If the Widow is (or has been) in play, the Damsel is poisoned.',
    },
  ],
  flavor: "Don't touch the hair, honey.",
  edition: 'carousel',
};
