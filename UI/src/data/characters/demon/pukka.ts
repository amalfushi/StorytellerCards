import type { CharacterDef } from '@/types/index.ts';

export const pukka: CharacterDef = {
  id: 'pukka',
  name: 'Pukka',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night, choose a player: they are poisoned. The previously poisoned player dies then becomes healthy.',
  abilityDetailed: `The Pukka poisons its victims, who die at a later time.
• When the Pukka attacks, their victim is poisoned immediately. The next night, just after the Pukka attacks again, that player dies.
• Unlike other Demons, the Pukka acts during the first night.
• The Exorcist prevents the Pukka from waking to poison a player. The Innkeeper prevents the Pukka from killing a poisoned player, then that player is no longer poisoned.
• If the Pukka is drunk and chooses a player, that player does not become poisoned, so does not die the following night.
• If the Pukka was sober when they chose a player the previous night, but is drunk at night, that player does not die. But when the Pukka sobers up, the poison resumes and kills the player at night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Pukka',
  firstNight: {
    order: 41,
    helpText: 'The Pukka chooses a player.',
    subActions: [
      {
        id: 'pukka-fn-1',
        description: 'The Pukka chooses a player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  otherNights: {
    order: 35,
    helpText:
      'The Pukka chooses a player. The previously poisoned player dies then becomes healthy.',
    subActions: [
      {
        id: 'pukka-on-1',
        description: 'The Pukka chooses a player.',
        isConditional: false,
      },
      {
        id: 'pukka-on-2',
        description: 'The previously poisoned player dies then becomes healthy.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/pukkaIcon.webp',
    medium: '/icons/characters/pukkaIcon.webp',
    large: '/icons/characters/pukkaIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'pukka-poisoned', text: 'POISONED' }],
  jinxes: [
    {
      characterId: 'summoner',
      description: 'The Summoner may summon a Pukka on the 2nd night instead of the 3rd.',
    },
  ],
  flavor:
    'You truly have been kind welcoming me into your beautiful home. I am so sorry I accidentally scratched you. A little thing. No matter. But please, take this golden toothpick as a humble token of my regret.',
  edition: 'bmr',
};
