import type { CharacterDef } from '@/types/index.ts';

export const yaggababble: CharacterDef = {
  id: 'yaggababble',
  name: 'Yaggababble',
  type: 'Demon',
  defaultAlignment: 'Evil',
  abilityShort:
    'You start knowing a secret phrase. For each time you said it publicly today, a player might die.',
  abilityDetailed: `The Yaggababble kills by talking.
• The phrase that the Yaggababble says can be any length, but is usually 2 to 5 words long.
• If the Yaggababble says this phrase, the Storyteller may kill a player any time afterwards, until dawn.
• The Yaggababble may say this phrase as a standalone sentence, or part of another sentence.
• The Yaggababble may say this phrase multiple times per day. If so, the Storyteller may kill multiple players.
• The Storyteller chooses which players die.
• The Storyteller may choose to kill fewer players than the number of times the phrase was said.
• If the Yaggababble is drunk or poisoned, players cannot die, even if the Yaggababble was sober and healthy when they said their phrase. If the Yaggababble is sober and healthy, players might die, even if the Yaggababble was drunk or poisoned when they said their phrase.
• It is rare for the Yaggababble to kill during the day.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Yaggababble',
  firstNight: {
    order: 12,
    helpText: 'Show the Yaggababble their secret phrase.',
    subActions: [
      {
        id: 'yaggababble-fn-1',
        description: 'Show the Yaggababble their secret phrase.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 47,
    helpText: 'For each time the Yaggababble said their phrase today, a player might die.',
    subActions: [
      {
        id: 'yaggababble-on-1',
        description: 'For each time the Yaggababble said their phrase today, a player might die.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/yaggababbleIcon.webp',
    medium: '/icons/characters/yaggababbleIcon.webp',
    large: '/icons/characters/yaggababbleIcon.webp',
    placeholder: '#b71c1c',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'exorcist',
      description:
        'If the Exorcist chooses the Yaggababble, the Yaggababble does not kill tonight.',
    },
  ],
  flavor:
    'Murders inside the Rue Morgue? Фальшивые новости! Hounds on the Baskerville moor? Фальшивые новости! Death while sailing the Nile? Фальшивые новости!',
  edition: 'carousel',
};
