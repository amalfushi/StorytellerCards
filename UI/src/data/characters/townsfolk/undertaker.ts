import type { CharacterDef } from '@/types/index.ts';

export const undertaker: CharacterDef = {
  id: 'undertaker',
  name: 'Undertaker',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Each night*, you learn which character died by execution today.',
  abilityDetailed: `The Undertaker learns which character was executed today.
• The player must have died from execution for the Undertaker to learn who they are. Deaths during the day for other reasons, such as the Gunslinger choosing a player to kill, or the exile of a Traveller, do not count.
• The Undertaker wakes each night except the first, as there have been no executions yet.
• If nobody died today, the Undertaker learns nothing. The Storyteller either does not wake the Undertaker at night, or wakes them but does not show a token.
• If the Drunk is executed, the Undertaker is shown the Drunk character token, not the token for the Townsfolk that the Drunk player thought they were.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Undertaker',
  firstNight: null,
  otherNights: {
    order: 71,
    helpText: 'If a player was executed today, show their character token.',
    subActions: [
      {
        id: 'undertaker-on-1',
        description: 'If a player was executed today, show their character token.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/undertakerIcon.webp',
    medium: '/icons/characters/undertakerIcon.webp',
    large: '/icons/characters/undertakerIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [{ id: 'undertaker-diedtoday', text: 'DIED TODAY' }],
  flavor:
    'Hmmm....what have we here? The left boot is worn down to the heel, with flint shavings under the tongue. This is the garb of a Military man.',
  edition: 'tb',
};
