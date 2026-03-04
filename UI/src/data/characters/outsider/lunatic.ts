import type { CharacterDef } from '@/types/index.ts';

export const lunatic: CharacterDef = {
  id: 'lunatic',
  name: 'Lunatic',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'You think you are a Demon, but you are not. The Demon knows who you are & who you choose at night.',
  abilityDetailed: `The Lunatic thinks that they are the Demon.
• Much like the Drunk, the Lunatic does not know their real character or real alignment. They are woken each night to attack as if they were the Demon that is in play, but their choices have no effect because they have no Demon ability.
• The Lunatic wakes during the first night to learn three bluffs and the appropriate number of Minions, but this information may be wrong.
• The real Demon knows which players the Lunatic chose to attack each night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Lunatic',
  firstNight: {
    order: 16,
    helpText:
      'If there are 7 or more players, wake the Lunatic: Show the THESE ARE YOUR MINIONS token. Point to any players. Show the THESE CHARACTERS ARE NOT IN PLAY token. Show 3 good character tokens. Put the Lunatic to sleep. Wake the Demon. Show the YOU ARE info token and the Demon token. Show the THIS PLAYER IS info token and the Lunatic token, then point to the Lunatic.',
    subActions: [
      {
        id: 'lunatic-fn-1',
        description:
          'If there are 7 or more players, wake the Lunatic: Show the THESE ARE YOUR MINIONS token.',
        isConditional: true,
      },
      {
        id: 'lunatic-fn-2',
        description: 'Point to any players.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-3',
        description: 'Show the THESE CHARACTERS ARE NOT IN PLAY token.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-4',
        description: 'Show 3 good character tokens.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-5',
        description: 'Put the Lunatic to sleep.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-6',
        description: 'Wake the Demon.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-7',
        description: 'Show the YOU ARE info token and the Demon token.',
        isConditional: false,
      },
      {
        id: 'lunatic-fn-8',
        description:
          'Show the THIS PLAYER IS info token and the Lunatic token, then point to the Lunatic.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 28,
    helpText:
      'Do whatever needs to be done to simulate the Demon acting. Put the Lunatic to sleep. Wake the Demon. Show the Lunatic token & point to them, then their target(s).',
    subActions: [
      {
        id: 'lunatic-on-1',
        description: 'Do whatever needs to be done to simulate the Demon acting.',
        isConditional: false,
      },
      {
        id: 'lunatic-on-2',
        description: 'Put the Lunatic to sleep.',
        isConditional: false,
      },
      {
        id: 'lunatic-on-3',
        description: 'Wake the Demon.',
        isConditional: false,
      },
      {
        id: 'lunatic-on-4',
        description: 'Show the Lunatic token & point to them, then their target(s).',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/lunaticIcon.png',
    medium: '/icons/characters/lunaticIcon.png',
    large: '/icons/characters/lunaticIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'lunatic-chosen', text: 'CHOSEN' }],
  jinxes: [
    {
      characterId: 'mathematician',
      description:
        'The Mathematician might learn if the Lunatic attacks a different player than the real Demon attacked.',
    },
  ],
};
