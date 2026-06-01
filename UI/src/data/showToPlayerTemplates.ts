import type { ShowToPlayerMessage, ShowToPlayerTemplate } from '@/types/index.ts';

const BASE_TEMPLATE_DATE = '2026-06-01T00:00:00.000Z';

export const SEEDED_SHOW_TO_PLAYER_TEMPLATES_BY_SCRIPT: Record<string, ShowToPlayerTemplate[]> = {
  tb: [
    {
      id: 'seed-tb-open-eyes',
      text: 'Open your eyes and look at the storyteller',
      scope: 'script',
      scriptId: 'tb',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
    {
      id: 'seed-tb-choose-player',
      text: 'Choose a player by pointing',
      scope: 'script',
      scriptId: 'tb',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
  ],
  bmr: [
    {
      id: 'seed-bmr-choose-player',
      text: 'Choose a player by pointing',
      scope: 'script',
      scriptId: 'bmr',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
    {
      id: 'seed-bmr-stay-awake',
      text: 'Keep your eyes open until the storyteller taps you to sleep',
      scope: 'script',
      scriptId: 'bmr',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
  ],
  snv: [
    {
      id: 'seed-snv-open-eyes',
      text: 'Open your eyes and look at the storyteller',
      scope: 'script',
      scriptId: 'snv',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
    {
      id: 'seed-snv-choose-player',
      text: 'Choose a player by pointing',
      scope: 'script',
      scriptId: 'snv',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
  ],
  carousel: [
    {
      id: 'seed-carousel-basement',
      text: 'Quietly stand up and go to the basement',
      scope: 'script',
      scriptId: 'carousel',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
    {
      id: 'seed-carousel-open-eyes',
      text: 'Open your eyes and look at the storyteller',
      scope: 'script',
      scriptId: 'carousel',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
    {
      id: 'seed-carousel-choose-player',
      text: 'Choose a player by pointing',
      scope: 'script',
      scriptId: 'carousel',
      usageCount: 0,
      lastUsedAt: BASE_TEMPLATE_DATE,
    },
  ],
};

export function getSeededShowToPlayerTemplates(scriptId: string): ShowToPlayerTemplate[] {
  return SEEDED_SHOW_TO_PLAYER_TEMPLATES_BY_SCRIPT[scriptId] ?? [];
}

export function rankShowToPlayerTemplates(
  templates: ShowToPlayerTemplate[],
  currentGameMessages: ShowToPlayerMessage[],
  currentScriptId: string,
): ShowToPlayerTemplate[] {
  const usageThisGame = new Map<string, number>();
  for (const message of currentGameMessages) {
    if (message.templateId) {
      usageThisGame.set(message.templateId, (usageThisGame.get(message.templateId) ?? 0) + 1);
    }
  }

  return [...templates]
    .filter(
      (template) =>
        template.scope === 'global' ||
        (template.scope === 'script' && template.scriptId === currentScriptId),
    )
    .sort((a, b) => {
      const gameUsageDelta = (usageThisGame.get(b.id) ?? 0) - (usageThisGame.get(a.id) ?? 0);
      if (gameUsageDelta !== 0) return gameUsageDelta;

      const scriptUsageDelta = b.usageCount - a.usageCount;
      if (scriptUsageDelta !== 0) return scriptUsageDelta;

      return Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt);
    });
}
