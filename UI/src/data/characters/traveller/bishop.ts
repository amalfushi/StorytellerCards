import type { CharacterDef } from '@/types/index.ts';

export const bishop: CharacterDef = {
  id: 'bishop',
  name: 'Bishop',
  type: 'Traveller',
  defaultAlignment: 'Unknown',
  abilityShort:
    'Only the Storyteller can nominate. At least 1 opposing player must be nominated each day.',
  abilityDetailed: `The Bishop prevents players from nominating at all. Instead, the Storyteller does all nominating.
• The Storyteller makes nominations during the nomination process instead of the players, and the Storyteller may nominate as few or as many players as they wish. To make things fair, they must nominate at least one player whose alignment is opposite the Bishop’s alignment each day.
• The Bishop does not alter who can and cannot vote. Each player may do so normally.
• Since Travellers are exiled, not executed, any player may call for the Bishop or another Traveller to be exiled.`,
  wikiLink: 'https://wiki.bloodontheclocktower.com/Bishop',
  firstNight: null,
  otherNights: null,
  icon: {
    small: '/icons/characters/bishopIcon.webp',
    medium: '/icons/characters/bishopIcon.webp',
    large: '/icons/characters/bishopIcon.webp',
    placeholder: '#1976d2',
  },
  reminders: [
    { id: 'bishop-nominateevil', text: 'NOMINATE EVIL' },
    { id: 'bishop-nominategood', text: 'NOMINATE GOOD' },
  ],
  flavor: 'In nomine Patris, et Filii, et Spiritus Sancti… Nos mos Dei. Deus vult de nobis.',
  edition: 'bmr',
};
