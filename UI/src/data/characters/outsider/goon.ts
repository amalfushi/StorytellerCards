import type { CharacterDef } from '@/types/index.ts';

export const goon: CharacterDef = {
  id: 'goon',
  name: 'Goon',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'Each night, the 1st player to choose you with their ability is drunk until dusk. You become their alignment.',
  abilityDetailed: `The Goon is immune to other characters at night, but keeps changing allegiances.
• Each night, the first time a player wakes to use their ability and chooses the Goon, that player becomes drunk immediately. Their ability does not work tonight, nor the next day.
• Later on the same night, if another player wakes to use their ability and chooses the Goon, their ability works as normal.
• The Goon cannot make a player drunk unless the player chose the Goon. The Storyteller choosing the Goon due to an ability, such as the Grandmother’s, doesn’t count.
• As soon as the Goon makes a player drunk, the Goon changes alignment to match theirs. The Goon still changes alignment, and makes the player drunk, if the player choosing the Goon was already drunk or poisoned.
• If chosen by the Assassin, the Goon dies but still turns evil.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Goon',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/goonIcon.webp',
    medium: '/icons/characters/goonIcon.webp',
    large: '/icons/characters/goonIcon.webp',
    placeholder: '#1565c0',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'boffin',
      description: 'If the Demon has the Goon ability, they can’t turn good due to this ability.',
    },
    {
      characterId: 'pithag',
      description:
        "If the Pit-Hag turns an evil player into the Goon, they can't turn good due to their own ability.",
    },
  ],
  flavor:
    "Yes boss. I explained fings real good to dat geezer. He don't want me explain it again. Nah boss, I don't need no doctor - it's only a knife wound. Be right come mornin'",
  edition: 'bmr',
};
