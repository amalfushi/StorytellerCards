import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type {
  CharacterDef,
  Alignment,
  PlayerSeat,
  PlayerToken as PlayerTokenType,
} from '@/types/index.ts';
import { useGame } from '@/context/useGame.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { PlayerToken, SIZE_MAP } from '@/components/TownSquare/PlayerToken.tsx';
import type { TokenSize } from '@/components/TownSquare/PlayerToken.tsx';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition } from '@/components/TownSquare/TownSquareLayout.tsx';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import { TokenManager, TokenBadges } from '@/components/TownSquare/TokenManager.tsx';
import { buildAvailableTokens } from '@/utils/buildAvailableTokens.ts';
import { ReseatTool } from '@/components/common/ReseatTool.tsx';

/** Persisted layout preference — `'auto'` defers to viewport size. */
type TokenLayoutPref = 'radial' | 'linear' | 'auto';

interface TownSquareTabProps {
  scriptCharacterIds: string[];
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
export function TownSquareTab({ scriptCharacterIds }: TownSquareTabProps) {
  const {
    state,
    updatePlayer,
    removeTraveller,
    addToken,
    removeToken,
    swapPlayerSeats,
    setPlayerBluffs,
  } = useGame();
  const { getCharacter, getCharactersByIds, allCharacters } = useCharacterLookup();

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
  const showMessageCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const message of state.game?.showMessages ?? []) {
      if (!message.lastShownAt) {
        counts.set(message.seat, (counts.get(message.seat) ?? 0) + 1);
      }
    }
    return counts;
  }, [state.game?.showMessages]);

  const sorted = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  // ── Dynamic token set from active characters ──
  const activeSetupPowers = useMemo(
    () =>
      [...(state.game?.activeFabled ?? []), ...(state.game?.activeLoric ?? [])]
        .map((id) => getCharacter(id))
        .filter((character): character is CharacterDef => character !== undefined),
    [state.game?.activeFabled, state.game?.activeLoric, getCharacter],
  );

  const activeCharacters = useMemo(() => {
    if (!state.game) return activeSetupPowers;
    const playerCharacters = state.game.players
      .map((p) => getCharacter(p.characterId))
      .filter((c): c is CharacterDef => c !== undefined);
    return [...playerCharacters, ...activeSetupPowers];
  }, [state.game, getCharacter, activeSetupPowers]);

  // Apparent characters for concealed identities (Drunk/Marionette)
  const apparentCharacters = useMemo(() => {
    if (!state.game) return [];
    return state.game.players
      .filter((p) => p.apparentCharacterId)
      .map((p) => getCharacter(p.apparentCharacterId!))
      .filter((c): c is CharacterDef => c !== undefined);
  }, [state.game, getCharacter]);

  const availableTokens = useMemo(
    () => buildAvailableTokens(activeCharacters, apparentCharacters),
    [activeCharacters, apparentCharacters],
  );

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
  /** Seat number of the player initiating a swap (null = not in swap mode). */
  const [swapSourceSeat, setSwapSourceSeat] = useState<number | null>(null);
  const [reseatInitialSeat, setReseatInitialSeat] = useState<number | null>(null);
  const [reseatOpen, setReseatOpen] = useState(false);
  /** Derive the current player from live state so the modal always sees fresh data. */
  const actionsPlayer =
    actionsSeat !== null ? (players.find((p) => p.seat === actionsSeat) ?? null) : null;

  // ── Bluff props for the actions modal ──
  const actionsPlayerCharDef = actionsPlayer?.characterId
    ? getCharacter(actionsPlayer.characterId)
    : undefined;
  const isActionsPlayerDemon = actionsPlayerCharDef?.type === 'Demon';
  const isActionsPlayerLunatic = actionsPlayer?.characterId === 'lunatic';
  const showBluffsForPlayer = isActionsPlayerDemon || isActionsPlayerLunatic;

  const bluffIds = actionsPlayer
    ? state.game?.playerBluffs?.[String(actionsPlayer.seat)]
    : undefined;

  const modalBluffCharacters = useMemo(
    () => (bluffIds?.length ? getCharactersByIds(bluffIds) : undefined),
    [bluffIds, getCharactersByIds],
  );

  const modalAvailableBluffCharacters = useMemo(() => {
    if (!showBluffsForPlayer) return undefined;
    const inPlay = new Set(state.game?.inPlayCharacterIds ?? []);
    return scriptCharacters.filter((ch) => {
      if (ch.type !== 'Townsfolk' && ch.type !== 'Outsider') return false;
      if (isActionsPlayerLunatic) return true;
      return !inPlay.has(ch.id);
    });
  }, [
    showBluffsForPlayer,
    isActionsPlayerLunatic,
    scriptCharacters,
    state.game?.inPlayCharacterIds,
  ]);

  const handleChangeBluff = useCallback(
    (oldBluffId: string, newBluffId: string) => {
      if (!actionsPlayer) return;
      const currentBluffs = bluffIds ?? [];
      const updated = currentBluffs.map((id) => (id === oldBluffId ? newBluffId : id));
      setPlayerBluffs(actionsPlayer.seat, updated);
    },
    [actionsPlayer, bluffIds, setPlayerBluffs],
  );

  const modalBluffLabel = isActionsPlayerLunatic ? 'Lunatic Bluffs' : 'Demon Bluffs';

  // ── Token manager dialog ──
  const [tokenSeat, setTokenSeat] = useState<number | null>(null);
  /** Derive the current player from live state so the dialog always sees fresh tokens. */
  const tokenPlayer =
    tokenSeat !== null ? (players.find((p) => p.seat === tokenSeat) ?? null) : null;

  // ── Handlers ──

  const handleTokenClick = useCallback(
    (player: PlayerSeat, _event: React.MouseEvent<HTMLElement>) => {
      if (swapSourceSeat !== null) {
        // In swap mode — complete the swap
        if (player.seat !== swapSourceSeat) {
          swapPlayerSeats(swapSourceSeat, player.seat);
        }
        setSwapSourceSeat(null);
        setSelectedSeat(null);
        return;
      }
      // Normal mode — open PlayerActionsModal
      setActionsSeat(player.seat);
      setSelectedSeat(player.seat);
    },
    [swapSourceSeat, swapPlayerSeats],
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

  const handleSwapWith = useCallback((seat: number) => {
    setSwapSourceSeat(seat);
    setSelectedSeat(seat);
  }, []);

  const handleOpenReseat = useCallback((seat: number) => {
    setReseatInitialSeat(seat);
    setReseatOpen(true);
  }, []);

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

  // ── Render token callback (memoised) ──

  const centerX = dims.width / 2;
  const centerY = dims.height / 2;

  const renderToken = useCallback(
    (player: PlayerSeat, position: TokenPosition) => {
      const characterDef = player.characterId ? getCharacter(player.characterId) : undefined;
      const apparentCharacterDef = player.apparentCharacterId
        ? getCharacter(player.apparentCharacterId)
        : undefined;
      const playerTokens = player.tokens ?? [];
      const showMessageCount = showMessageCounts.get(player.seat) ?? 0;

      return (
        <Box sx={{ position: 'relative' }}>
          <PlayerToken
            player={player}
            characterDef={characterDef}
            apparentCharacterDef={apparentCharacterDef}
            showCharacters={showCharacters}
            isSelected={selectedSeat === player.seat}
            onClick={(e: React.MouseEvent<HTMLElement>) => handleTokenClick(player, e)}
            size={tokenSize}
          />
          {showMessageCount > 0 && (
            <Box
              aria-label={`${showMessageCount} active show messages`}
              data-testid={`show-message-badge-${player.seat}`}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 20,
                height: 20,
                px: 0.5,
                borderRadius: 10,
                bgcolor: '#90caf9',
                color: '#0d1117',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              }}
            >
              {showMessageCount}
            </Box>
          )}
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
      showMessageCounts,
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
      {/* ── Swap mode indicator ── */}
      {swapSourceSeat !== null && (
        <Chip
          icon={<SwapHorizIcon />}
          label={`Tap a player to swap with Seat ${swapSourceSeat}`}
          onDelete={() => {
            setSwapSourceSeat(null);
            setSelectedSeat(null);
          }}
          color="warning"
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
          data-testid="swap-mode-indicator"
        />
      )}

      {/* ── Circle / Ovoid layout ── */}
      {dims.width > 0 && dims.height > 0 && (
        <TownSquareLayout
          players={sorted}
          renderToken={renderToken}
          shape={shape}
          containerWidth={dims.width}
          containerHeight={dims.height}
          tokenRadius={TOKEN_HALF[tokenSize]}
          tokenLayout={effectiveLayout}
          activeFabled={(state.game?.activeFabled ?? [])
            .map((id) => getCharacter(id))
            .filter((character): character is CharacterDef => character !== undefined)}
          activeLoric={(state.game?.activeLoric ?? [])
            .map((id) => getCharacter(id))
            .filter((character): character is CharacterDef => character !== undefined)}
        />
      )}

      {/* ── Unified player actions modal (day & night views) ── */}
      <PlayerActionsModal
        open={actionsSeat !== null}
        player={actionsPlayer}
        showCharacters={showCharacters}
        scriptCharacters={scriptCharacters}
        allCharacters={allCharacters}
        demonBluffs={bluffIds}
        bluffCharacters={modalBluffCharacters}
        availableBluffCharacters={modalAvailableBluffCharacters}
        bluffLabel={modalBluffLabel}
        onClose={handleActionsClose}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onRemoveTraveller={handleRemoveTraveller}
        onManageTokens={handleManageTokens}
        onSaveCharacter={handleSaveCharacter}
        onReseat={handleOpenReseat}
        onSwapWith={handleSwapWith}
        onChangeBluff={handleChangeBluff}
      />

      <ReseatTool
        open={reseatOpen}
        players={players}
        initialSeat={reseatInitialSeat}
        onClose={() => setReseatOpen(false)}
        onConfirmSwap={swapPlayerSeats}
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

      {/* ── Token Manager Dialog ── */}
      <TokenManager
        open={tokenPlayer !== null}
        player={tokenPlayer}
        onClose={() => setTokenSeat(null)}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
        characterDef={tokenPlayer?.characterId ? getCharacter(tokenPlayer.characterId) : undefined}
        availableTokens={availableTokens}
        allPlayers={players}
      />
    </Box>
  );
}
