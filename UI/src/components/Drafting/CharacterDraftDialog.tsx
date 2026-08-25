import { useMemo, useState } from 'react';
import CasinoIcon from '@mui/icons-material/Casino';
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {
  CharacterDef,
  CharacterDraftState,
  CharacterDraftSetupMode,
  PlayerId,
} from '@/types/index.ts';
import { CharacterDraftRoller } from '@/components/Drafting/CharacterDraftRoller.tsx';
import {
  DraftPresentationMode,
  toDraftCharacters,
  type DraftPick,
  type DraftSessionConfig,
} from '@/utils/drafting/draftSession.ts';
import { DraftSetupMode, isProductionDraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createGameCharacterDraft,
  regenerateGameCharacterDraftOffer,
  resolveGameCharacterDraft,
} from '@/utils/drafting/gameCharacterDraft.ts';

const SETUP_MODE_LABELS: Readonly<Record<CharacterDraftSetupMode, string>> = {
  standard: 'Standard',
  atheist: 'Atheist',
  legion: 'Legion',
  lilmonsta: "Lil' Monsta",
  summoner: 'Summoner',
  kazali: 'Kazali',
};

const SETUP_MODE_CHARACTER_IDS: Readonly<Partial<Record<CharacterDraftSetupMode, string>>> = {
  atheist: 'atheist',
  legion: 'legion',
  lilmonsta: 'lilmonsta',
  summoner: 'summoner',
  kazali: 'kazali',
};

const PRESENTATION_MODE_LABELS: Readonly<Record<DraftPresentationMode, string>> = {
  open: 'Open character draft',
  'secret-single-type': 'Secret single character type',
  'secret-two-types': 'Secret two character types',
};

export interface CharacterDraftDialogProps {
  open: boolean;
  playerIds: PlayerId[];
  playerNames: Readonly<Record<PlayerId, string>>;
  scriptCharacters: CharacterDef[];
  draftState?: CharacterDraftState;
  onClose: () => void;
  onDraftChange: (draft: CharacterDraftState) => void;
  onDraftComplete: (draft: CharacterDraftState) => void;
}

export function CharacterDraftDialog({
  open,
  playerIds,
  playerNames,
  scriptCharacters,
  draftState,
  onClose,
  onDraftChange,
  onDraftComplete,
}: CharacterDraftDialogProps) {
  const [setupMode, setSetupMode] = useState<CharacterDraftSetupMode>('standard');
  const [presentationMode, setPresentationMode] = useState<DraftPresentationMode>(
    DraftPresentationMode.Open,
  );
  const [privateHandoff, setPrivateHandoff] = useState(false);
  const draftCharacters = useMemo(() => toDraftCharacters(scriptCharacters), [scriptCharacters]);
  const draftableCharacters = useMemo(() => {
    const draftableIds = new Set(draftCharacters.map((character) => character.id));
    return scriptCharacters.filter((character) => draftableIds.has(character.id));
  }, [draftCharacters, scriptCharacters]);
  const availableSetupModes = useMemo(() => {
    const scriptIds = new Set(draftCharacters.map((character) => character.id));
    return Object.values(DraftSetupMode).filter((mode) => {
      if (!isProductionDraftSetupMode(mode)) return false;
      if (mode === DraftSetupMode.Standard) return true;
      const characterId = SETUP_MODE_CHARACTER_IDS[mode];
      return characterId !== undefined && scriptIds.has(characterId);
    });
  }, [draftCharacters]);
  const characterNameById = useMemo(
    () => new Map(scriptCharacters.map((character) => [character.id, character.name])),
    [scriptCharacters],
  );

  const config: DraftSessionConfig = useMemo(
    () => ({
      playerCount: playerIds.length,
      scriptCharacters: draftCharacters,
      setupMode: (draftState?.setupMode ?? setupMode) as DraftSetupMode,
      presentationMode: draftState?.presentationMode ?? presentationMode,
    }),
    [
      draftCharacters,
      draftState?.presentationMode,
      draftState?.setupMode,
      playerIds.length,
      presentationMode,
      setupMode,
    ],
  );

  const currentEntry = draftState?.entries[draftState.currentPlayerIndex];
  const currentPlayerName = currentEntry
    ? (playerNames[currentEntry.playerId] ?? 'Unknown player')
    : '';

  const handleStart = () => {
    const draft = createGameCharacterDraft(playerIds, config);
    onDraftChange(draft);
  };

  const handleResolve = (characterId: string, resolution: DraftPick['resolution']) => {
    if (!draftState) return;
    const next = resolveGameCharacterDraft(draftState, config, characterId, resolution);
    setPrivateHandoff(false);
    if (next.status === 'complete') {
      onDraftComplete(next);
    } else {
      onDraftChange(next);
    }
  };

  if (privateHandoff && currentEntry) {
    return (
      <Dialog open={open} fullWidth maxWidth="lg">
        <DialogContent sx={{ p: { xs: 1, sm: 3 } }}>
          <CharacterDraftRoller
            playerName={currentPlayerName}
            scriptCharacters={draftableCharacters}
            offer={currentEntry.offer}
            onChoose={(characterId) => handleResolve(characterId, 'choice')}
            onMulligan={(characterId) => handleResolve(characterId, 'mulligan')}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Character Draft</DialogTitle>
      <DialogContent>
        {!draftState ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Drafts are private and sequential. Seating will be randomized after the final choice.
            </Alert>
            {draftCharacters.some((character) => character.id === 'kazali') && (
              <Alert severity="warning">
                Kazali drafting is not yet available because its hidden post-draft Minion
                conversions require a separate Storyteller assignment step.
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel id="game-draft-setup-mode-label">Setup mode</InputLabel>
              <Select
                labelId="game-draft-setup-mode-label"
                label="Setup mode"
                value={setupMode}
                onChange={(event) => setSetupMode(event.target.value as CharacterDraftSetupMode)}
              >
                {availableSetupModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {SETUP_MODE_LABELS[mode]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="game-draft-presentation-mode-label">Drafting mode</InputLabel>
              <Select
                labelId="game-draft-presentation-mode-label"
                label="Drafting mode"
                value={presentationMode}
                onChange={(event) =>
                  setPresentationMode(event.target.value as DraftPresentationMode)
                }
              >
                {Object.values(DraftPresentationMode).map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {PRESENTATION_MODE_LABELS[mode]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<CasinoIcon />} onClick={handleStart}>
              Generate draft
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="h6">Storyteller board</Typography>
              <Typography color="text.secondary">
                {draftState.currentPlayerIndex} of {draftState.playerOrder.length} players complete
              </Typography>
            </Box>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              {draftState.entries.map((entry, index) => (
                <Chip
                  key={entry.playerId}
                  color={entry.selectedCharacterId ? 'success' : 'default'}
                  label={`${index + 1}. ${playerNames[entry.playerId] ?? 'Unknown'}: ${
                    entry.selectedCharacterId
                      ? entry.actualCharacterId &&
                        entry.actualCharacterId !== entry.apparentCharacterId
                        ? `${
                            characterNameById.get(entry.actualCharacterId) ??
                            entry.actualCharacterId
                          } (appears as ${
                            characterNameById.get(entry.apparentCharacterId ?? '') ??
                            entry.apparentCharacterId
                          })`
                        : (characterNameById.get(entry.selectedCharacterId) ??
                          entry.selectedCharacterId)
                      : 'Waiting'
                  }`}
                />
              ))}
            </Stack>
            {draftState.status === 'blocked' && (
              <Alert severity="warning">{draftState.blockedReason}</Alert>
            )}
            {currentEntry && draftState.status === 'drafting' && (
              <Alert severity="info" data-testid="game-draft-current-player">
                <Typography fontWeight={700}>Next: {currentPlayerName}</Typography>
                <Typography variant="body2">
                  {currentEntry.offer.legalCandidateCount} viable characters
                  {currentEntry.offer.rolledCharacterTypes.length
                    ? ` · Secret type roll: ${currentEntry.offer.rolledCharacterTypes.join(' or ')}`
                    : ''}
                </Typography>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {draftState?.status === 'drafting' && currentEntry && (
          <>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => onDraftChange(regenerateGameCharacterDraftOffer(draftState, config))}
            >
              Regenerate offer
            </Button>
            <Button variant="contained" onClick={() => setPrivateHandoff(true)}>
              Hand device to {currentPlayerName}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
