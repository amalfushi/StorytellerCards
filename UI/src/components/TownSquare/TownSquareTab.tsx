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
  PlayerId,
  PlayerToken as PlayerTokenType,
  SlotId,
} from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { useGame } from '@/context/useGame.ts';
import { useSession } from '@/context/useSession.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { PlayerToken, SIZE_MAP } from '@/components/TownSquare/PlayerToken.tsx';
import type { TokenSize, TownSquarePlayer } from '@/components/TownSquare/PlayerToken.tsx';
import { TownSquareLayout } from '@/components/TownSquare/TownSquareLayout.tsx';
import type { TokenPosition } from '@/components/TownSquare/TownSquareLayout.tsx';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import { RollForCharacterDialog } from '@/components/TownSquare/RollForCharacterDialog.tsx';
import { TokenManager, TokenBadges } from '@/components/TownSquare/TokenManager.tsx';
import { buildAvailableTokens } from '@/utils/buildAvailableTokens.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';

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

/** Half-side of the token square (used as padding inset for the layout). */
const TOKEN_HALF = { large: 60, medium: 55, small: 50 } as const;
const GAME_ONLY_PROPAGATION = { toTemplate: false, toOtherGames: false } as const;

/**
 * Town Square tab — the signature circular / ovoid "clock face" layout.
 */
export function TownSquareTab({ scriptCharacterIds }: TownSquareTabProps) {
  const {
    state,
    updatePlayerState,
    removeParticipant,
    addToken,
    removeToken,
    assignGameSeat,
    setPlayerBluffs,
    setParticipantTraveller,
  } = useGame();
  const { state: sessionState } = useSession();
  const { getCharacter, getCharactersByIds, allCharacters } = useCharacterLookup();

  const game = state.game;
  const session = useMemo(
    () =>
      game ? sessionState.sessions.find((candidate) => candidate.id === game.sessionId) : undefined,
    [game, sessionState.sessions],
  );

  const isTablet = useMediaQuery('(min-width:600px)');
  const isSmallViewport = useMediaQuery('(max-width:479px)');
  const shape = isTablet ? 'circle' : 'ovoid';

  const [layoutPref, setLayoutPref] = useLocalStorage<TokenLayoutPref>(
    'storyteller-token-layout',
    'auto',
  );

  const effectiveLayout: 'radial' | 'linear' =
    layoutPref === 'auto' ? (isSmallViewport ? 'linear' : 'radial') : layoutPref;

  const handleToggleLayout = useCallback(() => {
    setLayoutPref((prev) => (prev === 'linear' ? 'radial' : 'linear'));
  }, [setLayoutPref]);

  const players = useMemo<TownSquarePlayer[]>(() => {
    if (!game || !session) return [];
    const roster = new Map(session.players.map((player) => [player.id, player]));
    const participants = new Map(
      game.participants.map((participant) => [participant.playerId, participant]),
    );
    const displaySeatNumbers = buildDisplaySeatNumberMap(game.slots);

    return game.slots.flatMap((slot) => {
      if (slot.kind !== 'seat' || !slot.playerId) return [];
      const rosterPlayer = roster.get(slot.playerId);
      const playerState = game.playerState[slot.playerId];
      const seatNumber = displaySeatNumbers.get(slot.id);
      if (!rosterPlayer || !playerState || seatNumber === undefined) return [];

      return [
        {
          ...playerState,
          playerId: slot.playerId,
          slotId: slot.id,
          name: rosterPlayer.name,
          seatNumber,
          isTraveller: participants.get(slot.playerId)?.isTraveller ?? false,
        },
      ];
    });
  }, [game, session]);

  const playersById = useMemo(
    () => new Map<PlayerId, TownSquarePlayer>(players.map((player) => [player.playerId, player])),
    [players],
  );

  const playersBySlotId = useMemo(
    () => new Map<SlotId, TownSquarePlayer>(players.map((player) => [player.slotId, player])),
    [players],
  );

  const showCharacters = state.showCharacters;

  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  const activeSetupPowers = useMemo(
    () =>
      [...(game?.activeFabled ?? []), ...(game?.activeLoric ?? [])]
        .map((id) => getCharacter(id))
        .filter((character): character is CharacterDef => character !== undefined),
    [game?.activeFabled, game?.activeLoric, getCharacter],
  );

  const activeCharacters = useMemo(() => {
    if (!game) return activeSetupPowers;
    const playerCharacters = game.participants
      .map(({ playerId }) => game.playerState[playerId]?.characterId)
      .map((characterId) => (characterId ? getCharacter(characterId) : undefined))
      .filter((character): character is CharacterDef => character !== undefined);
    return [...playerCharacters, ...activeSetupPowers];
  }, [game, getCharacter, activeSetupPowers]);

  const apparentCharacters = useMemo(() => {
    if (!game) return [];
    return game.participants
      .map(({ playerId }) => game.playerState[playerId]?.apparentCharacterId)
      .map((characterId) => (characterId ? getCharacter(characterId) : undefined))
      .filter((character): character is CharacterDef => character !== undefined);
  }, [game, getCharacter]);

  const availableTokens = useMemo(
    () => buildAvailableTokens(activeCharacters, apparentCharacters),
    [activeCharacters, apparentCharacters],
  );

  const tokenSize = tokenSizeForCount(players.length);

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

  const [selectedPlayerId, setSelectedPlayerId] = useState<PlayerId | null>(null);
  const [actionsPlayerId, setActionsPlayerId] = useState<PlayerId | null>(null);
  const [swapSourcePlayerId, setSwapSourcePlayerId] = useState<PlayerId | null>(null);
  const actionsPlayer = actionsPlayerId ? (playersById.get(actionsPlayerId) ?? null) : null;

  const actionsPlayerCharDef = actionsPlayer?.characterId
    ? getCharacter(actionsPlayer.characterId)
    : undefined;
  const isActionsPlayerDemon = actionsPlayerCharDef?.type === 'Demon';
  const isActionsPlayerLunatic = actionsPlayer?.characterId === 'lunatic';
  const showBluffsForPlayer = isActionsPlayerDemon || isActionsPlayerLunatic;

  const bluffIds = actionsPlayer ? game?.playerBluffs?.[actionsPlayer.playerId] : undefined;

  const modalBluffCharacters = useMemo(
    () => (bluffIds?.length ? getCharactersByIds(bluffIds) : undefined),
    [bluffIds, getCharactersByIds],
  );

  const modalAvailableBluffCharacters = useMemo(() => {
    if (!showBluffsForPlayer) return undefined;
    const inPlay = new Set(game?.inPlayCharacterIds ?? []);
    return scriptCharacters.filter((ch) => {
      if (ch.type !== 'Townsfolk' && ch.type !== 'Outsider') return false;
      if (isActionsPlayerLunatic) return true;
      return !inPlay.has(ch.id);
    });
  }, [showBluffsForPlayer, isActionsPlayerLunatic, scriptCharacters, game?.inPlayCharacterIds]);

  const handleChangeBluff = useCallback(
    (oldBluffId: string, newBluffId: string) => {
      if (!actionsPlayer) return;
      const currentBluffs = bluffIds ?? [];
      const updated = currentBluffs.map((id) => (id === oldBluffId ? newBluffId : id));
      setPlayerBluffs(actionsPlayer.playerId, updated);
    },
    [actionsPlayer, bluffIds, setPlayerBluffs],
  );

  const modalBluffLabel = isActionsPlayerLunatic ? 'Lunatic Bluffs' : 'Demon Bluffs';

  const [tokenPlayerId, setTokenPlayerId] = useState<PlayerId | null>(null);
  const tokenPlayer = tokenPlayerId ? (playersById.get(tokenPlayerId) ?? null) : null;

  const [rollPlayerId, setRollPlayerId] = useState<PlayerId | null>(null);
  const rollPlayer = rollPlayerId ? (playersById.get(rollPlayerId) ?? null) : null;

  const handleRollForCharacter = useCallback((playerId: PlayerId) => {
    setRollPlayerId(playerId);
  }, []);

  const handleRollClose = useCallback(() => {
    setRollPlayerId(null);
  }, []);

  const handleRollRandomResult = useCallback(
    (characterId: string) => {
      if (!rollPlayerId) return;
      const character = getCharacter(characterId);
      const nextIsTraveller = character?.type === CharacterType.Traveller;
      const participant = state.game?.participants.find((p) => p.playerId === rollPlayerId);
      const currentIsTraveller = participant?.isTraveller ?? false;
      if (nextIsTraveller !== currentIsTraveller) {
        setParticipantTraveller(rollPlayerId, nextIsTraveller);
      }
      updatePlayerState(rollPlayerId, { characterId });
    },
    [getCharacter, rollPlayerId, setParticipantTraveller, state.game, updatePlayerState],
  );

  const handleTokenClick = useCallback(
    (player: TownSquarePlayer, _event: React.MouseEvent<HTMLElement>) => {
      if (swapSourcePlayerId !== null) {
        const source = playersById.get(swapSourcePlayerId);
        if (source && source.playerId !== player.playerId) {
          assignGameSeat(player.slotId, source.playerId, GAME_ONLY_PROPAGATION);
          assignGameSeat(source.slotId, player.playerId, GAME_ONLY_PROPAGATION);
        }
        setSwapSourcePlayerId(null);
        setSelectedPlayerId(null);
        return;
      }
      setActionsPlayerId(player.playerId);
      setSelectedPlayerId(player.playerId);
    },
    [swapSourcePlayerId, playersById, assignGameSeat],
  );

  const handleActionsClose = useCallback(() => {
    setActionsPlayerId(null);
    setSelectedPlayerId(null);
  }, []);

  const handleToggleAlive = useCallback(
    (playerId: PlayerId) => {
      const player = playersById.get(playerId);
      if (!player) return;
      updatePlayerState(
        playerId,
        player.alive
          ? { alive: false, ghostVoteUsed: false }
          : { alive: true, ghostVoteUsed: false },
      );
    },
    [playersById, updatePlayerState],
  );

  const handleToggleGhostVote = useCallback(
    (playerId: PlayerId) => {
      const player = playersById.get(playerId);
      if (player) updatePlayerState(playerId, { ghostVoteUsed: !player.ghostVoteUsed });
    },
    [playersById, updatePlayerState],
  );

  const handleRemoveParticipant = useCallback(
    (playerId: PlayerId) => {
      removeParticipant(playerId);
    },
    [removeParticipant],
  );

  const handleSaveCharacter = useCallback(
    (playerId: PlayerId, updates: { characterId?: string; actualAlignment?: Alignment }) => {
      if (updates.characterId !== undefined) {
        const character = getCharacter(updates.characterId);
        const nextIsTraveller = character?.type === CharacterType.Traveller;
        const participant = state.game?.participants.find((p) => p.playerId === playerId);
        const currentIsTraveller = participant?.isTraveller ?? false;
        if (nextIsTraveller !== currentIsTraveller) {
          setParticipantTraveller(playerId, nextIsTraveller, updates.actualAlignment);
        }
      }
      updatePlayerState(playerId, updates);
    },
    [getCharacter, setParticipantTraveller, state.game, updatePlayerState],
  );

  const handleSwapWith = useCallback((playerId: PlayerId) => {
    setSwapSourcePlayerId(playerId);
    setSelectedPlayerId(playerId);
  }, []);

  const handleManageTokens = useCallback((playerId: PlayerId) => {
    setTokenPlayerId(playerId);
  }, []);

  const handleAddToken = useCallback(
    (playerId: PlayerId, token: PlayerTokenType) => {
      addToken(playerId, token);
    },
    [addToken],
  );

  const handleRemoveToken = useCallback(
    (playerId: PlayerId, tokenId: string) => {
      removeToken(playerId, tokenId);
    },
    [removeToken],
  );

  const centerX = dims.width / 2;
  const centerY = dims.height / 2;

  const renderToken = useCallback(
    (player: TownSquarePlayer, position: TokenPosition) => {
      const characterDef = player.characterId ? getCharacter(player.characterId) : undefined;
      const apparentCharacterDef = player.apparentCharacterId
        ? getCharacter(player.apparentCharacterId)
        : undefined;
      const playerTokens = player.tokens ?? [];

      return (
        <Box sx={{ position: 'relative' }}>
          <PlayerToken
            player={player}
            characterDef={characterDef}
            apparentCharacterDef={apparentCharacterDef}
            showCharacters={showCharacters}
            isSelected={selectedPlayerId === player.playerId}
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
      selectedPlayerId,
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
      {swapSourcePlayerId !== null && (
        <Chip
          icon={<SwapHorizIcon />}
          label={`Tap a player to swap with Seat ${playersById.get(swapSourcePlayerId)?.seatNumber ?? '?'}`}
          onDelete={() => {
            setSwapSourcePlayerId(null);
            setSelectedPlayerId(null);
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

      {dims.width > 0 && dims.height > 0 && game && (
        <TownSquareLayout
          slots={game.slots}
          playersBySlotId={playersBySlotId}
          renderToken={renderToken}
          shape={shape}
          containerWidth={dims.width}
          containerHeight={dims.height}
          tokenRadius={TOKEN_HALF[tokenSize]}
          tokenLayout={effectiveLayout}
          activeFabled={(game.activeFabled ?? [])
            .map((id) => getCharacter(id))
            .filter((character): character is CharacterDef => character !== undefined)}
          activeLoric={(game.activeLoric ?? [])
            .map((id) => getCharacter(id))
            .filter((character): character is CharacterDef => character !== undefined)}
        />
      )}

      <PlayerActionsModal
        open={actionsPlayerId !== null}
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
        onRemoveParticipant={handleRemoveParticipant}
        onManageTokens={handleManageTokens}
        onSaveCharacter={handleSaveCharacter}
        onSwapWith={handleSwapWith}
        onChangeBluff={handleChangeBluff}
        onRollForCharacter={handleRollForCharacter}
      />

      {rollPlayer && (
        <RollForCharacterDialog
          open
          scriptCharacters={scriptCharacters}
          preAssignedCharacterId={rollPlayer.characterId ?? null}
          playerName={rollPlayer.name ?? `Seat ${rollPlayer.seatNumber}`}
          onApplyRandom={handleRollRandomResult}
          onClose={handleRollClose}
        />
      )}

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

      <TokenManager
        open={tokenPlayer !== null}
        player={tokenPlayer}
        onClose={() => setTokenPlayerId(null)}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
        characterDef={tokenPlayer?.characterId ? getCharacter(tokenPlayer.characterId) : undefined}
        availableTokens={availableTokens}
        allPlayers={players}
      />
    </Box>
  );
}
