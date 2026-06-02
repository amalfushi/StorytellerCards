import { useCallback, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import type { CharacterDef, NightOrderEntry, PlayerSeat } from '@/types/index.ts';
import { useGame } from '@/context/useGame.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { FlashcardCarousel } from './FlashcardCarousel.tsx';

export interface NightTabPanelProps {
  entries: NightOrderEntry[];
  players: PlayerSeat[];
  scriptCharacterIds: string[];
  /** Called when the night is completed so the parent can switch back to Day view */
  onComplete?: () => void;
  /** Called when a reminder token is clicked — switches to Day view */
  onReminderTokenClick?: (
    token: import('@/types/index.ts').PlayerToken,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
}

/**
 * Inline night phase panel — renders the FlashcardCarousel within the
 * normal tab content area (no overlay, no fixed positioning).
 *
 * Auto-starts the night if `nightProgress` is null when mounted.
 * Syncs the current card index back to GameContext via `setNightCardIndex`.
 */
export function NightTabPanel({
  entries,
  players,
  scriptCharacterIds,
  onComplete,
  onReminderTokenClick,
}: NightTabPanelProps) {
  const {
    state,
    startNight,
    updateNightProgress,
    completeNight,
    setNightCardIndex,
    addShowMessage,
    markShowMessageShown,
    editShowMessage,
    deleteShowMessage,
    pinShowTemplate,
    unpinShowTemplate,
    bumpTemplateUsage,
    setCustomPlayerMessage,
    clearCustomPlayerMessage,
    recordAlignmentChange,
    setGainedAbility,
  } = useGame();
  const { nightProgress } = state;
  const game = state.game;
  const { getCharacter, getCharactersByIds } = useCharacterLookup();

  // Script characters for choice dropdowns
  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  // Previous night's history entry (for showing last night's selections)
  const previousNightHistory = useMemo(() => {
    if (!game?.nightHistory?.length) return undefined;
    return game.nightHistory[game.nightHistory.length - 1];
  }, [game]);

  // Demon bluff characters for the demoninfo structural card
  const activeSetupPowers = useMemo(
    () => getCharactersByIds([...(game?.activeFabled ?? []), ...(game?.activeLoric ?? [])]),
    [game?.activeFabled, game?.activeLoric, getCharactersByIds],
  );

  const bluffCharacters = useMemo(() => {
    if (!game?.demonBluffs?.length) return undefined;
    return getCharactersByIds(game.demonBluffs);
  }, [game, getCharactersByIds]);

  // Auto-start night if nightProgress is null
  useEffect(() => {
    if (!nightProgress && entries.length > 0) {
      startNight(entries.length);
    }
  }, [nightProgress, entries.length, startNight]);

  /** Toggle a sub-action checkbox. */
  const handleUpdateProgress = useCallback(
    (characterId: string, subActionIndex: number) => {
      if (!nightProgress) return;
      const current =
        nightProgress.subActionStates[characterId] ??
        new Array(entries.find((e) => e.id === characterId)?.subActions.length ?? 0).fill(false);
      const updated = [...current];
      updated[subActionIndex] = !updated[subActionIndex];
      updateNightProgress(characterId, updated);
    },
    [nightProgress, entries, updateNightProgress],
  );

  /** Update notes for a character. */
  const handleUpdateNotes = useCallback(
    (characterId: string, notes: string) => {
      updateNightProgress(characterId, undefined, notes);
    },
    [updateNightProgress],
  );

  /** Update selection for a character. */
  const handleUpdateSelection = useCallback(
    (characterId: string, value: string | string[]) => {
      updateNightProgress(characterId, undefined, undefined, value);
      if (!game || Array.isArray(value) || !value) return;

      const actor = game.players.find((player) => player.characterId === characterId);
      const selectedPlayer = game.players.find((player) => player.playerName === value);
      const selectedCharacter = scriptCharacters.find((character) => character.name === value);
      const nightPhase = game.isFirstNight ? 'first' : 'other';

      if (characterId === 'cultleader' && actor && (value === 'Good' || value === 'Evil')) {
        recordAlignmentChange(
          actor.seat,
          value,
          'Cult Leader matched a living neighbor',
          game.currentDay,
          nightPhase,
        );
        return;
      }
      if (characterId === 'mezepheles' && selectedPlayer) {
        recordAlignmentChange(
          selectedPlayer.seat,
          'Evil',
          'Mezepheles whispered the word',
          game.currentDay,
          nightPhase,
        );
        return;
      }
      if (!selectedCharacter) return;

      const sourceByCharacter = {
        cannibal: 'cannibal',
        pixie: 'pixie',
        philosopher: 'philosopher',
        alchemist: 'alchemist',
      } as const;
      const source = sourceByCharacter[characterId as keyof typeof sourceByCharacter];
      if (actor && source) {
        setGainedAbility(actor.seat, {
          characterId: selectedCharacter.id,
          source,
          hostSeat: actor.seat,
          grantedDay: game.currentDay,
        });
        return;
      }
      if (characterId === 'boffin') {
        const demon = game.players.find(
          (player) => getCharacter(player.characterId)?.type === 'Demon',
        );
        if (demon) {
          setGainedAbility(demon.seat, {
            characterId: selectedCharacter.id,
            source: 'boffin',
            hostSeat: demon.seat,
            grantedDay: game.currentDay,
          });
        }
      }
    },
    [
      game,
      getCharacter,
      recordAlignmentChange,
      scriptCharacters,
      setGainedAbility,
      updateNightProgress,
    ],
  );

  /** Sync card index changes back to context. */
  const handleCardChange = useCallback(
    (index: number) => {
      setNightCardIndex(index);
    },
    [setNightCardIndex],
  );

  /** Complete night and notify parent. */
  const handleComplete = useCallback(() => {
    completeNight();
    onComplete?.();
  }, [completeNight, onComplete]);

  // Wait for night progress to be initialised (auto-start useEffect may be pending)
  if (!nightProgress) return null;

  return (
    <Box
      data-testid="night-tab-panel"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <FlashcardCarousel
        entries={entries}
        players={players}
        characterLookup={getCharacter}
        nightProgress={nightProgress}
        onUpdateProgress={handleUpdateProgress}
        onUpdateNotes={handleUpdateNotes}
        onUpdateSelection={handleUpdateSelection}
        onComplete={handleComplete}
        onCardChange={handleCardChange}
        scriptCharacters={scriptCharacters}
        previousNightHistory={previousNightHistory}
        onReminderTokenClick={onReminderTokenClick}
        bluffCharacters={bluffCharacters}
        playerBluffs={game?.playerBluffs}
        scriptId={game?.scriptId}
        showMessages={game?.showMessages}
        showTemplates={game?.showTemplates}
        onAddShowMessage={
          game
            ? (seat, text, templateId) => addShowMessage(game.id, seat, text, templateId)
            : undefined
        }
        onMarkShowMessageShown={
          game ? (messageId) => markShowMessageShown(game.id, messageId) : undefined
        }
        onEditShowMessage={
          game ? (messageId, text) => editShowMessage(game.id, messageId, text) : undefined
        }
        onDeleteShowMessage={
          game ? (messageId) => deleteShowMessage(game.id, messageId) : undefined
        }
        onPinShowTemplate={
          game
            ? (text, scope, scriptId) => pinShowTemplate(game.id, text, scope, scriptId)
            : undefined
        }
        onUnpinShowTemplate={
          game ? (templateId) => unpinShowTemplate(game.id, templateId) : undefined
        }
        onBumpTemplateUsage={
          game ? (templateId) => bumpTemplateUsage(game.id, templateId) : undefined
        }
        customPlayerMessages={game?.customPlayerMessages}
        activeSetupPowers={activeSetupPowers}
        onCustomMessageChange={setCustomPlayerMessage}
        onClearCustomMessage={clearCustomPlayerMessage}
      />
    </Box>
  );
}
