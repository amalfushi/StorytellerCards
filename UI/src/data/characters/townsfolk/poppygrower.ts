import type { CharacterDef } from '@/types/index.ts';

export const poppygrower: CharacterDef = {
  id: 'poppygrower',
  name: 'Poppy Grower',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Minions & Demons do not know each other. If you die, they learn who each other are that night.',
  abilityDetailed: `The Poppy Grower prevents the evil players from learning who each other are.
• The Demon still learns three not-in-play characters that are safe to bluff as.
• If the Poppy Grower dies, the Demon and Minions learn who each other are, as though it were the first night again.
• If the Poppy Grower becomes drunk or poisoned, Demons and Minions do not suddenly learn who each other are. If the Poppy Grower is drunk or poisoned when they die, Demons and Minions do not learn who each other are, since the Poppy Grower has no ability that night.
• An evil Traveller still learns which player is the Demon when that Traveller enters play.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Poppy_Grower',
  firstNight: {
    order: 11,
    helpText:
      'Skip Minion Info and Demon Info. Wake the Demon. Show the THESE CHARACTERS ARE NOT IN PLAY token. Show 3 not-in-play good character tokens.',
    subActions: [
      {
        id: 'poppygrower-fn-1',
        description: 'Skip Minion Info and Demon Info.',
        isConditional: false,
      },
      {
        id: 'poppygrower-fn-2',
        description: 'Wake the Demon.',
        isConditional: false,
      },
      {
        id: 'poppygrower-fn-3',
        description: 'Show the THESE CHARACTERS ARE NOT IN PLAY token.',
        isConditional: false,
      },
      {
        id: 'poppygrower-fn-4',
        description: 'Show 3 not-in-play good character tokens.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 5,
    helpText:
      'If the Poppy Grower died today or tonight, wake all Minions. Show the THIS IS THE DEMON token. Point to the Demon. Put the Minions to sleep. Wake the Demon. Show the THESE ARE YOUR MINIONS token. Point to the Minions.',
    subActions: [
      {
        id: 'poppygrower-on-1',
        description: 'If the Poppy Grower died today or tonight, wake all Minions.',
        isConditional: true,
      },
      {
        id: 'poppygrower-on-2',
        description: 'Show the THIS IS THE DEMON token.',
        isConditional: false,
      },
      {
        id: 'poppygrower-on-3',
        description: 'Point to the Demon.',
        isConditional: false,
      },
      {
        id: 'poppygrower-on-4',
        description: 'Put the Minions to sleep.',
        isConditional: false,
      },
      {
        id: 'poppygrower-on-5',
        description: 'Wake the Demon.',
        isConditional: false,
      },
      {
        id: 'poppygrower-on-6',
        description: 'Show the THESE ARE YOUR MINIONS token.',
        isConditional: false,
      },
      {
        id: 'poppygrower-on-7',
        description: 'Point to the Minions.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/poppygrowerIcon.png',
    medium: '/icons/characters/poppygrowerIcon.png',
    large: '/icons/characters/poppygrowerIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'poppygrower-evilwakes', text: 'EVIL WAKES' }],
  jinxes: [
    {
      characterId: 'lilmonsta',
      description:
        "If Lil' Monsta & the Poppy Grower are alive, Minions wake one by one, until one of them chooses to take the Lil' Monsta token.",
    },
    {
      characterId: 'spy',
      description: 'If the Poppy Grower has their ability, the Spy does not see the Grimoire.',
    },
    {
      characterId: 'summoner',
      description:
        'If the Poppy Grower is alive on the 3rd night, the Summoner chooses which Demon but not which player.',
    },
    {
      characterId: 'widow',
      description: 'If the Poppy Grower has their ability, the Widow does not see the Grimoire.',
    },
  ],
};
