import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import type {
  CharacterDef,
  Alignment,
  PlayerSeat,
  PlayerToken as PlayerTokenType,
} from '@/types/index.ts';
import { Phase } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { PlayerEditDialog } from '@/components/PlayerList/PlayerEditDialog.tsx';
import { PlayerToken } from '@/components/TownSquare/PlayerToken.tsx';
import type { TokenSize } from '@/components/TownSquare/PlayerToken.tsx';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition } from '@/components/TownSquare/TownSquareLayout.tsx';
import { PlayerQuickActions } from '@/components/TownSquare/PlayerQuickActions.tsx';
import { AddTravellerDialog } from '@/components/TownSquare/AddTravellerDialog.tsx';
import { TokenManager, TokenBadges } from '@/components/TownSquare/TokenManager.tsx';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';
import { DayTimerFab } from '@/components/Timer/DayTimerFab.tsx';

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

/** Half-size of the token box (used as padding inset for the layout). */
const TOKEN_HALF = { large: 36, medium: 30, small: 24 } as const;

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
  const shape = isTablet ? 'circle' : 'ovoid';

  const players = useMemo(() => state.game?.players ?? [], [state.game?.players]);
  const showCharacters = state.showCharacters;
  const isDayPhase = state.game?.currentPhase === Phase.Day;

  const sorted = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
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

  // ── Selection / quick-actions state ──
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuPlayer, setMenuPlayer] = useState<PlayerSeat | null>(null);

  // ── Edit dialog state ──
  const [editSeat, setEditSeat] = useState<number | null>(null);
  const editingPlayer =
    editSeat !== null ? (players.find((p) => p.seat === editSeat) ?? null) : null;

  // ── Add traveller dialog ──
  const [addTravellerOpen, setAddTravellerOpen] = useState(false);

  // ── Token manager dialog ──
  const [tokenPlayer, setTokenPlayer] = useState<PlayerSeat | null>(null);

  // ── Handlers ──

  const handleTokenClick = useCallback(
    (player: PlayerSeat, event: React.MouseEvent<HTMLElement>) => {
      if (showCharacters) {
        // Night view → open edit dialog
        setEditSeat(player.seat);
        setSelectedSeat(player.seat);
      } else {
        // Day view → open quick-action menu
        setMenuAnchor(event.currentTarget);
        setMenuPlayer(player);
        setSelectedSeat(player.seat);
      }
    },
    [showCharacters],
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuPlayer(null);
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

  const handleEditCharacter = useCallback((seat: number) => {
    setEditSeat(seat);
  }, []);

  const handleRemoveTraveller = useCallback(
    (seat: number) => {
      removeTraveller(seat);
    },
    [removeTraveller],
  );

  const handleEditSave = useCallback(
    (
      seat: number,
      updates: {
        characterId?: string;
        actualAlignment?: Alignment;
        visibleAlignment?: Alignment;
      },
    ) => {
      updatePlayer(seat, updates);
    },
    [updatePlayer],
  );

  const handleEditClose = useCallback(() => {
    setEditSeat(null);
    setSelectedSeat(null);
  }, []);

  const handleManageTokens = useCallback(
    (seat: number) => {
      const p = players.find((pl) => pl.seat === seat);
      if (p) setTokenPlayer(p);
    },
    [players],
  );

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
          {playerTokens.length > 0 && (
            <TokenBadges
              tokens={playerTokens}
              tileX={position.x}
              tileY={position.y}
              centerX={centerX}
              centerY={centerY}
            />
          )}
        </Box>
      );
    },
    [getCharacter, showCharacters, selectedSeat, handleTokenClick, tokenSize, centerX, centerY],
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

      {/* ── Quick-actions context menu (day view) ── */}
      <PlayerQuickActions
        anchorEl={menuAnchor}
        player={menuPlayer}
        showCharacters={showCharacters}
        onClose={handleMenuClose}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onEditCharacter={handleEditCharacter}
        onRemoveTraveller={handleRemoveTraveller}
        onManageTokens={handleManageTokens}
      />

      {/* ── Edit dialog (night view) ── */}
      <PlayerEditDialog
        key={editingPlayer?.seat ?? 'none'}
        open={editSeat !== null}
        player={editingPlayer}
        scriptCharacters={scriptCharacters}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />

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
        onClose={() => setTokenPlayer(null)}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
        characterDef={tokenPlayer?.characterId ? getCharacter(tokenPlayer.characterId) : undefined}
      />

      {/* ── Day Timer FAB (visible during Day phase) ── */}
      {isDayPhase && dayTimer && <DayTimerFab timer={dayTimer} />}
    </Box>
  );
}
