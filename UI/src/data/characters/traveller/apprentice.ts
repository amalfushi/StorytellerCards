import type { CharacterDef } from '@/types/index.ts';

export const apprentice: CharacterDef = {
  id: 'apprentice',
  name: 'Apprentice',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'On your 1st night, you gain a Townsfolk ability (if good) or a Minion ability (if evil).',
  abilityDetailed: `The Apprentice has either a Townsfolk or a Minion ability.
• A good Apprentice gains a Townsfolk ability. An evil Apprentice gains a Minion ability. They have this ability until they die.
• The Apprentice learns their ability on their first night, and they may act that night if the character whose ability they gain would do so.
• Only abilities listed on the character sheet may be gained.
• If the Apprentice gains an ability that normally only functions on the first night of the game, such as the Grandmother’s, it functions on the Apprentice’s first night instead.
• The Apprentice does not literally become the character whose ability they gain. They are the Apprentice, a Traveller, so they may be exiled but not executed, and they do not count toward the number of alive players to see if evil wins due to just two players being alive. Also, other characters’ abilities that detect characters would detect the Apprentice as the Apprentice.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Apprentice',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/apprenticeIcon.webp',
    medium: '/icons/characters/apprenticeIcon.webp',
    large: '/icons/characters/apprenticeIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'apprentice-istheapprentice', text: 'IS THE APPRENTICE' }],
  flavor:
    'For years have I traveled, studying the ways of The Craft. Which craft, you ask? Simply that of the simple folk. Nothing to worry about. Not yet.',
  edition: 'bmr',
};
