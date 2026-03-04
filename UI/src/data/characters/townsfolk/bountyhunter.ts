import type { CharacterDef } from '@/types/index.ts';

export const bountyhunter: CharacterDef = {
  id: 'bountyhunter',
  name: 'Bounty Hunter',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'You start knowing 1 evil player. If the player you know dies, you learn another evil player tonight. [1 Townsfolk is evil]',
  abilityDetailed: `The Bounty Hunter tracks down evil players, one at a time.
• The Bounty Hunter starts knowing one evil player. When that player dies, they learn another evil player.
• The Bounty Hunter only learns the evil player, not their character.
• If the Bounty Hunter is drunk or poisoned when they should learn a new player, the Storyteller may show them a good player. When the recently shown player dies, the Bounty Hunter learns a new player that night.
• The Bounty Hunter cannot learn the same evil player twice.
• If the Bounty Hunter is in the game at setup, one Townsfolk is evil. The Bounty Hunter may learn the evil Townsfolk.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Bounty_Hunter',
  firstNight: {
    order: 63,
    helpText: 'Point to the player marked KNOW.',
    subActions: [
      {
        id: 'bountyhunter-fn-1',
        description: 'Point to the player marked KNOW.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 81,
    helpText:
      'If the player marked KNOW died today or tonight, point to the new player marked KNOW.',
    subActions: [
      {
        id: 'bountyhunter-on-1',
        description:
          'If the player marked KNOW died today or tonight, point to the new player marked KNOW.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/bountyhunterIcon.png',
    medium: '/icons/characters/bountyhunterIcon.png',
    large: '/icons/characters/bountyhunterIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'bountyhunter-know', text: 'KNOW' }],
  jinxes: [
    {
      characterId: 'kazali',
      description:
        'If the Kazali turns the Bounty Hunter into a Minion, an evil Townsfolk is not created.',
    },
    {
      characterId: 'philosopher',
      description:
        'If the Philosopher gains the Bounty Hunter ability, a Townsfolk might turn evil.',
    },
  ],
};
