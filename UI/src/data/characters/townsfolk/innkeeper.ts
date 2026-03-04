import type { CharacterDef } from '@/types/index.ts';

export const innkeeper: CharacterDef = {
  id: 'innkeeper',
  name: 'Innkeeper',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: "Each night*, choose 2 players: they can't die tonight, but 1 is drunk until dusk.",
  abilityDetailed: `The Innkeeper protects people from death at night, but somebody gets drunk in the process.
• The Innkeeper, like the Monk, makes players safe from being killed by the Demon. They are also safe from death caused by Outsiders, Minions, Townsfolk, and Travellers.
• The Innkeeper only protects players at night, not the day.
• One of the two players that the Innkeeper chooses becomes drunk for tonight and the next day. This player may be good or evil, but will almost always be good, depending how your game is going. An Innkeeper that chooses themself might become drunk, which means they have no ability and may die tonight—and the other player they chose to protect isn’t safe either.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Innkeeper',
  firstNight: null,
  otherNights: {
    order: 12,
    helpText: 'The Innkeeper chooses 2 players.',
    subActions: [
      {
        id: 'innkeeper-on-1',
        description: 'The Innkeeper chooses 2 players.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: {
    small: '/icons/characters/innkeeperIcon.png',
    medium: '/icons/characters/innkeeperIcon.png',
    large: '/icons/characters/innkeeperIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'innkeeper-safe', text: 'SAFE' },
    { id: 'innkeeper-drunk', text: 'DRUNK' },
  ],
  jinxes: [
    {
      characterId: 'leviathan',
      description:
        'If the Leviathan nominates and executes an Innkeeper-protected player, good wins.',
    },
    {
      characterId: 'riot',
      description: 'If Riot nominates and executes an Innkeeper-protected player, good wins.',
    },
  ],
};
