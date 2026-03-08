import type { CharacterDef } from '@/types/index.ts';

export const godfather: CharacterDef = {
  id: 'godfather',
  name: 'Godfather',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'You start knowing which Outsiders are in play. If 1 died today, choose a player tonight: they die. [-1 or +1 Outsider]',
  abilityDetailed: `The Godfather takes revenge when the town kills Outsiders.
• Whenever an Outsider is executed and dies, the Godfather chooses one player to die that night.
• The Godfather only kills if an Outsider dies during the day. Outsiders that die at night don’t count.
• If the Godfather is in play, this adds or removes one Outsider from play.
• At the start of the game, the Godfather learns which Outsiders are in play.
• If two Outsiders died today, the Godfather still only kills one player tonight.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Godfather',
  firstNight: {
    order: 32,
    helpText: 'Show the character tokens of all in-play Outsiders.',
    subActions: [
      {
        id: 'godfather-fn-1',
        description: 'Show the character tokens of all in-play Outsiders.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 50,
    helpText: 'If an Outsider died today, the Godfather chooses a player.',
    subActions: [
      {
        id: 'godfather-on-1',
        description: 'If an Outsider died today, the Godfather chooses a player.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/godfatherIcon.webp',
    medium: '/icons/characters/godfatherIcon.webp',
    large: '/icons/characters/godfatherIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'godfather-diedtoday', text: 'DIED TODAY' }],
  jinxes: [{ characterId: 'heretic', description: 'Only 1 jinxed character can be in play.' }],
  flavor:
    "Normally, it's just business. But when you insult my daughter, you insult me. And when you insult me, you insult my family. You really should be more careful - it would be a shame if you had an unfortunate accident.",
  edition: 'bmr',
  setup: true,
};
