import type { CharacterDef } from '@/types/index.ts';

export const plaguedoctor: CharacterDef = {
  id: 'plaguedoctor',
  name: 'Plague Doctor',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'When you die, the Storyteller gains a Minion ability.',
  abilityDetailed: `The Plague Doctor brings an extra Minion ability into play.
• The Storyteller chooses which Minion ability is gained.
• This ability is in effect for the rest of the game.
• Nothing else changes for the Storyteller – they don’t become evil, they don’t become a player, they are not a legitimate player to be targeted by other abilities, and they cannot vote or nominate.
• If the Plague Doctor is drunk or poisoned when they die, the Storyteller doesn’t gain a Minion ability, even when the Plague Doctor becomes sober and healthy.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Plague_Doctor',
  firstNight: null,
  otherNights: {
    order: 55,
    helpText:
      "If the Plague Doctor died, the Storyteller gained a Minion ability. If you haven't done this yet, do so now.",
    subActions: [
      {
        id: 'plaguedoctor-on-1',
        description: 'If the Plague Doctor died, the Storyteller gained a Minion ability.',
        isConditional: true,
      },
      {
        id: 'plaguedoctor-on-2',
        description: "If you haven't done this yet, do so now.",
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/plaguedoctorIcon.webp',
    medium: '/icons/characters/plaguedoctorIcon.webp',
    large: '/icons/characters/plaguedoctorIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'plaguedoctor-storytellerability', text: 'STORYTELLER ABILITY' }],
  jinxes: [
    {
      characterId: 'baron',
      description:
        'If the Storyteller would gain the Baron ability, up to two players become Outsiders.',
    },
    {
      characterId: 'boomdandy',
      description:
        'If the Storyteller would gain the Boomdandy ability, a player becomes the Boomdandy.',
    },
    {
      characterId: 'eviltwin',
      description:
        'If the Storyteller would gain the Evil Twin ability, a player becomes the Evil Twin.',
    },
    {
      characterId: 'fearmonger',
      description:
        'If the Storyteller would gain the Fearmonger ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'goblin',
      description:
        'If the Storyteller would gain the Goblin ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'marionette',
      description:
        "If the Storyteller would gain the Marionette ability, one of the Demon's good neighbors becomes the Marionette.",
    },
    {
      characterId: 'scarletwoman',
      description:
        'If the Storyteller would gain the Scarlet Woman ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'spy',
      description:
        'If the Storyteller would gain the Spy ability, a Minion gains it, and learns this.',
    },
    {
      characterId: 'wraith',
      description:
        'If the Storyteller would gain the Wraith ability, a Minion gains it, and learns this.',
    },
  ],
  flavor: 'Pleauze shtay shtill. Thinks nid tiime for hillink. Myrhh-myrhh.',
  edition: 'carousel',
};
