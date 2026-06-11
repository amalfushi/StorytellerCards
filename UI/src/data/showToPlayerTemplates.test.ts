import { describe, expect, it } from 'vitest';
import type { ShowToPlayerMessage, ShowToPlayerTemplate } from '@/types/index.ts';
import {
  getSeededShowToPlayerTemplates,
  rankShowToPlayerTemplates,
} from '@/data/showToPlayerTemplates.ts';

function makeTemplate(overrides: Partial<ShowToPlayerTemplate>): ShowToPlayerTemplate {
  return {
    id: 'template',
    text: 'Template',
    scope: 'script',
    scriptId: 'tb',
    usageCount: 0,
    lastUsedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMessage(overrides: Partial<ShowToPlayerMessage>): ShowToPlayerMessage {
  return {
    id: 'message',
    playerId: 'alice',
    text: 'Message',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('showToPlayerTemplates', () => {
  it('returns seeded templates for known scripts', () => {
    expect(getSeededShowToPlayerTemplates('carousel')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'Quietly stand up and go to the basement' }),
      ]),
    );
  });

  it('ranks by this-game usage, then script usage, then recency', () => {
    const recent = makeTemplate({
      id: 'recent',
      text: 'Recent',
      usageCount: 1,
      lastUsedAt: '2026-02-01T00:00:00.000Z',
    });
    const scriptUsed = makeTemplate({
      id: 'script-used',
      text: 'Script used',
      usageCount: 4,
      lastUsedAt: '2026-01-01T00:00:00.000Z',
    });
    const usedThisGame = makeTemplate({
      id: 'used-this-game',
      text: 'Used this game',
      usageCount: 0,
      lastUsedAt: '2026-01-01T00:00:00.000Z',
    });

    const ranked = rankShowToPlayerTemplates(
      [recent, scriptUsed, usedThisGame],
      [makeMessage({ templateId: 'used-this-game' })],
      'tb',
    );

    expect(ranked.map((template) => template.id)).toEqual([
      'used-this-game',
      'script-used',
      'recent',
    ]);
  });

  it('filters out templates from other scripts while keeping global templates', () => {
    const otherScript = makeTemplate({ id: 'other', scriptId: 'bmr' });
    const global = makeTemplate({ id: 'global', scope: 'global', scriptId: undefined });

    expect(rankShowToPlayerTemplates([otherScript, global], [], 'tb')).toEqual([global]);
  });
});
