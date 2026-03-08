import type { CharacterDef } from '@/types/index.ts';

export const exorcist: CharacterDef = {
  id: 'exorcist',
  name: 'Exorcist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    "Each night*, choose a player (different to last night): the Demon, if chosen, learns who you are then doesn't wake tonight.",
  abilityDetailed: `The Exorcist prevents the Demon from waking to attack.
• Each night, the Exorcist chooses a player. If they choose a player who is not the Demon, the Demon may still attack. If they choose the Demon, the Demon does not wake tonight, so does not choose players to attack tonight. The Demon learns that they cannot attack and who the Exorcist is.
• Any other Demon abilities still function—such as the Zombuul staying alive if killed, the Pukka killing a player they attacked on a previous night, or the Shabaloth regurgitating a player.
• The Exorcist may not choose the same player two nights in a row.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Exorcist',
  firstNight: null,
  otherNights: {
    order: 29,
    helpText:
      'The Exorcist chooses a player. Put the Exorcist to sleep. If the Exorcist chose the Demon: Wake the Demon. Show the THIS CHARACTER SELECTED YOU & Exorcist tokens. Point to the Exorcist.',
    subActions: [
      {
        id: 'exorcist-on-1',
        description: 'The Exorcist chooses a player.',
        isConditional: false,
      },
      {
        id: 'exorcist-on-2',
        description: 'Put the Exorcist to sleep.',
        isConditional: false,
      },
      {
        id: 'exorcist-on-3',
        description: 'If the Exorcist chose the Demon: Wake the Demon.',
        isConditional: true,
      },
      {
        id: 'exorcist-on-4',
        description: 'Show the THIS CHARACTER SELECTED YOU & Exorcist tokens.',
        isConditional: false,
      },
      {
        id: 'exorcist-on-5',
        description: 'Point to the Exorcist.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/exorcistIcon.webp',
    medium: '/icons/characters/exorcistIcon.webp',
    large: '/icons/characters/exorcistIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'exorcist-chosen', text: 'CHOSEN' }],
  jinxes: [
    {
      characterId: 'leviathan',
      description: 'If the Leviathan nominates and executes the Exorcist-chosen player, good wins.',
    },
    {
      characterId: 'riot',
      description: 'If Riot nominates and executes the Exorcist-chosen player, good wins.',
    },
    {
      characterId: 'yaggababble',
      description:
        'If the Exorcist chooses the Yaggababble, the Yaggababble does not kill tonight.',
    },
  ],
  flavor:
    'We cast you out, every unclean spirit, every satanic power, every onslaught of the infernal adversary, every legion, every diabolical group and sect, in the name and by the power of Our Lord Jesus Christ. We command you, begone and fly far from the Church of God, from the souls made by God in His image and redeemed by the precious blood of the divine Lamb.',
  edition: 'bmr',
};
