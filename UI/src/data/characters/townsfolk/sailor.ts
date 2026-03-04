import type { CharacterDef } from '@/types/index.ts';

export const sailor: CharacterDef = {
  id: 'sailor',
  name: 'Sailor',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    "Each night, choose an alive player: either you or they are drunk until dusk. You can't die.",
  abilityDetailed: `The Sailor is either drunk or getting somebody else drunk. While the Sailor is sober, they can't die.
• Each night, the Sailor chooses a player, who will probably get drunk.
• If they choose themself, they lose their “cannot die” ability until they become sober.
• If the Sailor chooses a dead player accidentally, the Storyteller prompts them to choose again.
• If the Sailor chooses another player, the Storyteller chooses which player is drunk. If they choose a Townsfolk, the Storyteller will usually make the Townsfolk drunk, but if an Outsider, a Minion, or the Demon is chosen, then the Storyteller will usually make the Sailor the drunk one.
• While sober, the Sailor cannot die, even if they have not yet woken at night to go drinking.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Sailor',
  firstNight: {
    order: 20,
    helpText: 'The Sailor chooses a living player.',
    subActions: [
      {
        id: 'sailor-fn-1',
        description: 'The Sailor chooses a living player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 1, label: 'Choose a living player' }],
  },
  otherNights: {
    order: 6,
    helpText: 'The Sailor chooses a living player.',
    subActions: [
      {
        id: 'sailor-on-1',
        description: 'The Sailor chooses a living player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 1, label: 'Choose a living player' }],
  },
  icon: {
    small: '/icons/characters/sailorIcon.png',
    medium: '/icons/characters/sailorIcon.png',
    large: '/icons/characters/sailorIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'sailor-drunk', text: 'DRUNK' }],
};
