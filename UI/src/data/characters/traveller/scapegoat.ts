import type { CharacterDef } from '@/types/index.ts';

export const scapegoat: CharacterDef = {
  id: 'scapegoat',
  name: 'Scapegoat',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort: 'If a player of your alignment is executed, you might be executed instead.',
  abilityDetailed: `The Scapegoat is executed instead of an ally.
• If the Scapegoat is evil, they might die instead of an evil player dying. If the Scapegoat is good, they might die instead of a good player dying. When exactly this happens is up to the Storyteller. This can only happen due to an execution, not death by other means such as a Demon or Slayer.
• The Scapegoat being killed still counts as an execution, so no more nominations occur today.
• As always, players do not learn the alignment of the Scapegoat when they die.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Scapegoat',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/scapegoatIcon.webp',
    medium: '/icons/characters/scapegoatIcon.webp',
    large: '/icons/characters/scapegoatIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [],
  flavor:
    "Good evening! Thank you for inviting me to the ball. I'm not from around here, but you sure seem like a friendly bunch, by golly. I'm sure we'll get along just dandy. What's all that rope for?",
  edition: 'tb',
};
