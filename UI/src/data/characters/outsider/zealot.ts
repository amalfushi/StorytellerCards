import type { CharacterDef } from '@/types/index.ts';

export const zealot: CharacterDef = {
  id: 'zealot',
  name: 'Zealot',
  type: 'Outsider',
  defaultAlignment: 'Good',
  abilityShort: 'If there are 5 or more players alive, you must vote for every nomination.',
  abilityDetailed: `The Zealot votes.
• If there are 5 or more players alive, the Zealot must vote for every nomination. If there are 4 or fewer players alive, the Zealot can choose whether they vote or not.
• Travellers count as alive players.
• The Zealot can vote like a normal dead player when dead.
• The Zealot does not need to vote for exiles.
• A Zealot must vote even if they think they might be drunk or poisoned.
• It is not the Storyteller's responsibility to monitor the Zealot. They're responsible for their own voting. Deliberately not voting when they should is considered cheating.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Zealot',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/zealotIcon.webp',
    medium: '/icons/characters/zealotIcon.webp',
    large: '/icons/characters/zealotIcon.webp',
    placeholder: '#42a5f5',
  },
  reminders: [],
  jinxes: [
    {
      characterId: 'cannibal',
      description: 'If the Cannibal gains the Zealot ability, the Cannibal learns this.',
    },
    { characterId: 'legion', description: 'The Zealot might register as evil to Legion.' },
    { characterId: 'vizier', description: 'The Zealot might register as evil to the Vizier.' },
  ],
  flavor:
    'I enjoy talking to you. Your mind appeals to me. It resembles my own mind except that you happen to be insane.',
  edition: 'carousel',
};
