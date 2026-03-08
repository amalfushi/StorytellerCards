import type { CharacterDef } from '@/types/index.ts';

export const angel: CharacterDef = {
  id: 'angel',
  name: 'Angel',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'Something bad might happen to whoever is most responsible for the death of a new player.',
  abilityDetailed: `Use the Angel to help new players have fun when there are one or two new players in a group of veterans.
• Being the only new player in a group can be overwhelming. Being protected by the Angel encourages all players to keep new players alive for as long as possible, which means new players have more fun and contribute to the game more.
• All players know who is protected by the Angel, but not their alignment or character. Whoever is the single player most responsible for killing a protected player suffers some consequence. For example, if the Demon kills a protected player, the Demon suffers a penalty. If a protected player is executed, the player who suffers a penalty will probably be the one who nominated the protected player.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Angel',
  firstNight: {
    order: 1,
    helpText: 'Announce which players are protected by the Angel.',
    subActions: [
      {
        id: 'angel-fn-1',
        description: 'Announce which players are protected by the Angel.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/angelIcon.webp',
    medium: '/icons/characters/angelIcon.webp',
    large: '/icons/characters/angelIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [
    { id: 'angel-protected', text: 'PROTECTED' },
    { id: 'angel-somethingbad', text: 'SOMETHING BAD' },
  ],
  flavor:
    'Let those who are without sin dare to raise their hand to my chosen, for I shall strike such fools down with the fury and righteousness of a thousand storms.',
  edition: 'fabled',
};
