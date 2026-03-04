import type { CharacterDef } from '@/types/index.ts';

export const alsaahir: CharacterDef = {
  id: 'alsaahir',
  name: 'Alsaahir',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Each day, if you publicly guess which players are Minion(s) and which are Demon(s), good wins.',
  abilityDetailed: `The Alsaahir guesses the entire evil team.
• The Alsaahir’s guesses need to be public, and they need to be during the day. They don’t have to guess every day.
• Other players may pretend to be the Alsaahir and make a guess. Like the Juggler or the Gossip, the Storyteller will briefly pretend that player is the Alsaahir.
• If the Alsaahir guesses the Demon player as the Demon, and the Minion players as Minions, the game ends immediately. The Alsaahir must guess all Demon and Minion players.
• The Alsaahir doesn’t need to guess specific minion characters, nor specific Demon characters.
• If there is more than one Demon in play, all Demons must be guessed, including dead Demons.
• If a player is a Minion and Demon, such as Legion, the Alsaahir must guess this player as a Demon.
• Once a guess is made, the Alsaahir cannot change their mind later that day and guess again.
• The Alsaahir needs to guess Minions and Demons, even if they are good, but need not guess which Travellers are evil.
• If the evil team has changed during the game, the Alsaahir must guess the current evil team, not the starting evil team.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Alsaahir',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/alsaahirIcon.png',
    medium: '/icons/characters/alsaahirIcon.png',
    large: '/icons/characters/alsaahirIcon.png',
    placeholder: '#1976d2',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'vizier',
      description: "The Storyteller doesn't declare the Vizier is in play.",
    },
  ],
};
