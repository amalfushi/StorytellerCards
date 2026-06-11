import type { Session } from '../types';
import { mockParticipants, mockPlayerState, mockSessionPlayers, mockSlots } from './mockData';

export const STORY_SESSION_ID = 'story-session-1';
export const STORY_GAME_ID = 'story-game-1';

export const mockSession: Session = {
  id: STORY_SESSION_ID,
  name: 'Story Session',
  createdAt: '2026-02-15T00:00:00.000Z',
  defaultScriptId: 'boozling',
  players: mockSessionPlayers,
  template: { slots: mockSlots },
  propagationDefault: { toTemplate: true, toOtherGames: false },
  gameIds: [STORY_GAME_ID],
  version: 1,
  updatedAt: '2026-02-15T00:00:00.000Z',
};

export { mockParticipants, mockPlayerState, mockSlots };
