import type { CharacterDef } from '@/types/index.ts';

export const moonchild: CharacterDef = {
  id: 'moonchild',
  name: 'Moonchild',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort:
    'When you learn that you died, publicly choose 1 alive player. Tonight, if it was a good player, they die.',
  abilityDetailed: `The Moonchild curses someone upon death, killing them too.
• The Moonchild must choose a player within a minute or two of learning that they are dead, whether by an execution or at dawn when the Storyteller declares who died at night. The Moonchild can take their time and get advice from the group before making this decision.
• If the Moonchild chooses a good player, that player dies tonight. If they choose an evil player, nothing happens.
• As always, play along if an evil player is bluffing as the Moonchild and pretends to use their ability.
• It is not the Storyteller’s responsibility to prompt the Moonchild to choose a player. The Moonchild must do this shortly after they learn that they are dead. Deliberately not doing so is considered cheating.
• If the Moonchild is sober and healthy at night but was drunk or poisoned when they chose a player today, that player dies. If the Moonchild is drunk or poisoned at night but was sober and healthy when they chose a player today, that player doesn’t die.
• The Moonchild kills the Goon if the Goon was good when the Moonchild chose them, regardless of the Goon’s alignment at night.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Moonchild',
  firstNight: null,
  otherNights: {
    order: 65,
    helpText: 'If the Moonchild is due to kill a good player, they die.',
    subActions: [
      {
        id: 'moonchild-on-1',
        description: 'If the Moonchild is due to kill a good player, they die.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/moonchildIcon.png',
    medium: '/icons/characters/moonchildIcon.png',
    large: '/icons/characters/moonchildIcon.png',
    placeholder: '#42a5f5',
  },
  reminders: [],
};
