import type { CharacterDef } from '@/types/index.ts';

export const spy: CharacterDef = {
  id: 'spy',
  name: 'Spy',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.',
  abilityDetailed: `The Spy might appear to be a good character, but is actually evil. They also see the Grimoire, so they know the characters (and status) of all players.
• If any character has an ability that would detect or affect a good player, then the Spy might register as good to that character. If any character has an ability that detects Townsfolk or Outsiders, then the Spy might register as a specific Townsfolk or Outsider to that player. It is the Storyteller's choice as to what the Spy registers as, even as many characters or both alignments during the same night.
• A Spy that registers as a particular Townsfolk or Outsider does not have this character's ability. For example, a Spy that registers as a Slayer cannot slay the Demon.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Spy',
  firstNight: {
    order: 66,
    helpText: 'Show the Grimoire for as long as the Spy needs.',
    subActions: [
      {
        id: 'spy-fn-1',
        description: 'Show the Grimoire for as long as the Spy needs.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 85,
    helpText: 'Show the Grimoire for as long as the Spy needs.',
    subActions: [
      {
        id: 'spy-on-1',
        description: 'Show the Grimoire for as long as the Spy needs.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/spyIcon.webp',
    medium: '/icons/characters/spyIcon.webp',
    large: '/icons/characters/spyIcon.webp',
    placeholder: '#e53935',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'alchemist',
      description:
        'An Alchemist-Spy has no Spy ability & a Spy is in play. After each execution, a living Alchemist-Spy may publicly guess a living player as the Spy. If correct, the Demon must choose the Spy tonight.',
    },
    {
      characterId: 'magician',
      description:
        "When the Spy sees the Grimoire, the Demon and Magician's character tokens are removed.",
    },
    {
      characterId: 'poppygrower',
      description: 'If the Poppy Grower has their ability, the Spy does not see the Grimoire.',
    },
    {
      characterId: 'heretic',
      description: 'Only 1 jinxed character can be in play.',
    },
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Spy ability, a Minion gains it, and learns this.',
    },
  ],
  flavor:
    'Any brewmaster worth their liquor, knows no concoction pours trouble quicker, than one where spies seem double.',
  edition: 'tb',
};
