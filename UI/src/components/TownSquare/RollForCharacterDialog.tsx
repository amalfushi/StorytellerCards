/**
 * RollForCharacterDialog — fullscreen slot-machine for assigning a player's
 * character with a flourish. Two modes, hidden from the player:
 *
 *  - **Predetermined:** if the player already has a character assigned, the
 *    wheel is just theatre and lands on that exact character (the storyteller
 *    is the only one who knows it was preordained).
 *  - **Random:** if the player has no character assigned yet, we pick a random
 *    character from the assignable script pool and apply it on close. The
 *    component renders a warning to the storyteller in this mode because the
 *    pick does not respect the full setup-distribution rules used by the bulk
 *    randomizer.
 *
 * The same pool of characters is always shown on the wheel regardless of mode
 * so the visible list never leaks information about who is in play.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef } from '@/types/index.ts';
import { filterPlayerAssignableCharacters } from '@/utils/characterAssignment.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';
import {
  CharacterWheel,
  type CharacterWheelHandle,
} from '@/components/TownSquare/CharacterWheel.tsx';

export interface RollForCharacterDialogProps {
  open: boolean;
  /** Full set of characters on the active script (any types). */
  scriptCharacters: CharacterDef[];
  /**
   * Player's currently assigned character id, if any. When set, the wheel
   * lands on this character — i.e. the spin is purely theatrical.
   */
  preAssignedCharacterId: string | null;
  /** Display name of the player being rolled for. */
  playerName: string;
  /**
   * Invoked after the spin settles with a freshly-picked random character.
   * Not called in the predetermined branch — the assignment already exists.
   */
  onApplyRandom: (characterId: string) => void;
  onClose: () => void;
}

/** Order characters by type then name so the wheel reads consistently. */
function orderForWheel(characters: CharacterDef[]): CharacterDef[] {
  const typeOrder = ['Townsfolk', 'Outsider', 'Minion', 'Demon'];
  return [...characters].sort((a, b) => {
    const ai = typeOrder.indexOf(a.type);
    const bi = typeOrder.indexOf(b.type);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export function RollForCharacterDialog({
  open,
  scriptCharacters,
  preAssignedCharacterId,
  playerName,
  onApplyRandom,
  onClose,
}: RollForCharacterDialogProps) {
  const wheelRef = useRef<CharacterWheelHandle | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultCharacterId, setResultCharacterId] = useState<string | null>(null);

  const wheelPool = useMemo(
    () => orderForWheel(filterPlayerAssignableCharacters(scriptCharacters)),
    [scriptCharacters],
  );

  const isPredetermined = preAssignedCharacterId !== null;

  const handleSpin = useCallback(async () => {
    if (isSpinning || wheelPool.length === 0) return;
    setResultCharacterId(null);
    // Determine target *before* spinning so the wheel knows where to land.
    let targetId: string;
    if (isPredetermined) {
      targetId = preAssignedCharacterId;
      // If the preassigned character somehow isn't in the wheel pool (e.g. a
      // Traveller assigned via the player actions modal), fall back to a
      // visible random pick so we still produce a sensible spin.
      if (!wheelPool.some((c) => c.id === targetId)) {
        targetId = wheelPool[Math.floor(Math.random() * wheelPool.length)].id;
      }
    } else {
      targetId = wheelPool[Math.floor(Math.random() * wheelPool.length)].id;
    }
    setIsSpinning(true);
    await wheelRef.current?.spinTo(targetId);
    setIsSpinning(false);
    setResultCharacterId(targetId);
    if (!isPredetermined) {
      onApplyRandom(targetId);
    }
  }, [isPredetermined, isSpinning, onApplyRandom, preAssignedCharacterId, wheelPool]);

  const handleClose = useCallback(() => {
    if (isSpinning) return;
    setResultCharacterId(null);
    onClose();
  }, [isSpinning, onClose]);

  const resultChar = useMemo(
    () => (resultCharacterId ? wheelPool.find((c) => c.id === resultCharacterId) : null),
    [resultCharacterId, wheelPool],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      data-testid="roll-for-character-dialog"
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0a0a0a',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            p: { xs: 2, sm: 4 },
            gap: 3,
            // CRITICAL: the paper must constrain its height and forbid its
            // own overflow so the result panel below can claim the remaining
            // space and scroll its detailed-rules section internally rather
            // than letting the whole dialog overflow.
            height: '100%',
            maxHeight: '100vh',
            overflow: 'hidden',
            minHeight: 0,
          },
        },
      }}
    >
      <IconButton
        aria-label="close roll for character"
        onClick={handleClose}
        disabled={isSpinning}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: 'rgba(255,255,255,0.6)',
          '&:hover': { color: 'rgba(255,255,255,0.9)' },
        }}
        data-testid="roll-for-character-close"
      >
        <CloseIcon sx={{ fontSize: '2rem' }} />
      </IconButton>

      <Box sx={{ textAlign: 'center', mt: { xs: 4, sm: 2 } }}>
        <Typography variant="overline" sx={{ color: 'warning.light', letterSpacing: 2 }}>
          Roll for Character
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {playerName}
        </Typography>
      </Box>

      {!isPredetermined && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            maxWidth: 480,
            width: '100%',
            color: 'warning.light',
            borderColor: 'warning.main',
            '& .MuiAlert-icon': { color: 'warning.light' },
          }}
          data-testid="roll-warning-no-assignment"
        >
          No character is assigned to this player yet, so the wheel will pick one at random from the
          script. The single-player pick does <em>not</em> respect full setup-distribution rules —
          it may produce unbalanced games. Use the bulk randomizer in the assignment pane for proper
          distributions.
        </Alert>
      )}

      <CharacterWheel ref={wheelRef} characters={wheelPool} />

      <Button
        variant="contained"
        size="large"
        color="warning"
        startIcon={<CasinoIcon />}
        onClick={() => void handleSpin()}
        disabled={isSpinning || wheelPool.length === 0}
        sx={{ minWidth: 220, fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}
        data-testid="roll-for-character-spin"
      >
        {isSpinning ? 'Spinning…' : 'Spin the wheel'}
      </Button>

      {resultChar && !isSpinning && (
        <Box
          sx={{
            mt: 1,
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: '2px solid',
            borderColor: getCharacterTypeColor(resultChar.type),
            bgcolor: 'rgba(255,255,255,0.03)',
            width: '100%',
            maxWidth: 640,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            // Stretch so the text column fills the panel's cross-axis height
            // (row layout) — otherwise it shrinks to the icon's height and the
            // inner detailed-rules box has nothing to push against, so it
            // overflows the panel and the bottom is clipped instead of
            // scrolling.
            alignItems: 'stretch',
            gap: 3,
            minHeight: 0,
            flex: '1 1 auto',
            overflow: 'hidden',
          }}
          data-testid="roll-for-character-result"
        >
          {/* ── Large icon ── (always visible) */}
          <Box
            component="img"
            src={getCharacterIconPath(resultChar.id)}
            alt=""
            aria-hidden="true"
            sx={{
              width: { xs: 120, sm: 140 },
              height: { xs: 120, sm: 140 },
              borderRadius: '50%',
              border: `3px solid ${getCharacterTypeColor(resultChar.type)}`,
              bgcolor: '#fff',
              objectFit: 'contain',
              padding: '6px',
              flexShrink: 0,
              alignSelf: 'center',
              boxShadow: `0 0 20px ${getCharacterTypeColor(resultChar.type)}55`,
            }}
            data-testid="roll-for-character-result-icon"
          />

          {/* ── Text column ── */}
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              textAlign: { xs: 'center', sm: 'left' },
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
              {resultChar.type.toUpperCase()}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: getCharacterTypeColor(resultChar.type),
                lineHeight: 1.1,
              }}
            >
              {resultChar.name}
            </Typography>
            {/* Ability short — always visible, no truncation */}
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 500, mt: 0.5 }}
              data-testid="roll-for-character-ability-short"
            >
              {resultChar.abilityShort}
            </Typography>
            {/* Detailed rules — scrollable overflow if long */}
            {resultChar.abilityDetailed && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  flex: '1 1 auto',
                  minHeight: 0,
                  overflow: 'auto',
                  pr: 1,
                  // Custom scrollbar so it's discoverable on a dark bg.
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                    borderRadius: 3,
                  },
                }}
                data-testid="roll-for-character-ability-detailed"
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 0.5, letterSpacing: 0.5 }}
                >
                  DETAILED RULES
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                >
                  {resultChar.abilityDetailed}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Button
        onClick={handleClose}
        disabled={isSpinning}
        sx={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}
        data-testid="roll-for-character-done"
      >
        Done
      </Button>
    </Dialog>
  );
}
