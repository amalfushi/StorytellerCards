import type { CharacterDef } from '@/types/index.ts';

export const fearmonger: CharacterDef = {
  id: 'fearmonger',
  name: 'Fearmonger',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose a player: if you nominate & execute them, their team loses. All players know if you choose a new player.',
  abilityDetailed: `The Fearmonger creates paranoia about who nominates whom.
• During the first night, when the Fearmonger selects a player, all players learn this.
• During other nights, each time the Fearmonger selects a new player, all players learn this. If the Fearmonger selects the same player as previously, the players learn nothing.
• The players only learn that the Fearmonger has acted, not which player was selected.
• If the Fearmonger nominates their chosen player, and that nomination results in their execution, the chosen player loses, their team loses, and the game ends.
• Only the currently chosen player is susceptible to the Fearmonger’s ability. Previously chosen players don’t count.
• If the chosen player is executed but does not die, the chosen player’s team still loses.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fearmonger',
  firstNight: {
    order: 38,
    helpText: 'The Fearmonger chooses a player. Announce that the Fearmonger has chosen a player.',
    subActions: [
      {
        id: 'fearmonger-fn-1',
        description: 'The Fearmonger chooses a player.',
        isConditional: false,
      },
      {
        id: 'fearmonger-fn-2',
        description: 'Announce that the Fearmonger has chosen a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 23,
    helpText:
      'The Fearmonger chooses a player. If the target is different to last night, announce that the Fearmonger has chosen a player.',
    subActions: [
      {
        id: 'fearmonger-on-1',
        description: 'The Fearmonger chooses a player.',
        isConditional: false,
      },
      {
        id: 'fearmonger-on-2',
        description:
          'If the target is different to last night, announce that the Fearmonger has chosen a player.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/fearmongerIcon.webp',
    medium: '/icons/characters/fearmongerIcon.webp',
    large: '/icons/characters/fearmongerIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'fearmonger-fear', text: 'FEAR' }],
  jinxes: [
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Fearmonger ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'vizier',
      description:
        'The Vizier wakes with the Fearmonger, learns who they choose and cannot choose to immediately execute that player.',
    },
  ],
  flavor: 'Beware of gazing long into the Abyss, lest the Abyss also gaze into you.',
  edition: 'carousel',
};
