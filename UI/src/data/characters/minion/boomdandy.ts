import type { CharacterDef } from '@/types/index.ts';

export const boomdandy: CharacterDef = {
  id: 'boomdandy',
  name: 'Boomdandy',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'If you are executed, all but 3 players die. After a 10 to 1 countdown, the player with the most players pointing at them, dies.',
  abilityDetailed: `The Boomdandy explodes when executed, killing most other players.
• If the Boomdandy is executed, the Storyteller kills other players, one at a time, until only three are left alive.
• The Demon will be one of the remaining three players (otherwise, the game would be over).
• Afterward, there is no further nomination or execution today. Instead, the Storyteller counts down from ten and all players point at the player they want to die. When the countdown ends, the Storyteller counts the number of fingers pointed at each player. If it is a tie, the day ends (and evil probably wins due to the Demon killing that night).
• Even dead players who have no vote token may point.
• Players may change who they are pointing at up until the countdown ends, at which point their decision is final.
• The Boomdandy only explodes due to an execution. Deaths by other means, such as via a Golem or a Psychopath, don’t count. If the Boomdandy is executed but doesn’t die (due to a Devil’s Advocate etc.), they still explode.
• If a character can’t die, such as the Fool or the Sailor, the Storyteller may rule that four players remain alive after a Boomdandy explosion.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Boomdandy',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/boomdandyIcon.webp',
    medium: '/icons/characters/boomdandyIcon.webp',
    large: '/icons/characters/boomdandyIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'plaguedoctor',
      description:
        'If the Storyteller would gain the Boomdandy ability, a player becomes the Boomdandy.',
    },
  ],
  flavor: 'Tick... Tick... Tick... TOCK.',
  edition: 'carousel',
};
