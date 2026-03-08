import type { CharacterDef } from '@/types/index.ts';

export const psychopath: CharacterDef = {
  id: 'psychopath',
  name: 'Psychopath',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each day, before nominations, you may publicly choose a player: they die. If executed, you only die if you lose roshambo.',
  abilityDetailed: `The Psychopath kills in broad daylight.
• During the day, if the Psychopath declares that they are the Psychopath and publicly chooses a player, that player dies. This can only be done once per day, and only before the Storyteller has called for nominations.
• The Psychopath does not need to use this ability if they don’t want to.
• The Psychopath can be nominated and voted for normally. If the Psychopath is executed, they might not die. They play Roshambo (Paper-Rock-Scissors) with the player that nominated them. The nominator needs to win for the Psychopath to die. Drawing or losing means the Psychopath lives.
• If the Psychopath is executed, this still counts as the one execution for the day. No more players may be nominated or executed today.
• If the Psychopath dies by other means, such as the Demon attacking them, they do not play Roshambo. They die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Psychopath',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/psychopathIcon.webp',
    medium: '/icons/characters/psychopathIcon.webp',
    large: '/icons/characters/psychopathIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'lilmonsta',
      description: "If the Psychopath is babysitting Lil' Monsta, they die when executed.",
    },
  ],
  flavor: 'Surprise!',
  edition: 'carousel',
};
