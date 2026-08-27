/**
 * CharacterWheel — vertically scrolling slot-machine wheel of characters.
 *
 * The wheel always renders the same pool of characters in a fixed order so it
 * never leaks information about which characters are actually in play.
 *
 * To spin, call the imperative `spinTo(targetCharacterId)` method via the
 * forwarded ref. The wheel animates a CSS translateY for `spinDurationMs` and
 * settles with the target character centred in the highlight band.
 *
 * The strip is composed of `STRIP_REPEATS` copies of the character list so the
 * wheel can spin multiple revolutions before landing on the target without
 * exposing the strip edges. After settling we snap (without transition) back to
 * the canonical centre repeat so the next spin has room to travel in either
 * direction.
 */
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { CharacterDef } from '@/types/index.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

export const WHEEL_ROW_HEIGHT_PX = 72;
export const WHEEL_VISIBLE_ROWS = 7;
export const WHEEL_STRIP_REPEATS = 7; // odd so there is a clean middle repeat
const CENTER_REPEAT_INDEX = Math.floor(WHEEL_STRIP_REPEATS / 2);
const SETTLE_SNAP_DELAY_MS = 80;

export interface CharacterWheelHandle {
  /**
   * Spin the wheel and settle on the character with `targetCharacterId`.
   * Returns a promise that resolves once the settle animation has finished.
   * If the target id is not in the wheel pool, the promise resolves
   * immediately without animating.
   */
  spinTo: (targetCharacterId: string, durationMs?: number) => Promise<void>;
}

interface Props {
  characters: CharacterDef[];
  /** Default spin duration in ms. Each call to spinTo can override. */
  defaultSpinDurationMs?: number;
  /** Uses a shorter five-row wheel suitable for side-by-side draft columns. */
  compact?: boolean;
  /** Light surfaces are used for the private player drafting display. */
  surface?: 'dark' | 'light';
}

const CharacterWheelComponent = forwardRef<CharacterWheelHandle, Props>(function CharacterWheel(
  { characters, defaultSpinDurationMs = 3500, compact = false, surface = 'dark' },
  ref,
) {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const rowHeight = compact ? 56 : WHEEL_ROW_HEIGHT_PX;
  const visibleRows = compact ? 5 : WHEEL_VISIBLE_ROWS;
  const visibleHeight = rowHeight * visibleRows;
  const centerOffsetPx = (visibleHeight - rowHeight) / 2;

  const stripChars = characters;
  const stripCount = stripChars.length;
  const totalRows = stripCount * WHEEL_STRIP_REPEATS;

  /** Y offset (px) that places row `rowIndex` of the long strip in the highlight band. */
  const yForRowIndex = useCallback(
    (rowIndex: number) => rowIndex * rowHeight - centerOffsetPx,
    [centerOffsetPx, rowHeight],
  );

  // Resting position: middle repeat, first character — gives a stable initial layout.
  const restingRowIndex = CENTER_REPEAT_INDEX * stripCount;
  const restingY = yForRowIndex(restingRowIndex);

  // Apply the resting transform on mount so the strip is correctly positioned
  // before the first spin. We use a ref + effect (rather than initial style)
  // because stripCount can be 0 momentarily during prop transitions.
  useEffect(() => {
    if (!stripRef.current || stripCount === 0) return;
    stripRef.current.style.transition = 'none';
    stripRef.current.style.transform = `translateY(${-restingY}px)`;
  }, [restingY, stripCount]);

  useImperativeHandle(
    ref,
    () => ({
      spinTo: (targetCharacterId, durationMs = defaultSpinDurationMs) =>
        new Promise<void>((resolve) => {
          const el = stripRef.current;
          if (!el || stripCount === 0) {
            resolve();
            return;
          }
          const targetIndex = stripChars.findIndex((c) => c.id === targetCharacterId);
          if (targetIndex < 0) {
            resolve();
            return;
          }

          // Always start the spin from the canonical resting position so the
          // total travel distance is predictable across consecutive spins.
          el.style.transition = 'none';
          el.style.transform = `translateY(${-restingY}px)`;
          // Leave one full repeat below the result so late-script characters do
          // not expose the strip edge during the brief settle delay.
          const landingRepeat = WHEEL_STRIP_REPEATS - 2;
          const landingRowIndex = landingRepeat * stripCount + targetIndex;
          const landingY = yForRowIndex(landingRowIndex);

          wheelRef.current?.setAttribute('data-spinning', 'true');

          let settled = false;
          let fallbackTimer = 0;
          const settle = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(fallbackTimer);
            el.removeEventListener('transitionend', onEnd);
            el.removeEventListener('transitioncancel', onEnd);
            // Snap (without transition) back to the centre-repeat copy of the
            // same character so the next spin has room to travel either way.
            window.setTimeout(() => {
              const settleRowIndex = CENTER_REPEAT_INDEX * stripCount + targetIndex;
              el.style.transition = 'none';
              el.style.transform = `translateY(${-yForRowIndex(settleRowIndex)}px)`;
              wheelRef.current?.setAttribute('data-spinning', 'false');
              resolve();
            }, SETTLE_SNAP_DELAY_MS);
          };
          const onEnd = (event: Event) => {
            if (event.target === el) settle();
          };
          el.addEventListener('transitionend', onEnd);
          el.addEventListener('transitioncancel', onEnd);
          fallbackTimer = window.setTimeout(settle, durationMs + 250);
          window.requestAnimationFrame(() => {
            el.style.transition = `transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            el.style.transform = `translateY(${-landingY}px)`;
          });
        }),
    }),
    [defaultSpinDurationMs, restingY, stripChars, stripCount, yForRowIndex],
  );

  return (
    <Box
      ref={wheelRef}
      data-testid="character-wheel"
      data-spinning="false"
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: compact ? 320 : 520,
        height: visibleHeight,
        overflow: 'hidden',
        bgcolor: surface === 'light' ? '#fff' : '#1a1a1a',
        border: '2px solid',
        borderColor: 'warning.main',
        borderRadius: 2,
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.7)',
      }}
    >
      <Box
        ref={stripRef}
        sx={{
          willChange: 'transform',
          // The strip stacks each of `STRIP_REPEATS` copies of all characters
          // as fixed-height rows. translateY scrolls the strip vertically.
        }}
        data-testid="character-wheel-strip"
      >
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const char = stripChars[rowIndex % stripCount];
          if (!char) return null;
          const typeColor = getCharacterTypeColor(char.type);
          return (
            <Box
              key={`${rowIndex}-${char.id}`}
              sx={{
                height: rowHeight,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                color: surface === 'light' ? '#111' : '#fff',
              }}
            >
              <Box
                component="img"
                src={getCharacterIconPath(char.id)}
                alt=""
                aria-hidden="true"
                decoding="async"
                sx={{
                  width: compact ? 38 : 48,
                  height: compact ? 38 : 48,
                  borderRadius: '50%',
                  border: `2px solid ${typeColor}`,
                  bgcolor: '#fff',
                  flexShrink: 0,
                  objectFit: 'contain',
                  padding: '2px',
                }}
              />
              <Typography
                variant={compact ? 'body2' : 'h6'}
                sx={{
                  color: typeColor,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  textShadow: surface === 'light' ? 'none' : '0 1px 2px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {char.name}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Highlight band — the row that will be the "winner" sits inside this. */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: centerOffsetPx,
          left: 0,
          right: 0,
          height: rowHeight,
          borderTop: '2px solid',
          borderBottom: '2px solid',
          borderColor: 'warning.light',
          bgcolor: 'rgba(255, 193, 7, 0.08)',
          pointerEvents: 'none',
        }}
      />
      {/* Top fade */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: centerOffsetPx,
          background:
            surface === 'light'
              ? 'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(to bottom, #1a1a1a 0%, rgba(26,26,26,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom fade */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: centerOffsetPx,
          background:
            surface === 'light'
              ? 'linear-gradient(to top, #fff 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(to top, #1a1a1a 0%, rgba(26,26,26,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
});

export const CharacterWheel = memo(CharacterWheelComponent);
