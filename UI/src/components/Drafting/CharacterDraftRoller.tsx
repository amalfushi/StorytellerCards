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
  scriptCharacters: CharacterDef[];
  offer: DraftOffer;
  onChoose: (characterId: string) => void;
  onMulligan: (characterId: string) => void;
}

type RollerPhase = 'ready' | 'spinning' | 'choosing' | 'mulligan-ready' | 'mulligan-spinning';

export function CharacterDraftRoller(props: CharacterDraftRollerProps) {
  const offerKey = `${props.offer.offeredCharacterIds.join('|')}|${props.offer.mulliganCharacterId}`;
  return <CharacterDraftRollerOffer key={offerKey} {...props} />;
}

function CharacterDraftRollerOffer({
  playerName,
  scriptCharacters,
  offer,
  onChoose,
  onMulligan,
}: CharacterDraftRollerProps) {
  const firstWheelRef = useRef<CharacterWheelHandle | null>(null);
  const secondWheelRef = useRef<CharacterWheelHandle | null>(null);
  const thirdWheelRef = useRef<CharacterWheelHandle | null>(null);
  const wheelRefs = useMemo(() => [firstWheelRef, secondWheelRef, thirdWheelRef] as const, []);
  const mulliganWheelRef = useRef<CharacterWheelHandle | null>(null);
  const [phase, setPhase] = useState<RollerPhase>('ready');
  const [confirmMulligan, setConfirmMulligan] = useState(false);

  const characterById = useMemo(
    () => new Map(scriptCharacters.map((character) => [character.id, character])),
    [scriptCharacters],
  );

  const handleRoll = useCallback(async () => {
    if (phase !== 'ready') return;
    setPhase('spinning');
    await Promise.all(
      offer.offeredCharacterIds.map((characterId, index) =>
        wheelRefs[index].current?.spinTo(characterId),
      ),
    );
    setPhase('choosing');
  }, [offer.offeredCharacterIds, phase, wheelRefs]);

  const handleConfirmMulligan = useCallback(() => {
    setConfirmMulligan(false);
    setPhase('mulligan-ready');
  }, []);

  const handleMulliganRoll = useCallback(async () => {
    if (phase !== 'mulligan-ready' || !mulliganWheelRef.current) return;
    setPhase('mulligan-spinning');
    await mulliganWheelRef.current.spinTo(offer.mulliganCharacterId);
    onMulligan(offer.mulliganCharacterId);
  }, [offer.mulliganCharacterId, onMulligan, phase]);

  if (phase === 'mulligan-ready' || phase === 'mulligan-spinning') {
    return (
      <Card data-testid="character-draft-roller">
        <CardContent>
          <Typography variant="overline" color="warning.main">
            Final Mulligan
          </Typography>
          <Typography variant="h5" gutterBottom>
            {playerName}
          </Typography>
          <Box sx={{ maxWidth: 360, mx: 'auto' }}>
            <CharacterWheel ref={mulliganWheelRef} characters={scriptCharacters} compact />
          </Box>
          <Typography align="center" sx={{ mt: 2 }} color="text.secondary">
            The mulligan result is mandatory.
          </Typography>
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
            ) : (
              <Button color="warning" variant="contained" disabled>
                Rolling final mulligan...
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="character-draft-roller">
      <CardContent>
        <Typography variant="overline" color="warning.main">
          Character Draft
        </Typography>
        <Typography variant="h5">{playerName}</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Roll three options, then choose one or take the final mulligan.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 0.5, sm: 2 },
          }}
        >
          {offer.offeredCharacterIds.map((characterId, index) => {
            const character = characterById.get(characterId);
            return (
              <Stack key={`${index}-${characterId}`} spacing={1} sx={{ minWidth: 0 }}>
                <CharacterWheel ref={wheelRefs[index]} characters={scriptCharacters} compact />
                {phase === 'choosing' && character && (
                  <Button
                    variant="outlined"
                    onClick={() => onChoose(characterId)}
                    sx={{
                      minWidth: 0,
                      borderColor: getCharacterTypeColor(character.type),
                      color: getCharacterTypeColor(character.type),
                    }}
                    data-testid={`draft-choice-${index}`}
                  >
                    {character.name}
                  </Button>
                )}
              </Stack>
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
          {phase === 'choosing' && (
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

      <Dialog open={confirmMulligan} onClose={() => setConfirmMulligan(false)}>
        <DialogTitle>Take the mulligan?</DialogTitle>
        <DialogContent>
          This replaces all three choices with one random character. The result is final and must be
          played.
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
