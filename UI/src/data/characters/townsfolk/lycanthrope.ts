import type { CharacterDef } from '@/types/index.ts';

export const lycanthrope: CharacterDef = {
  id: 'lycanthrope',
  name: 'Lycanthrope',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night*, choose an alive player. If good, they die & the Demon doesn’t kill tonight. One good player registers as evil.',
  abilityDetailed: `The Lycanthrope roams at night, killing the innocent, whilst the Demon cowers indoors.
• The Lycanthrope must choose an alive player each night. If the Lycanthrope chooses a dead player, the Storyteller shakes their head no and prompts the Lycanthrope to choose a different player.
• If the player that the Lycanthrope chooses is good, that player dies, and the Demon cannot kill tonight.
• If the player the Lycanthrope attacks is evil, that player does not die, and the Demon may still kill tonight.
• If the Lycanthrope attacks a good player but that good player doesn’t die, the Demon may still kill tonight.
• While the Lycanthrope lives, one good player registers as evil. They cannot be killed by the Lycanthrope.
• This evil-registration does not effect win conditions. The good player that registers as evil still wins or loses with the good team.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Lycanthrope',
  firstNight: null,
  otherNights: {
    order: 30,
    helpText: 'The Lycanthrope chooses a player.',
    subActions: [
      {
        id: 'lycanthrope-on-1',
        description: 'The Lycanthrope chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/lycanthropeIcon.png',
    medium: '/icons/characters/lycanthropeIcon.png',
    large: '/icons/characters/lycanthropeIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'lycanthrope-fauxpaw', text: 'FAUX PAW' }],
};
