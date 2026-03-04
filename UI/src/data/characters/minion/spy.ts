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
    small: '/icons/characters/spyIcon.png',
    medium: '/icons/characters/spyIcon.png',
    large: '/icons/characters/spyIcon.png',
    placeholder: '#e53935',
  },
  reminders: [],
};
