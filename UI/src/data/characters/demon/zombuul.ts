import type { CharacterDef } from '@/types/index.ts';

export const zombuul: CharacterDef = {
  id: 'zombuul',
  name: 'Zombuul',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'Each night*, if no-one died today, choose a player: they die. The 1st time you die, you live but register as dead.',
  abilityDetailed: `The Zombuul secretly remains alive while in the grave.
• When the Zombuul would die for any reason, they actually don’t die, but the Storyteller acts as if they died. The second time the Zombuul dies, they die for real and good wins.
• The seemingly dead Zombuul counts as a dead player in almost every way. The player’s life token on the Town Square flips to indicate their death. The next time they vote, they lose their vote token. They cannot nominate, they may vote with the Voudon, they’re not an alive neighbor for the Tea Lady, and so on. The only differences are that the game continues, the Zombuul still attacks, and the game continues if just two other players are alive.
• The Zombuul only wakes at night to attack if nobody died that day. If a dead player is executed, the player can’t die again, so the Zombuul would still wake.
• If a drunk or poisoned Zombuul dies, good wins. If a “dead” Zombuul becomes drunk or poisoned, do not announce that the player is alive.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Zombuul',
  firstNight: null,
  otherNights: {
    order: 34,
    helpText: 'If no one died today, the Zombuul chooses a player.',
    subActions: [
      {
        id: 'zombuul-on-1',
        description: 'If no one died today, the Zombuul chooses a player.',
        isConditional: true,
      },
    ],
    choices: [{ type: 'player', maxSelections: 1, label: 'Choose a player' }],
  },
  icon: {
    small: '/icons/characters/zombuulIcon.png',
    medium: '/icons/characters/zombuulIcon.png',
    large: '/icons/characters/zombuulIcon.png',
    placeholder: '#b71c1c',
  },
  reminders: [{ id: 'zombuul-diedtoday', text: 'DIED TODAY' }],
  jinxes: [
    {
      characterId: 'summoner',
      description:
        'If the Summoner summons a dead player into the Zombuul, the Zombuul has already "died once".',
    },
  ],
};
