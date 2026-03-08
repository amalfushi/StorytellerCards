import type { CharacterDef } from '@/types/index.ts';

export const devilsadvocate: CharacterDef = {
  id: 'devilsadvocate',
  name: "Devil's Advocate",
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    "Each night, choose a living player (different to last night): if executed tomorrow, they don't die.",
  abilityDetailed: `The Devil's Advocate saves players from execution.
• Each night, the Devil’s Advocate chooses a player to protect from death by execution. The next day, if that player is executed, the execution succeeds but the player remains alive.
• The Devil’s Advocate cannot choose the same player two nights in a row, whether or not that player was saved from execution today, and they cannot choose a Zombuul that registers as dead.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Devil%27s_Advocate',
  firstNight: {
    order: 34,
    helpText: "The Devil's Advocate chooses a living player.",
    subActions: [
      {
        id: 'devilsadvocate-fn-1',
        description: "The Devil's Advocate chooses a living player.",
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 1, label: 'Choose a living player' }],
  },
  otherNights: {
    order: 19,
    helpText: "The Devil's Advocate chooses a living player.",
    subActions: [
      {
        id: 'devilsadvocate-on-1',
        description: "The Devil's Advocate chooses a living player.",
        isConditional: false,
      },
    ],
    choices: [{ type: 'livingPlayer', maxSelections: 1, label: 'Choose a living player' }],
  },
  icon: {
    small: '/icons/characters/devilsadvocateIcon.webp',
    medium: '/icons/characters/devilsadvocateIcon.webp',
    large: '/icons/characters/devilsadvocateIcon.webp',
    placeholder: '#d32f2f',
  },
  reminders: [{ id: 'devilsadvocate-survivesexecution', text: 'SURVIVES EXECUTION' }],
  flavor:
    "My client, should the objection be overruled, pleads innocent by virtue of the prosecution's non-observance of statute 27.B - incorrect or misleading conjugation of a verb. The fact that nine of the jury died last night is simply prima facie, which is, as Wills vs Thule set precedent for, further reason to acquit.",
  edition: 'bmr',
};
