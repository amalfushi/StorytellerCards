import type { CharacterDef } from '@/types/index.ts';

export const professor: CharacterDef = {
  id: 'professor',
  name: 'Professor',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort:
    'Once per game, at night*, choose a dead player: if they are a Townsfolk, they are resurrected.',
  abilityDetailed: `The Professor can bring someone back from the dead.
• Once per game, the Professor can choose a dead player. If that player is a Townsfolk, they are resurrected, becoming alive again.
• If the Professor chooses an Outsider, Minion, or Demon, then nothing happens, and the Professor’s ability is gone.
• The resurrected player regains their ability, even a “once per game” ability they used already.
• Resurrected Townsfolk may or may not get to act on the night of their resurrection, depending on whether they would act before or after the Professor. If they had a “first night only” or “you start knowing” ability, they immediately wake to use it again, as soon as the Professor goes to sleep.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Professor',
  firstNight: null,
  otherNights: {
    order: 58,
    helpText: 'The Professor might choose a dead player.',
    subActions: [
      {
        id: 'professor-on-1',
        description: 'The Professor might choose a dead player.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'deadPlayer', maxSelections: 1, label: 'Choose a dead player' }],
  },
  icon: {
    small: '/icons/characters/professorIcon.webp',
    medium: '/icons/characters/professorIcon.webp',
    large: '/icons/characters/professorIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'professor-alive', text: 'ALIVE' },
    { id: 'professor-noability', text: 'NO ABILITY' },
  ],
  flavor:
    'The process is simple. Attach the hydraulic confabulator to the modified chi matrix amplifier, add 20 CCs of pseudodorafine, keep his Z levels above 20%, and your husband will be fine. Now, all we need is a lightning strike.',
  edition: 'bmr',
};
