import { useCallback, useMemo, useRef, useState } from 'react';
import CasinoIcon from '@mui/icons-material/Casino';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CharacterDef } from '@/types/index.ts';
import {
  CharacterWheel,
  type CharacterWheelHandle,
} from '@/components/TownSquare/CharacterWheel.tsx';
import type { DraftOffer } from '@/utils/drafting/draftSession.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

export interface CharacterDraftRollerProps {
  playerName: string;
  playerColor?: string;
  scriptCharacters: CharacterDef[];
  offer: DraftOffer;
  onChoose: (characterId: string) => void;
  onMulligan: (characterId: string) => void;
}

type RollerPhase =
  | 'ready'
  | 'spinning'
  | 'choosing'
  | 'mulligan-ready'
  | 'mulligan-spinning'
  | 'mulligan-result';

export function CharacterDraftRoller(props: CharacterDraftRollerProps) {
  const offerKey = `${props.offer.offeredCharacterIds.join('|')}|${props.offer.mulliganCharacterId}`;
  return <CharacterDraftRollerOffer key={offerKey} {...props} />;
}

function CharacterDraftRollerOffer({
  playerName,
  playerColor,
  scriptCharacters,
  offer,
  onChoose,
  onMulligan,
}: CharacterDraftRollerProps) {
  const wheelRefs = useRef<(CharacterWheelHandle | null)[]>([]);
  const mulliganWheelRef = useRef<CharacterWheelHandle | null>(null);
  const [phase, setPhase] = useState<RollerPhase>('ready');
  const [confirmMulligan, setConfirmMulligan] = useState(false);

  const characterById = useMemo(
    () => new Map(scriptCharacters.map((character) => [character.id, character])),
    [scriptCharacters],
  );
  const mulliganCharacter = offer.mulliganCharacterId
    ? characterById.get(offer.mulliganCharacterId)
    : undefined;

  const handleRoll = useCallback(async () => {
    if (phase !== 'ready') return;
    setPhase('spinning');
    await Promise.all(
      offer.offeredCharacterIds.map((characterId, index) =>
        wheelRefs.current[index]?.spinTo(characterId),
      ),
    );
    setPhase('choosing');
  }, [offer.offeredCharacterIds, phase]);

  const handleConfirmMulligan = useCallback(() => {
    if (!offer.mulliganCharacterId) return;
    setConfirmMulligan(false);
    setPhase('mulligan-ready');
  }, [offer.mulliganCharacterId]);

  const handleMulliganRoll = useCallback(async () => {
    if (phase !== 'mulligan-ready' || !mulliganWheelRef.current || !offer.mulliganCharacterId) {
      return;
    }
    setPhase('mulligan-spinning');
    await mulliganWheelRef.current.spinTo(offer.mulliganCharacterId);
    setPhase('mulligan-result');
  }, [offer.mulliganCharacterId, phase]);

  if (phase === 'mulligan-ready' || phase === 'mulligan-spinning' || phase === 'mulligan-result') {
    return (
      <Card
        data-testid="character-draft-roller"
        sx={{ bgcolor: '#050505', color: '#fff', backgroundImage: 'none' }}
      >
        <CardContent>
          <Typography variant="overline" color="warning.main">
            Final Mulligan
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ color: playerColor }}>
            {playerName}
          </Typography>
          <Box
            data-testid="draft-mulligan-column"
            sx={{ width: '100%', maxWidth: 320, mx: 'auto' }}
          >
            <CharacterWheel
              ref={mulliganWheelRef}
              characters={scriptCharacters}
              compact
              surface="light"
              defaultSpinDurationMs={2200}
            />
            {phase === 'mulligan-result' && mulliganCharacter ? (
              <Stack spacing={1} alignItems="stretch" sx={{ mt: 2 }}>
                <Typography variant="h5" fontWeight={900} align="center">
                  {mulliganCharacter.name}
                </Typography>
                <Box
                  data-testid="draft-mulligan-description"
                  sx={{
                    width: '100%',
                    minHeight: 88,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#fff',
                    color: '#111',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Typography align="center">{mulliganCharacter.abilityShort}</Typography>
                </Box>
                <Button
                  fullWidth
                  color="warning"
                  variant="contained"
                  onClick={() => onMulligan(mulliganCharacter.id)}
                  data-testid="accept-draft-mulligan"
                >
                  Accept {mulliganCharacter.name}
                </Button>
              </Stack>
            ) : (
              <Typography align="center" sx={{ mt: 2 }} color="grey.400">
                The mulligan result is mandatory.
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            {phase === 'mulligan-ready' ? (
              <Button
                color="warning"
                variant="contained"
                startIcon={<CasinoIcon />}
                onClick={() => void handleMulliganRoll()}
                data-testid="roll-draft-mulligan"
              >
                Roll final mulligan
              </Button>
            ) : phase === 'mulligan-spinning' ? (
              <Button color="warning" variant="contained" disabled>
                Rolling final mulligan...
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid="character-draft-roller"
      sx={{ bgcolor: '#050505', color: '#fff', backgroundImage: 'none' }}
    >
      <CardContent>
        <Typography variant="overline" color="warning.main">
          Character Draft
        </Typography>
        <Typography variant="h5" sx={{ color: playerColor }}>
          {playerName}
        </Typography>
        <Typography color="grey.400" sx={{ mb: 2 }}>
          Roll {offer.offeredCharacterIds.length === 1 ? 'your option' : 'your options'}, then{' '}
          {offer.mulliganCharacterId
            ? 'choose one or take the final mulligan.'
            : 'accept the required character.'}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: `repeat(${offer.offeredCharacterIds.length}, minmax(0, 1fr))`,
            },
            gap: { xs: 0.5, sm: 2 },
          }}
        >
          {offer.offeredCharacterIds.map((characterId, index) => {
            const character = characterById.get(characterId);
            return (
              <Box
                key={`${index}-${characterId}`}
                data-testid={`draft-choice-column-${index}`}
                sx={{
                  width: '100%',
                  maxWidth: 320,
                  minWidth: 0,
                  justifySelf: 'center',
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr auto',
                  gap: 1,
                }}
              >
                <CharacterWheel
                  ref={(handle) => {
                    wheelRefs.current[index] = handle;
                  }}
                  characters={scriptCharacters}
                  compact
                  surface="light"
                  defaultSpinDurationMs={2200}
                />
                {phase === 'choosing' && character && (
                  <>
                    <Box
                      data-testid={`draft-choice-description-${index}`}
                      sx={{
                        minWidth: 0,
                        minHeight: 112,
                        height: '100%',
                        display: 'grid',
                        alignContent: 'center',
                        bgcolor: '#fff',
                        color: '#111',
                        borderRadius: 1,
                        p: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Typography align="center" variant="body2">
                        {character.abilityShort}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => onChoose(characterId)}
                      sx={{
                        minWidth: 0,
                        bgcolor: getCharacterTypeColor(character.type),
                        '&:hover': {
                          bgcolor: getCharacterTypeColor(character.type),
                          filter: 'brightness(0.9)',
                        },
                      }}
                      data-testid={`draft-choice-${index}`}
                    >
                      {offer.mulliganCharacterId
                        ? `Select ${character.name}`
                        : `Accept ${character.name}`}
                    </Button>
                  </>
                )}
              </Box>
            );
          })}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          {phase === 'ready' && (
            <Button
              variant="contained"
              startIcon={<CasinoIcon />}
              onClick={() => void handleRoll()}
              data-testid="draft-roll-options"
            >
              Roll options
            </Button>
          )}
          {phase === 'spinning' && (
            <Button variant="contained" disabled>
              Rolling...
            </Button>
          )}
          {phase === 'choosing' && offer.mulliganCharacterId && (
            <Button
              color="warning"
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => setConfirmMulligan(true)}
              data-testid="draft-mulligan"
            >
              Mulligan
            </Button>
          )}
        </Stack>
      </CardContent>

      <Dialog
        open={confirmMulligan}
        onClose={() => setConfirmMulligan(false)}
        slotProps={{
          paper: {
            sx: { bgcolor: '#050505', color: '#fff', backgroundImage: 'none' },
          },
        }}
      >
        <DialogTitle>Take the mulligan?</DialogTitle>
        <DialogContent>
          This replaces all {offer.offeredCharacterIds.length}{' '}
          {offer.offeredCharacterIds.length === 1 ? 'choice' : 'choices'} with one random character.
          The result is final and must be played.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmMulligan(false)}>Keep my choices</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleConfirmMulligan}
            data-testid="confirm-draft-mulligan"
          >
            Continue to mulligan
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
