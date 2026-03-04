import type { CharacterDef } from '@/types/index.ts';

export const tor: CharacterDef = {
  id: 'tor',
  name: 'Tor',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort: "Players don't know their character or alignment. They learn them when they die.",
  abilityDetailed: `Tor removes all knowledge of who is who.
• Players do not know which character they are.
• Players do not draw tokens from the bag. The Storyteller puts them directly in the Grimoire at the start of the game.
• Character abilities work as normal. Players are woken and prompted to use their ability if needed.
• When a player dies, they learn their character and alignment. Even if they are drunk or poisoned, this information is correct.
• The Demon and Minions do not know each other.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Tor',
  firstNight: null,
  otherNights: {
    order: 67,
    helpText:
      'If a player died tonight, show the YOU ARE info token, their character token, & a thumbs up or thumbs down.',
    subActions: [
      {
        id: 'tor-on-1',
        description:
          'If a player died tonight, show the YOU ARE info token, their character token, & a thumbs up or thumbs down.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/torIcon.png',
    medium: '/icons/characters/torIcon.png',
    large: '/icons/characters/torIcon.png',
    placeholder: '#558b2f',
  },
  reminders: [],
};
