import type { CharacterDef } from '@/types/index.ts';

export const barber: CharacterDef = {
  id: 'barber',
  name: 'Barber',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'If you died today or tonight, the Demon may choose 2 players (not another Demon) to swap characters.',
  abilityDetailed: `The Barber allows the Demon to swap any 2 player's characters.
• The players’ alignments stay the same when they swap characters. Each player learns which character they become.
• The Demon may choose not to swap players.
• If a player becomes a new character, they gain the new ability, even if it was a “you start knowing” ability or a “once per game” ability that the original character already used.
• If there is more than one living Demon, the Storyteller chooses which Demon makes the swap.
• The Demon may choose themself to swap.
• The Demon may not choose another Demon player to swap.
• If a player dies then becomes the Barber, the Demon may not swap two players’ characters tonight.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Barber',
  firstNight: null,
  otherNights: {
    order: 53,
    helpText:
      'If the Barber died today or tonight, show the Demon the THIS CHARACTER SELECTED YOU & Barber tokens. If the Demon chose 2 players, wake one at a time. Show the YOU ARE token & their new character token.',
    subActions: [
      {
        id: 'barber-on-1',
        description:
          'If the Barber died today or tonight, show the Demon the THIS CHARACTER SELECTED YOU & Barber tokens.',
        isConditional: true,
      },
      {
        id: 'barber-on-2',
        description: 'If the Demon chose 2 players, wake one at a time.',
        isConditional: true,
      },
      {
        id: 'barber-on-3',
        description: 'Show the YOU ARE token & their new character token.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/barberIcon.webp',
    medium: '/icons/characters/barberIcon.webp',
    large: '/icons/characters/barberIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [{ id: 'barber-haircutstonight', text: 'HAIRCUTS TONIGHT' }],
  flavor:
    'Did you know that barbery and surgery were once the same profession? No? Well, now you do.',
  edition: 'snv',
};
