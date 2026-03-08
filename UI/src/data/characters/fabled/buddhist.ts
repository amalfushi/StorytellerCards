import type { CharacterDef } from '@/types/index.ts';

export const buddhist: CharacterDef = {
  id: 'buddhist',
  name: 'Buddhist',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort: 'For the first 2 minutes of each day, veteran players may not talk.',
  abilityDetailed: `Use the Buddhist to help new players have fun when there are one or two veterans in a group of new players.
• When experienced players find themselves in a game full of beginners, the veterans will often dominate the game due to their enthusiasm and knowledge.
• Players affected by the Buddhist cannot talk at all for the first two minutes of each day. They may not whisper in private, and may not talk to each other. They simply listen.
• This is not a punishment for being talkative. Being talkative is great! Blood on the Clocktower is a talking game, and the more, the merrier. That said, forcing the veterans to stay silent temporarily each day allows the new players to find their own voices, to come up with their own theories, and to take action on their own. It is about fun for everybody.
• It is common for a player to say “I am a Buddhist” or for the Storyteller to say to them “You are a Buddhist.” This doesn’t mean that their character is the Buddhist. It is a pleasant shorthand for saying “You are affected by the Buddhist ability.” This is similar to saying “You are a Revolutionary.”`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Buddhist',
  firstNight: {
    order: 2,
    helpText: 'Announce which players are affected by the Buddhist.',
    subActions: [
      {
        id: 'buddhist-fn-1',
        description: 'Announce which players are affected by the Buddhist.',
        isConditional: false,
      },
    ],
  },
  otherNights: null,
  icon: {
    small: '/icons/characters/buddhistIcon.webp',
    medium: '/icons/characters/buddhistIcon.webp',
    large: '/icons/characters/buddhistIcon.webp',
    placeholder: '#ff9800',
  },
  reminders: [],
  flavor: 'You throw thorns. Falling in my silence, they become flowers.',
  edition: 'fabled',
};
