import type { CharacterDef } from '@/types/index.ts';

export const mezepheles: CharacterDef = {
  id: 'mezepheles',
  name: 'Mezepheles',
  type: 'Minion',
  defaultAlignment: 'Evil',
  abilityShort:
    'You start knowing a secret word. The 1st good player to say this word becomes evil that night.',
  abilityDetailed: `The Mezepheles offers good players a choice: to turn evil or not.
• On the first night, the Mezepheles learns a secret word from the Storyteller.
• If a good player says this word, either publicly or privately, they turn evil that night. The Storyteller needs to hear this player actually say the word before turning them evil.
• The Mezepheles does not learn if a player turns evil. The good player learns if they turn evil, but not until that night.
• If the Mezepheles is sober and healthy at night, the good player turns evil even if the Mezepheles was drunk or poisoned when the good player spoke the secret word. If the Mezepheles is drunk or poisoned at night when a player would turn evil, the player stays good—the Mezepheles has “used their ability” and may not turn a player evil later on.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Mezepheles',
  firstNight: {
    order: 40,
    helpText: 'Show the secret word.',
    subActions: [
      {
        id: 'mezepheles-fn-1',
        description: 'Show the secret word.',
        isConditional: false,
      },
    ],
  },
  otherNights: {
    order: 25,
    helpText:
      'If a good player said the secret word, wake the player. Show the YOU ARE info token & give a thumbs-down.',
    subActions: [
      {
        id: 'mezepheles-on-1',
        description: 'If a good player said the secret word, wake the player.',
        isConditional: true,
      },
      {
        id: 'mezepheles-on-2',
        description: 'Show the YOU ARE info token & give a thumbs-down.',
        isConditional: false,
      },
    ],
  },
  icon: {
    small: '/icons/characters/mezephelesIcon.webp',
    medium: '/icons/characters/mezephelesIcon.webp',
    large: '/icons/characters/mezephelesIcon.webp',
    placeholder: '#e53935',
  },
  reminders: [],
  flavor: 'That which issues from the heart alone, will bend the hearts of others to your own.',
  edition: 'carousel',
};
