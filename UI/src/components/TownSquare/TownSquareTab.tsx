import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import type {
  CharacterDef,
  Alignment,
  PlayerSeat,
  PlayerToken as PlayerTokenType,
} from '@/types/index.ts';
import { Phase } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { PlayerToken, SIZE_MAP } from '@/components/TownSquare/PlayerToken.tsx';
import type { TokenSize } from '@/components/TownSquare/PlayerToken.tsx';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition } from '@/components/TownSquare/TownSquareLayout.tsx';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import { AddTravellerDialog } from '@/components/TownSquare/AddTravellerDialog.tsx';
import { TokenManager, TokenBadges } from '@/components/TownSquare/TokenManager.tsx';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';
import { DayTimerFab } from '@/components/Timer/DayTimerFab.tsx';
import { buildAvailableTokens } from '@/utils/buildAvailableTokens.ts';

/** Persisted layout preference — `'auto'` defers to viewport size. */
type TokenLayoutPref = 'radial' | 'linear' | 'auto';

interface TownSquareTabProps {
  scriptCharacterIds: string[];
  /** Day timer state, lifted from GameViewPage so it persists across tab switches. */
  dayTimer?: UseTimerReturn;
}

/** Derive token size from player count. */
function tokenSizeForCount(count: number): TokenSize {
  if (count <= 8) return 'large';
  if (count <= 14) return 'medium';
  return 'small';
}

/** Half-height of the token card (used as padding inset for the layout). */
const TOKEN_HALF = { large: 75, medium: 70, small: 65 } as const;

/**
 * Town Square tab — the signature circular / ovoid "clock face" layout.
 *
 * - **Phone (< 600 px):** ovoid (taller ellipse) to maximise portrait space.
 * - **Tablet (≥ 600 px):** circle for a natural clock face.
 * - **Day view:** tokens show name + seat + alive/dead; tap opens quick-action menu.
 * - **Night view:** tokens additionally show character icon & name with alignment
 *   border; tap opens `PlayerEditDialog`.
 */
export function TownSquareTab({ scriptCharacterIds, dayTimer }: TownSquareTabProps) {
  const { state, updatePlayer, addTraveller, removeTraveller, addToken, removeToken } = useGame();
  const { getCharacter, getCharactersByIds } = useCharacterLookup();

  const isTablet = useMediaQuery('(min-width:600px)');
  const isSmallViewport = useMediaQuery('(max-width:479px)');
  const shape = isTablet ? 'circle' : 'ovoid';

  // ── Token layout preference (radial / linear / auto) ──
  const [layoutPref, setLayoutPref] = useLocalStorage<TokenLayoutPref>(
    'storyteller-token-layout',
    'auto',
  );

  const effectiveLayout: 'radial' | 'linear' =
    layoutPref === 'auto' ? (isSmallViewport ? 'linear' : 'radial') : layoutPref;

  const handleToggleLayout = useCallback(() => {
    setLayoutPref((prev) => (prev === 'linear' ? 'radial' : 'linear'));
  }, [setLayoutPref]);

  const players = useMemo(() => state.game?.players ?? [], [state.game?.players]);
  const showCharacters = state.showCharacters;
  const isDayPhase = state.game?.currentPhase === Phase.Day;

  const sorted = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  // ── Dynamic token set from active characters ──
  const activeCharacters = useMemo(() => {
    if (!state.game) return [];
    return state.game.players
      .map((p) => getCharacter(p.characterId))
      .filter((c): c is CharacterDef => c !== undefined);
  }, [state.game, getCharacter]);

  const availableTokens = useMemo(() => buildAvailableTokens(activeCharacters), [activeCharacters]);

  const tokenSize = tokenSizeForCount(sorted.length);

  // ── Container sizing via ResizeObserver ──
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims((prev) =>
          prev.width === Math.floor(width) && prev.height === Math.floor(height)
            ? prev
            : { width: Math.floor(width), height: Math.floor(height) },
        );
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Selection / actions modal state ──
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  /** Seat number of the player whose actions modal is open (null = closed). */
  const [actionsSeat, setActionsSeat] = useState<number | null>(null);
  /** Derive the current player from live state so the modal always sees fresh data. */
  const actionsPlayer =
    actionsSeat !== null ? (players.find((p) => p.seat === actionsSeat) ?? null) : null;

  // ── Add traveller dialog ──
  const [addTravellerOpen, setAddTravellerOpen] = useState(false);

  // ── Token manager dialog ──
  const [tokenSeat, setTokenSeat] = useState<number | null>(null);
  /** Derive the current player from live state so the dialog always sees fresh tokens. */
  const tokenPlayer =
    tokenSeat !== null ? (players.find((p) => p.seat === tokenSeat) ?? null) : null;

  // ── Handlers ──

  const handleTokenClick = useCallback(
    (player: PlayerSeat, _event: React.MouseEvent<HTMLElement>) => {
      // Both day and night views open the unified PlayerActionsModal
      setActionsSeat(player.seat);
      setSelectedSeat(player.seat);
    },
    [],
  );

  const handleActionsClose = useCallback(() => {
    setActionsSeat(null);
    setSelectedSeat(null);
  }, []);

  const handleToggleAlive = useCallback(
    (seat: number) => {
      const p = players.find((pl) => pl.seat === seat);
      if (!p) return;
      if (p.alive) {
        // Killing: mark dead, ghostVoteUsed stays false (they get one ghost vote)
        updatePlayer(seat, { alive: false, ghostVoteUsed: false });
      } else {
        // Resurrecting: mark alive, reset ghostVoteUsed
        updatePlayer(seat, { alive: true, ghostVoteUsed: false });
      }
    },
    [players, updatePlayer],
  );

  const handleToggleGhostVote = useCallback(
    (seat: number) => {
      const p = players.find((pl) => pl.seat === seat);
      if (p) updatePlayer(seat, { ghostVoteUsed: !p.ghostVoteUsed });
    },
    [players, updatePlayer],
  );

  const handleRemoveTraveller = useCallback(
    (seat: number) => {
      removeTraveller(seat);
    },
    [removeTraveller],
  );

  const handleSaveCharacter = useCallback(
    (seat: number, updates: { characterId?: string; actualAlignment?: Alignment }) => {
      updatePlayer(seat, updates);
    },
    [updatePlayer],
  );

  const handleManageTokens = useCallback((seat: number) => {
    setTokenSeat(seat);
  }, []);

  const handleAddToken = useCallback(
    (seat: number, token: PlayerTokenType) => {
      addToken(seat, token);
    },
    [addToken],
  );

  const handleRemoveToken = useCallback(
    (seat: number, tokenId: string) => {
      removeToken(seat, tokenId);
    },
    [removeToken],
  );

  const handleAddTraveller = useCallback(
    (seat: number, playerName: string, characterId: string, alignment: 'Good' | 'Evil') => {
      addTraveller(seat, playerName, characterId, alignment);
    },
    [addTraveller],
  );

  // ── Render token callback (memoised) ──

  const centerX = dims.width / 2;
  const centerY = dims.height / 2;

  const renderToken = useCallback(
    (player: PlayerSeat, position: TokenPosition) => {
      const characterDef = player.characterId ? getCharacter(player.characterId) : undefined;
      const playerTokens = player.tokens ?? [];

      return (
        <Box sx={{ position: 'relative' }}>
          <PlayerToken
            player={player}
            characterDef={characterDef}
            showCharacters={showCharacters}
            isSelected={selectedSeat === player.seat}
            onClick={(e: React.MouseEvent<HTMLElement>) => handleTokenClick(player, e)}
            size={tokenSize}
          />
          {showCharacters && playerTokens.length > 0 && (
            <TokenBadges
              tokens={playerTokens}
              tileX={position.x}
              tileY={position.y}
              centerX={centerX}
              centerY={centerY}
              cardWidth={SIZE_MAP[tokenSize].width}
              cardHeight={SIZE_MAP[tokenSize].height}
              tokenLayout={effectiveLayout}
            />
          )}
        </Box>
      );
    },
    [
      getCharacter,
      showCharacters,
      selectedSeat,
      handleTokenClick,
      tokenSize,
      centerX,
      centerY,
      effectiveLayout,
    ],
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 300,
        p: 1,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Circle / Ovoid layout ── */}
      {dims.width > 0 && dims.height > 0 && (
        <TownSquareLayout
          players={sorted}
          renderToken={renderToken}
          shape={shape}
          containerWidth={dims.width}
          containerHeight={dims.height}
          tokenRadius={TOKEN_HALF[tokenSize]}
        />
      )}

      {/* ── Unified player actions modal (day & night views) ── */}
      <PlayerActionsModal
        open={actionsSeat !== null}
        player={actionsPlayer}
        showCharacters={showCharacters}
        scriptCharacters={scriptCharacters}
        onClose={handleActionsClose}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onRemoveTraveller={handleRemoveTraveller}
        onManageTokens={handleManageTokens}
        onSaveCharacter={handleSaveCharacter}
      />

      {/* ── Token layout toggle ── */}
      <Tooltip
        title={effectiveLayout === 'radial' ? 'Switch to linear tokens' : 'Switch to radial tokens'}
      >
        <IconButton
          size="small"
          aria-label="toggle token layout"
          onClick={handleToggleLayout}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.35)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
            width: 32,
            height: 32,
          }}
        >
          {effectiveLayout === 'radial' ? (
            <ScatterPlotIcon fontSize="small" />
          ) : (
            <LinearScaleIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* ── Add Traveller FAB ── */}
      <Fab
        color="primary"
        size="small"
        aria-label="add traveller"
        onClick={() => setAddTravellerOpen(true)}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <AddIcon />
      </Fab>

      {/* ── Add Traveller Dialog ── */}
      <AddTravellerDialog
        key={String(addTravellerOpen)}
        open={addTravellerOpen}
        existingPlayers={players}
        onClose={() => setAddTravellerOpen(false)}
        onAdd={handleAddTraveller}
      />

      {/* ── Token Manager Dialog ── */}
      <TokenManager
        open={tokenPlayer !== null}
        player={tokenPlayer}
        onClose={() => setTokenSeat(null)}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
        characterDef={tokenPlayer?.characterId ? getCharacter(tokenPlayer.characterId) : undefined}
        availableTokens={availableTokens}
      />

      {/* ── Day Timer FAB (visible during Day phase) ── */}
      {isDayPhase && dayTimer && <DayTimerFab timer={dayTimer} />}
    </Box>
  );
}
