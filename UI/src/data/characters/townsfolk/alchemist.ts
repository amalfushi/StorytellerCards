import type { CharacterDef } from '@/types/index.ts';

export const alchemist: CharacterDef = {
  id: 'alchemist',
  name: 'Alchemist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You have a Minion ability. When using this, the Storyteller may prompt you to choose differently.',
  abilityDetailed: `The Alchemist has a Minion ability.
• The Alchemist’s ability is usually that of a not-in-play Minion, but can duplicate an in-play Minion ability.
• The Alchemist learns which ability this is on the first night.
• They are still a good Townsfolk. They win when good wins, and lose when good loses. They register as good and as the Alchemist.
• The Alchemist does not wake to learn who the other Minions are or who the Demon is, like Minions do.
• If the Alchemist’s Minion ability adds or removes characters during setup, this still occurs during setup.
• If the Alchemist has an ability where the player chooses something, like the Poisoner or the Vizier, the Storyteller may ask the Alchemist to choose differently. The Alchemist must do so.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Alchemist',
  firstNight: {
    order: 10,
    helpText: 'Show the YOU ARE info token and a Minion token.',
    subActions: [
      {
        id: 'alchemist-fn-1',
        description: 'Show the YOU ARE info token and a Minion token.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/alchemistIcon.webp',
    medium: '/icons/characters/alchemistIcon.webp',
    large: '/icons/characters/alchemistIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'alchemist-isthealchemist', text: 'IS THE ALCHEMIST' }],
  jinxes: [
    {
      characterId: 'boffin',
      description:
        'If the Alchemist has the Boffin ability, the Alchemist does not learn what ability the Demon has.',
    },
    {
      characterId: 'marionette',
      description: 'An Alchemist-Marionette has no Marionette ability & the Marionette is in play.',
    },
    {
      characterId: 'mastermind',
      description:
        'An Alchemist-Mastermind has no Mastermind ability & the Mastermind is not-in-play.',
    },
    {
      characterId: 'organgrinder',
      description:
        'If the Alchemist has the Organ Grinder ability, the Organ Grinder is in play. If both are sober, both are drunk.',
    },
    {
      characterId: 'spy',
      description:
        'An Alchemist-Spy has no Spy ability & a Spy is in play. After each execution, a living Alchemist-Spy may publicly guess a living player as the Spy. If correct, the Demon must choose the Spy tonight.',
    },
    {
      characterId: 'summoner',
      description:
        'The Alchemist-Summoner does not get bluffs, and chooses which Demon but not which player. If they die before this happens, evil wins. [No Demon]',
    },
    {
      characterId: 'widow',
      description:
        'An Alchemist-Widow has no Widow ability & a Widow is in play. After each execution, a living Alchemist-Widow may publicly guess a living player as the Widow. If correct, the Demon must choose the Widow tonight.',
    },
    {
      characterId: 'wraith',
      description:
        'An Alchemist-Wraith has no Wraith ability & a Wraith is in play. After each execution, a living Alchemist-Wraith may publicly guess a living player as the Wraith. If correct, the Demon must choose the Wraith tonight.',
    },
  ],
  flavor:
    'Visit the interior of the Earth. By rectification thou shalt find the hidden stone. Above the gold, lieth the red. Kether in Malkuth.',
  edition: 'carousel',
  remindersGlobal: [
    { id: 'alchemist-global-isthealchemist', text: 'Is The Alchemist', isGlobal: true },
  ],
};
