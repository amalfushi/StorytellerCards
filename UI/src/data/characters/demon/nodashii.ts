import type { CharacterDef } from '@/types/index.ts';

export const nodashii: CharacterDef = {
  id: 'nodashii',
  name: 'No Dashii',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort: 'Each night*, choose a player: they die. Your 2 Townsfolk neighbors are poisoned.',
  abilityDetailed: `The No Dashii poisons their neighboring Townsfolk.
• The No Dashii’s closest clockwise and counterclockwise Townsfolk neighbors are poisoned, regardless of whether they are alive or dead. If a No Dashii dies or otherwise loses their ability, then those two players become healthy. Two Townsfolk players will always be poisoned this way, as neighboring Outsiders, Minions, or Travellers are skipped.
• If a new player becomes the No Dashii, or a poisoned Townsfolk changes into a non-Townsfolk character, the players who are poisoned may change immediately based on who the neighbors of the No Dashii are.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/No_Dashii',
  firstNight: null,
  otherNights: {
    order: 39,
    helpText: 'The No Dashii chooses a player.',
    subActions: [
      {
        id: 'nodashii-on-1',
        description: 'The No Dashii chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/nodashiiIcon.png',
    medium: '/icons/characters/nodashiiIcon.png',
    large: '/icons/characters/nodashiiIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [],
  storytellerSetup: [
    {
      id: 'nodashii-bluffs',
      description: 'Pick 3 not-in-play good characters to show the Demon as bluffs.',
    },
  ],
};
