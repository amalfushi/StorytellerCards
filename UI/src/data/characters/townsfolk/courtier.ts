import type { CharacterDef } from '@/types/index.ts';

export const courtier: CharacterDef = {
  id: 'courtier',
  name: 'Courtier',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night, choose a character: they are drunk for 3 nights & 3 days.',
  abilityDetailed: `The Courtier gets a character drunk, without knowing which player it is.
• Once per game, the Courtier chooses a character to be drunk for three nights and three days, starting immediately.
• The Courtier does not learn if they were successful or not, so they might choose a character that is not in play.
• The Courtier chooses a character, not a player. The Courtier player may need to be reminded of this. Evil players bluffing as the Courtier may also need to be reminded.
• If the drunk or poisoned Courtier chooses a character, that character is not drunk, even if the Courtier later becomes sober and healthy. If the Courtier made a character drunk, but the Courtier becomes drunk or poisoned, the player they made drunk becomes sober again. If the Courtier becomes sober and healthy again before the three nights and three days have ended, that player becomes drunk yet again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Courtier',
  firstNight: {
    order: 29,
    helpText: 'The Courtier might choose a character.',
    subActions: [
      {
        id: 'courtier-fn-1',
        description: 'The Courtier might choose a character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  otherNights: {
    order: 11,
    helpText: 'The Courtier might choose a character.',
    subActions: [
      {
        id: 'courtier-on-1',
        description: 'The Courtier might choose a character.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'character', maxSelections: 1, label: 'Choose a character' }],
  },
  icon: {
    small: '/icons/characters/courtierIcon.png',
    medium: '/icons/characters/courtierIcon.png',
    large: '/icons/characters/courtierIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'courtier-noability', text: 'NO ABILITY' }],
  jinxes: [
    {
      characterId: 'summoner',
      description:
        'If the living Summoner has no ability, the Storyteller has the Summoner ability.',
    },
    {
      characterId: 'vizier',
      description:
        'If the Vizier loses their ability, they learn this, and cannot die during the day.',
    },
  ],
};
