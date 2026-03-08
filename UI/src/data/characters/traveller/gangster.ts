import type { CharacterDef } from '@/types/index.ts';

export const gangster: CharacterDef = {
  id: 'gangster',
  name: 'Gangster',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Once per day, you may choose to kill an alive neighbor, if your other alive neighbor agrees.',
  abilityDetailed: `The Gangster encourages their neighbors to kill each other.
• The Gangster may kill one of their two living neighbors. Their dead neighbors are skipped over, and do not count.
• To use their ability, the Gangster and one of their living neighbors must agree to kill the other living neighbor. The Storyteller must hear and confirm this agreement. The Gangster cannot kill without the Storyteller present.
• Each day, the Gangster may say whatever they want, and offer any encouraging words they want to either player. Once an agreement has been reached, then the Gangster may not use their ability again today, even if that player didn’t die due to an ability protecting them.
• The Gangster’s two living neighbors are always one clockwise, and one counter-clockwise.
• If both living neighbors want to kill the other, the Gangster decides who dies.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Gangster',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/gangsterIcon.webp',
    medium: '/icons/characters/gangsterIcon.webp',
    large: '/icons/characters/gangsterIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    'I like your shoes. It would be such a shame if you had a little accident, and they got ruined. Now that you mention it, I like your cufflinks too.',
  edition: 'carousel',
};
