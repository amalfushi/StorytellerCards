import type { CharacterDef } from '@/types/index.ts';

export const zenomancer: CharacterDef = {
  id: 'zenomancer',
  name: 'Zenomancer',
  type: 'Loric',
  defaultAlignment: 'Good',
  abilityShort:
    'One or more players each have a goal. When achieved, that player learns a piece of true info.',
  abilityDetailed: `The Zenomancer gives mini quests.
• One or more players may be given goals by the Storyteller. These goals are given privately. They may be given goals at the beginning of the game, or at some time during the game. Different players may be given goals at different times.
• A goal can be anything. It can be something to do with the game, or something beyond the game.
• The Storyteller is the judge of when a goal is achieved. When this happens, the player learns one piece of information about the game. This is true even if they are drunk or poisoned, since this is due to the Zenomancer, not their character.
• Goals may clash, or may not be achieved.
• Usually, 1 to 3 goals will be given throughout the game, and most goals will be given at the beginning of the game.
• Players may bluff that they have been given goals, or bluff that they have achieved a goal.
• Any player may be given a goal, even Travellers and dead players.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Zenomancer',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/zenomancerIcon.webp',
    medium: '/icons/characters/zenomancerIcon.webp',
    large: '/icons/characters/zenomancerIcon.webp',
    placeholder: '#558b2f',
  },
  reminders: [{ id: 'zenomancer-goal', text: 'GOAL' }],
  flavor:
    'The universe is a verb not a noun, they say, and it is turtles, turtles all the way down. Turtles all the way down, my friend, turtles all the way down.',
  edition: 'loric',
};
