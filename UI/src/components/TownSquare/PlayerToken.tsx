import { memo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';

// ──────────────────────────────────────────────
// Size presets (px) based on player count
// ──────────────────────────────────────────────

const SIZE_MAP = {
  large: { box: 72, icon: 28, nameFont: '0.7rem', metaFont: '0.6rem' },
  medium: { box: 60, icon: 24, nameFont: '0.65rem', metaFont: '0.55rem' },
  small: { box: 48, icon: 20, nameFont: '0.58rem', metaFont: '0.5rem' },
} as const;

export type TokenSize = keyof typeof SIZE_MAP;

export interface PlayerTokenProps {
  player: PlayerSeat;
  characterDef?: CharacterDef;
  showCharacters: boolean;
  isSelected: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  size: TokenSize;
}

/** Resolve border colour from alignment. */
function alignmentBorderColor(alignment: Alignment): string {
  switch (alignment) {
    case Alignment.Good:
      return '#1976d2';
    case Alignment.Evil:
      return '#d32f2f';
    default:
      return '#9e9e9e';
  }
}

/**
 * Abbreviate a character name for compact display.
 * - ≤ 8 chars → full name
 * - Otherwise first 7 chars + "…"
 */
function abbreviateName(name: string, maxLen = 8): string {
  return name.length <= maxLen ? name : `${name.slice(0, maxLen - 1)}…`;
}

/**
 * An individual player token rendered on the Town Square circle/ovoid.
 *
 * - **Day view:** seat number, player name, alive/dead indicator.
 * - **Night view:** additionally shows character type icon, abbreviated
 *   character name, and alignment-coloured border.
 */
export const PlayerToken = memo(function PlayerToken({
  player,
  characterDef,
  showCharacters,
  isSelected,
  onClick,
  size,
}: PlayerTokenProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const aliveStatus = player.alive ? 'alive' : 'dead';
  const ariaLabel = `${player.playerName}, Seat ${player.seat}, ${aliveStatus}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLElement>);
    }
  };
  const s = SIZE_MAP[size];
  const isDead = !player.alive;
  const typeColor = characterDef ? getCharacterTypeColor(characterDef.type) : '#9e9e9e';

  // Border logic
  const borderWidth = 2;
  const isTraveller = player.isTraveller;

  // Night-view border colour derived from actual alignment
  const nightBorder = alignmentBorderColor(player.actualAlignment);

  // Traveller split-colour border uses a gradient via boxShadow trick
  // (border-image doesn't support border-radius)
  const travellerGradient = 'linear-gradient(to right, #1976d2 50%, #d32f2f 50%)';

  const borderStyle = (() => {
    if (!showCharacters) {
      // Day view — neutral border
      return {
        border: `${borderWidth}px solid`,
        borderColor: isDead ? '#bdbdbd' : '#e0e0e0',
      };
    }
    if (isTraveller) {
      // Traveller: split-colour border via background-clip trick
      return {
        border: 'none',
        backgroundImage: travellerGradient,
        backgroundOrigin: 'border-box' as const,
        backgroundClip: 'border-box' as const,
        // We use a pseudo-element approach via padding + inner background
        padding: `${borderWidth}px`,
      };
    }
    return {
      border: `${borderWidth}px solid ${nightBorder}`,
    };
  })();

  // For the traveller gradient border we need an inner wrapper
  const useTravellerWrapper = showCharacters && isTraveller;

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (characterDef) {
      setDetailOpen(true);
    }
  };

  const tokenContent = (
    <>
      {/* ── Night view: character icon placeholder ── */}
      {showCharacters && (
        <Box
          onClick={handleIconClick}
          sx={{
            width: s.icon,
            height: s.icon,
            borderRadius: '50%',
            bgcolor: typeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: `${s.icon * 0.5}px`,
              lineHeight: 1,
            }}
          >
            {characterDef?.name?.charAt(0) ?? '?'}
          </Typography>
        </Box>
      )}

      {/* ── Night view: abbreviated character name ── */}
      {showCharacters && (
        <Typography
          noWrap
          sx={{
            fontSize: s.metaFont,
            fontWeight: 600,
            lineHeight: 1.15,
            maxWidth: '100%',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'text.primary',
          }}
        >
          {characterDef ? abbreviateName(characterDef.name) : '—'}
        </Typography>
      )}

      {/* ── Player name ── */}
      <Typography
        noWrap
        sx={{
          fontSize: s.nameFont,
          fontWeight: showCharacters ? 400 : 600,
          lineHeight: 1.15,
          maxWidth: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: isDead ? 'line-through' : 'none',
          color: showCharacters ? 'text.secondary' : 'text.primary',
        }}
      >
        {player.playerName}
      </Typography>

      {/* ── Seat # & status row ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.3,
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: s.metaFont,
            color: 'text.secondary',
            lineHeight: 1,
          }}
        >
          {player.seat}
        </Typography>

        {showCharacters && (
          <Typography sx={{ fontSize: s.metaFont, color: 'text.secondary', lineHeight: 1 }}>
            ·
          </Typography>
        )}

        {/* Alive/dead/ghost indicator */}
        <Typography
          sx={{
            fontSize: s.metaFont,
            lineHeight: 1,
            color: isDead ? 'error.main' : 'success.main',
          }}
        >
          {isDead ? '💀' : '●'}
        </Typography>

        {/* Ghost vote used indicator */}
        {isDead && player.ghostVoteUsed && (
          <Typography
            sx={{
              fontSize: s.metaFont,
              lineHeight: 1,
              color: 'text.disabled',
              textDecoration: 'line-through',
            }}
            title="Ghost vote used"
          >
            🗳
          </Typography>
        )}
      </Box>
    </>
  );

  const innerSx = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: showCharacters ? 0.15 : 0.25,
    width: '100%',
    height: '100%',
    p: 0.4,
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none' as const,
    borderRadius: '12px',
    bgcolor: isDead ? 'grey.200' : 'background.paper',
  };

  const outerSx = {
    width: s.box,
    height: s.box,
    borderRadius: '12px',
    opacity: isDead ? 0.45 : 1,
    transition: 'opacity 0.2s, box-shadow 0.15s',
    boxShadow: isSelected
      ? '0 0 0 3px rgba(25,118,210,0.5), 0 4px 12px rgba(0,0,0,0.25)'
      : '0 1px 4px rgba(0,0,0,0.12)',
    ...borderStyle,
  };

  if (useTravellerWrapper) {
    // Gradient border wrapper for rounded corners on traveller tokens
    return (
      <>
        <Box
          sx={outerSx}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
        >
          <Box sx={innerSx}>{tokenContent}</Box>
        </Box>

        {/* Character Detail Modal */}
        <CharacterDetailModal
          open={detailOpen}
          character={characterDef ?? null}
          onClose={() => setDetailOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Box
        sx={{ ...outerSx, ...innerSx }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
      >
        {tokenContent}
      </Box>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={characterDef ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
});
