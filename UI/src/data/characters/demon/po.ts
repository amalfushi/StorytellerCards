import type { CharacterDef } from '@/types/index.ts';

export const po: CharacterDef = {
  id: 'po',
  name: 'Po',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, you may choose a player: they die. If your last choice was no-one, choose 3 players tonight.',
  abilityDetailed: `The Po can choose to attack nobody at night, but goes on a rampage the following night.
• The Po attacks one player per night, like many other Demons. However, if the Po chooses to attack nobody, then they may attack three players the following night.
• If the Po was drunk or poisoned when they chose nobody last night, they still choose three players tonight.
• A Po must choose three players when prompted to do so. They cannot choose no one again.
• The Po only gets three attacks if they chose nobody. The Po does not get three attacks if they chose to attack someone the previous night, but that player did not die.
• The Po doesn’t act on the first night, but this night does not count as a night where the Po “chose no one.”
• If the Exorcist selects the Po, the Po does not act, but this night does not count as a night where the Po “chose no one.” However, if the Po chose no one the night before the Exorcist chose the Po, the Po chooses three players the night after the Exorcist chose the Po, because their last choice was no one.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Po',
  firstNight: null,
  otherNights: {
    order: 37,
    helpText: 'The Po may choose a player OR chooses 3 players if they chose no-one last night.',
    subActions: [
      {
        id: 'po-on-1',
        description:
          'The Po may choose a player OR chooses 3 players if they chose no-one last night.',
        isConditional: false,
      },
    ],
    choices: [{ type: 'player', maxSelections: 3, label: 'Choose 3 players' }],
  },
  icon: {
    small: '/icons/characters/poIcon.webp',
    medium: '/icons/characters/poIcon.webp',
    large: '/icons/characters/poIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  flavor: "Would you like a flower? I'm so lonely.",
  edition: 'bmr',
};
