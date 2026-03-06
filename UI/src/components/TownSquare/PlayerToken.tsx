import { memo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';

// ──────────────────────────────────────────────
// Size presets (px) based on player count
// F3-6: Enlarged defaults — old "large" is now "medium",
//       all fonts increased ~30%.
// Icon sizes bumped to ≥ 48 minimum.
// Token boxes enlarged to accommodate larger icons.
// ──────────────────────────────────────────────

export const SIZE_MAP = {
  large: { width: 80, height: 120, icon: 56, nameFont: '0.91rem', metaFont: '0.78rem' },
  medium: { width: 73, height: 110, icon: 52, nameFont: '0.91rem', metaFont: '0.78rem' },
  small: { width: 67, height: 100, icon: 48, nameFont: '0.85rem', metaFont: '0.72rem' },
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

/** Subtle transparent background tint based on alignment (F3-6c). */
function alignmentBgTint(alignment: Alignment): string | undefined {
  switch (alignment) {
    case Alignment.Good:
      return 'rgba(25, 118, 210, 0.10)';
    case Alignment.Evil:
      return 'rgba(211, 47, 47, 0.10)';
    default:
      return undefined;
  }
}

/** F3-11: Split blue/red transparent gradient for traveller backgrounds. */
const TRAVELLER_BG_TINT =
  'linear-gradient(to right, rgba(25, 118, 210, 0.10) 50%, rgba(211, 47, 47, 0.10) 50%)';

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

  // F3-6c: Determine alignment tint — use actualAlignment in night view,
  // visibleAlignment in day view (though day view typically won't show it).
  const effectiveAlignment = showCharacters ? player.actualAlignment : player.visibleAlignment;
  const bgTint = alignmentBgTint(effectiveAlignment);

  // Border logic
  const borderWidth = 2;
  const isTraveller = player.isTraveller;

  // Night-view border colour derived from actual alignment
  const nightBorder = alignmentBorderColor(player.actualAlignment);

  // Traveller split-colour border uses a gradient via boxShadow trick
  // (border-image doesn't support border-radius)
  const travellerGradient = 'linear-gradient(to right, #1976d2 50%, #d32f2f 50%)';

  const borderStyle = (() => {
    // F3-13: Travellers always show split-colour border (even in day view),
    // because traveller status is public knowledge.
    if (isTraveller) {
      return {
        border: 'none',
        backgroundImage: travellerGradient,
        backgroundOrigin: 'border-box' as const,
        backgroundClip: 'border-box' as const,
        padding: `${borderWidth}px`,
      };
    }
    if (!showCharacters) {
      // Day view — neutral border for non-travellers
      return {
        border: `${borderWidth}px solid`,
        borderColor: isDead ? '#bdbdbd' : '#e0e0e0',
      };
    }
    return {
      border: `${borderWidth}px solid ${nightBorder}`,
    };
  })();

  // F3-13: Travellers always use the wrapper (day AND night)
  const useTravellerWrapper = isTraveller;

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (characterDef) {
      setDetailOpen(true);
    }
  };

  // Phase 3: Show character icon when characters are visible OR for travellers (public info)
  const showIcon = showCharacters || isTraveller;

  const tokenContent = (
    <>
      {/* ── Character icon: visible in night view, or always for travellers ── */}
      {showIcon && (
        <CharacterIconImage
          characterId={player.characterId ?? ''}
          characterName={characterDef?.name ?? '?'}
          typeColor={typeColor}
          size={s.icon}
          borderColor={getAlignmentBorderColor(player.actualAlignment, typeColor)}
          onClick={handleIconClick}
        />
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

  // F3-11: Travellers get a split blue/red background tint;
  // other types use alignment-based tint.
  // Phase 3: In hidden mode, use neutral background (no alignment tint).
  // Traveller split gradient is only shown in visible mode.
  const resolvedBg = (() => {
    if (isDead) return { bgcolor: 'grey.200' } as const;
    if (!showCharacters) return { bgcolor: 'background.paper' } as const;
    if (isTraveller) return { background: TRAVELLER_BG_TINT } as const;
    if (bgTint) return { bgcolor: bgTint } as const;
    return { bgcolor: 'background.paper' } as const;
  })();

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
    borderRadius: '10px', // F3-12: slightly smaller than outer to nest inside border
    ...resolvedBg,
  };

  // F3-12: Use minHeight instead of fixed height so traveller tokens
  // (which have extra content from the gradient-border wrapper) can grow.
  const outerSx = {
    width: s.width,
    minWidth: 60,
    minHeight: Math.max(s.height, 90),
    height: s.height,
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
