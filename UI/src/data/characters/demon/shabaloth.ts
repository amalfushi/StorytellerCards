import type { CharacterDef } from '@/types/index.ts';

export const shabaloth: CharacterDef = {
  id: 'shabaloth',
  name: 'Shabaloth',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, choose 2 players: they die. A dead player you chose last night might be regurgitated.',
  abilityDetailed: `The Shabaloth eats two players per night, but may vomit one of them back up the following night.
• Unlike most Demons, the Shabaloth attacks twice per night. The night after the attack, the Storyteller may decide that one of the players attacked by the Shabaloth comes back to life.
• This can be an alive player that was killed, or a dead player that was attacked.
• The regurgitated player regains their ability, even a “once per game” ability already used. If they had a “first night only” or “start knowing” ability, they may use it again.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Shabaloth',
  firstNight: null,
  otherNights: {
    order: 36,
    helpText: 'A previously chosen player might be resurrected. The Shabaloth chooses 2 players.',
    subActions: [
      {
        id: 'shabaloth-on-1',
        description: 'A previously chosen player might be resurrected.',
        isConditional: false,
      },
      {
        id: 'shabaloth-on-2',
        description: 'The Shabaloth chooses 2 players.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
  },
  icon: {
    small: '/icons/characters/shabalothIcon.webp',
    medium: '/icons/characters/shabalothIcon.webp',
    large: '/icons/characters/shabalothIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'shabaloth-alive', text: 'ALIVE' }],
  flavor: "Blarg f'taag nm mataan! No sho gumtha m'sik na yuuu. Fluuuuuuuuurg h-sikkkh.",
  edition: 'bmr',
};
