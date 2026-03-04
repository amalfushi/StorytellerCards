import type { CharacterDef } from '@/types/index.ts';

export const fiddler: CharacterDef = {
  id: 'fiddler',
  name: 'Fiddler',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, the Demon secretly chooses an opposing player: all players choose which of these 2 players win.',
  abilityDetailed: `Use the Fiddler to decide a winner if the game must end due to time constraints or a stalemate.
• Sometimes there won’t be enough time to finish a game. Maybe the venue you are playing at needs to close. Maybe some players need to leave unexpectedly and the game cannot continue without them. Maybe the Townsfolk refuse to execute and the Demon refuses to kill.
• The Storyteller can add and activate the Fiddler at any time. To do so, all players close their eyes while the Demon chooses a good player to challenge to a fiddle contest. Then, after a minute or two, all players will raise their hands to vote on which of these two players wins. The game ends, and the winning player’s entire team wins too.
• Like an exile, this group decision on who wins the game is not affected by abilities, and the dead may vote normally. The Thief cannot steal votes, the Voudon has no effect, and so on.
• Players cannot use their abilities once the Fiddler has been activated. The Slayer cannot choose to slay a player, the Artist cannot ask their question, and so on.
• If this fiddle contest is a tie, evil wins.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fiddler',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/fiddlerIcon.png',
    medium: '/icons/characters/fiddlerIcon.png',
    large: '/icons/characters/fiddlerIcon.png',
    placeholder: '#ff9800',
  },
  reminders: [],
};
