import type { CharacterDef } from '@/types/index.ts';

export const assassin: CharacterDef = {
  id: 'assassin',
  name: 'Assassin',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Once per game, at night*, choose a player: they die, even if for some reason they could not.',
  abilityDetailed: `The Assassin kills who the Demon cannot.
• Once per game at night, the Assassin can kill a player. This player dies, even if they are protected from death in any way, such as from an ability.
• The Assassin ability is affected by drunkenness and poisoning, as normal.
• If the Assassin attacks the Goon, the Goon dies and turns evil.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Assassin',
  firstNight: null,
  otherNights: {
    order: 49,
    helpText: 'The Assassin might choose a player.',
    subActions: [
      {
        id: 'assassin-on-1',
        description: 'The Assassin might choose a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/assassinIcon.png',
    medium: '/icons/characters/assassinIcon.png',
    large: '/icons/characters/assassinIcon.png',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'assassin-noability', text: 'NO ABILITY' }],
};
