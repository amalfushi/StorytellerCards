import type { CharacterDef } from '@/types/index.ts';

export const toymaker: CharacterDef = {
  id: 'toymaker',
  name: 'Toymaker',
  type: 'Fabled',
  defaultAlignment: 'Good',
  abilityShort:
    'The Demon may choose not to attack & must do this at least once per game. Evil players get normal starting info.',
  abilityDetailed: `Use the Toymaker to make small games take more time.
• If you created a character list using the Teensyville option in the Script Tool, then you may want to use the Toymaker. Games set in Teensyville have only six Townsfolk, two Outsiders, two Minions, and two Demons on the list, and they specifically cater to five or six players.
• With the Toymaker in play, the Demon learns three not-in-play characters at the start of the game, and the Minion(s) and Demon learn who each other are. Once per game, the Demon must voluntarily choose to attack nobody tonight. If the Demon is about wake to attack a player and this would end the game, but the Demon has not yet chosen to attack nobody, then the Storyteller does not wake the Demon—they are forced to attack nobody tonight.
• You may use the Toymaker in games of Trouble Brewing with five or six players, but it is not necessary.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Toymaker',
  firstNight: {
    order: 3,
    helpText: 'Resolve Minion Info and Demon Info, even though there are fewer than 7 players.',
    subActions: [
      {
        id: 'toymaker-fn-1',
        description:
          'Resolve Minion Info and Demon Info, even though there are fewer than 7 players.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 2,
    helpText:
      'If a Demon attack could end the game, and the Demon is marked FINAL NIGHT: NO ATTACK, do not wake the Demon.',
    subActions: [
      {
        id: 'toymaker-on-1',
        description:
          'If a Demon attack could end the game, and the Demon is marked FINAL NIGHT: NO ATTACK, do not wake the Demon.',
        isConditional: true,
      },
    ],
  },
  icon: {
    small: '/icons/characters/toymakerIcon.png',
    medium: '/icons/characters/toymakerIcon.png',
    large: '/icons/characters/toymakerIcon.png',
    placeholder: '#ff9800',
  },
  reminders: [],
};
