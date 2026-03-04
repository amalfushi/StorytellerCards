import type { CharacterDef } from '@/types/index.ts';

export const atheist: CharacterDef = {
  id: 'atheist',
  name: 'Atheist',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'The Storyteller can break the game rules, and if executed, good wins, even if you are dead. [No evil characters]',
  abilityDetailed: `The Atheist knows that all players are good and there is no such thing as Demons.
• With the Atheist in play, there are no evil players—no Minions and no Demons.
• Good wins if the Storyteller is executed. Any living player may nominate the Storyteller, and the Storyteller is executed if 50% or more of the living players vote.
• If the Atheist is not in play and the Storyteller is executed, evil wins.
• Good loses if just two players are alive.
• The Storyteller may break any of the game’s rules. They may kill a player who nominated to simulate a Witch curse, kill players at night to simulate a Demon attacking, give players false information to simulate drunkenness, change characters at night to simulate a Pit-Hag, or even have the wrong number of Outsiders in play.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Atheist',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/atheistIcon.png',
    medium: '/icons/characters/atheistIcon.png',
    large: '/icons/characters/atheistIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'riot',
      description:
        'During a riot, if the Storyteller is nominated, players vote. If they are "about to die", the game ends. If not, they nominate again.',
    },
  ],
};
