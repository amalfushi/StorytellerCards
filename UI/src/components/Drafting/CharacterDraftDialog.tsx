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
  CharacterDraftSetupMode,
  CharacterDraftState,
  PlayerId,
} from '@/types/index.ts';
import { CharacterDraftRoller } from '@/components/Drafting/CharacterDraftRoller.tsx';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
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
  selectGameCharacterDraftPlayer,
} from '@/utils/drafting/gameCharacterDraft.ts';
import { calculateAdaptiveTargets } from '@/utils/adaptiveDistribution.ts';

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

const VARIABLE_MODIFIER_OPTIONS: Readonly<
  Record<string, { label: string; values: readonly number[] }>
> = {
  balloonist: { label: 'Balloonist Outsider change', values: [0, 1] },
  hermit: { label: 'Hermit Outsider change', values: [-1, 0] },
  godfather: { label: 'Godfather Outsider change', values: [-1, 1] },
  xaan: { label: 'Xaan Outsider count', values: [0, 1, 2, 3, 4] },
  lordoftyphon: {
    label: 'Lord of Typhon Outsider change',
    values: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
  },
};

export interface CharacterDraftDialogProps {
  open: boolean;
  playerIds: PlayerId[];
  playerNames: Readonly<Record<PlayerId, string>>;
  playerColors?: Readonly<Record<PlayerId, string>>;
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
  playerColors = {},
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
  const [variableModifierValues, setVariableModifierValues] = useState<Record<string, number>>({});
  const [villageIdiotCopies, setVillageIdiotCopies] = useState(1);
  const [privateHandoff, setPrivateHandoff] = useState(false);

  const draftCharacters = useMemo(() => toDraftCharacters(scriptCharacters), [scriptCharacters]);
  const draftableCharacters = useMemo(() => {
    const draftableIds = new Set(draftCharacters.map((character) => character.id));
    return scriptCharacters.filter((character) => draftableIds.has(character.id));
  }, [draftCharacters, scriptCharacters]);
  const scriptCharacterIds = useMemo(
    () => new Set(draftCharacters.map((character) => character.id)),
    [draftCharacters],
  );
  const availableSetupModes = useMemo(
    () =>
      Object.values(DraftSetupMode).filter((mode) => {
        if (!isProductionDraftSetupMode(mode)) return false;
        if (mode === DraftSetupMode.Standard) return true;
        const characterId = SETUP_MODE_CHARACTER_IDS[mode];
        return characterId !== undefined && scriptCharacterIds.has(characterId);
      }),
    [scriptCharacterIds],
  );
  const characterById = useMemo(
    () => new Map(scriptCharacters.map((character) => [character.id, character])),
    [scriptCharacters],
  );
  const activeModifierControls = useMemo(
    () => Object.entries(VARIABLE_MODIFIER_OPTIONS).filter(([id]) => scriptCharacterIds.has(id)),
    [scriptCharacterIds],
  );

  const config: DraftSessionConfig = useMemo(
    () => ({
      playerCount: playerIds.length,
      scriptCharacters: draftCharacters,
      setupMode: (draftState?.setupMode ?? setupMode) as DraftSetupMode,
      presentationMode: draftState?.presentationMode ?? presentationMode,
      variableModifierValues: draftState?.variableModifierValues ?? variableModifierValues,
      characterCopyTargets:
        draftState?.characterCopyTargets ??
        (scriptCharacterIds.has('villageidiot') ? { villageidiot: villageIdiotCopies } : undefined),
    }),
    [
      draftCharacters,
      draftState?.characterCopyTargets,
      draftState?.presentationMode,
      draftState?.setupMode,
      draftState?.variableModifierValues,
      playerIds.length,
      presentationMode,
      scriptCharacterIds,
      setupMode,
      variableModifierValues,
      villageIdiotCopies,
    ],
  );

  const currentEntry = draftState?.activePlayerId
    ? draftState.entries.find((entry) => entry.playerId === draftState.activePlayerId)
    : draftState?.entries[draftState.currentPlayerIndex]?.actualCharacterId === undefined
      ? draftState?.entries[draftState.currentPlayerIndex]
      : undefined;
  const currentPlayerName = currentEntry
    ? (playerNames[currentEntry.playerId] ?? 'Unknown player')
    : '';
  const completedCount =
    draftState?.entries.filter((entry) => entry.actualCharacterId !== undefined).length ?? 0;
  const committedCharacterIds =
    draftState?.entries
      .map((entry) => entry.actualCharacterId)
      .filter((id): id is string => id !== undefined) ?? [];
  const countMode = (draftState?.setupMode ?? setupMode) as CharacterDraftSetupMode;
  const modeCharacterId = SETUP_MODE_CHARACTER_IDS[countMode];
  const configuredModifiers = draftState?.variableModifierValues ?? variableModifierValues;
  const configuredVillageIdiotCopies =
    draftState?.characterCopyTargets?.villageidiot ?? villageIdiotCopies;
  const setupTargets = calculateAdaptiveTargets(
    playerIds.length,
    [...committedCharacterIds, ...(modeCharacterId ? [modeCharacterId] : [])],
    {
      variableModifierValues: configuredModifiers,
      xaanX: configuredModifiers.xaan,
      extraVillageIdiots: Math.max(0, configuredVillageIdiotCopies - 1),
    },
  );

  const handleStart = () => {
    onDraftChange(createGameCharacterDraft(playerIds, config));
  };

  const handleSelectPlayer = (playerId: PlayerId) => {
    if (!draftState) return;
    onDraftChange(selectGameCharacterDraftPlayer(draftState, config, playerId));
  };

  const handleResolve = (characterId: string, resolution: DraftPick['resolution']) => {
    if (!draftState) return;
    onDraftChange(resolveGameCharacterDraft(draftState, config, characterId, resolution));
    setPrivateHandoff(false);
  };

  if (privateHandoff && currentEntry) {
    return (
      <Dialog
        open={open}
        fullScreen
        data-testid="private-draft-handoff"
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.98)',
              backdropFilter: 'blur(24px)',
            },
          },
          paper: {
            sx: {
              bgcolor: '#050505',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 1, sm: 3 }, display: 'grid', placeItems: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 1100 }}>
            <CharacterDraftRoller
              playerName={currentPlayerName}
              playerColor={playerColors[currentEntry.playerId]}
              scriptCharacters={draftableCharacters}
              offer={currentEntry.offer}
              onChoose={(characterId) => handleResolve(characterId, 'choice')}
              onMulligan={(characterId) => handleResolve(characterId, 'mulligan')}
            />
          </Box>
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
              The Storyteller chooses each player&apos;s turn. Seating is randomized after the final
              choice and must be reviewed before Demon bluffs.
            </Alert>
            {scriptCharacterIds.has('kazali') && (
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
            {scriptCharacterIds.has('villageidiot') && (
              <FormControl fullWidth>
                <InputLabel id="village-idiot-copy-target-label">Village Idiot copies</InputLabel>
                <Select
                  labelId="village-idiot-copy-target-label"
                  label="Village Idiot copies"
                  value={villageIdiotCopies}
                  onChange={(event) => setVillageIdiotCopies(Number(event.target.value))}
                >
                  {[1, 2, 3].map((copies) => (
                    <MenuItem key={copies} value={copies}>
                      {copies}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {activeModifierControls.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                  Variable setup choices
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  These values are used only if the corresponding character enters play.
                </Typography>
                <Stack spacing={1}>
                  {activeModifierControls.map(([id, control]) => (
                    <FormControl fullWidth key={id}>
                      <InputLabel id={`${id}-modifier-label`}>{control.label}</InputLabel>
                      <Select
                        labelId={`${id}-modifier-label`}
                        label={control.label}
                        value={variableModifierValues[id] ?? ''}
                        onChange={(event) => {
                          const value = String(event.target.value);
                          setVariableModifierValues((current) => {
                            const next = { ...current };
                            if (value === '') delete next[id];
                            else next[id] = Number(value);
                            return next;
                          });
                        }}
                      >
                        <MenuItem value="">Automatic legal value</MenuItem>
                        {control.values.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value > 0 ? `+${value}` : value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </Box>
            )}
            <Button variant="contained" startIcon={<CasinoIcon />} onClick={handleStart}>
              Generate draft
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="h6">Storyteller board</Typography>
              <Typography color="text.secondary">
                {completedCount} of {draftState.playerOrder.length} players complete
              </Typography>
            </Box>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              {draftState.playerOrder.map((playerId) => {
                const entry = draftState.entries.find(
                  (candidate) => candidate.playerId === playerId,
                );
                const selectedCharacter = entry?.actualCharacterId
                  ? characterById.get(entry.actualCharacterId)
                  : undefined;
                const isActive = draftState.activePlayerId === playerId;
                const playerColor = playerColors[playerId] ?? '#9e9e9e';
                const selectedColor = selectedCharacter
                  ? getCharacterTypeColor(selectedCharacter.type)
                  : undefined;
                const selectedLabel =
                  entry?.actualCharacterId && entry.actualCharacterId !== entry.apparentCharacterId
                    ? `${selectedCharacter?.name ?? entry.actualCharacterId} (appears as ${
                        characterById.get(entry.apparentCharacterId ?? '')?.name ??
                        entry.apparentCharacterId
                      })`
                    : selectedCharacter?.name;
                return (
                  <Chip
                    key={playerId}
                    clickable={!selectedCharacter && draftState.status === 'drafting'}
                    onClick={
                      !selectedCharacter && draftState.status === 'drafting'
                        ? () => handleSelectPlayer(playerId)
                        : undefined
                    }
                    data-testid={`draft-player-${playerId}`}
                    label={`${playerNames[playerId] ?? 'Unknown'}: ${
                      selectedLabel ?? (isActive ? 'Drafting now' : 'Not drafted')
                    }`}
                    sx={{
                      bgcolor:
                        selectedColor ?? (isActive ? playerColor : 'action.disabledBackground'),
                      color: selectedColor || isActive ? '#fff' : 'text.secondary',
                      border: isActive ? `3px solid ${playerColor}` : '1px solid transparent',
                      fontWeight: isActive ? 900 : 700,
                      boxShadow: isActive ? `0 0 14px ${playerColor}` : 'none',
                    }}
                  />
                );
              })}
            </Stack>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                Current setup targets
              </Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
                {(
                  [
                    ['Townsfolk', setupTargets.townsfolk],
                    ['Outsider', setupTargets.outsiders],
                    ['Minion', setupTargets.minions],
                    ['Demon', setupTargets.demons],
                  ] as const
                ).map(([type, count]) => (
                  <Chip
                    key={type}
                    label={`${type}: ${count}`}
                    sx={{
                      bgcolor: getCharacterTypeColor(type),
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  />
                ))}
              </Stack>
            </Box>
            {draftState.status === 'blocked' && (
              <Alert severity="warning">{draftState.blockedReason}</Alert>
            )}
            {currentEntry && draftState.status === 'drafting' && (
              <Alert
                severity="info"
                data-testid="game-draft-current-player"
                sx={{ border: `3px solid ${playerColors[currentEntry.playerId] ?? '#90caf9'}` }}
              >
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{ color: playerColors[currentEntry.playerId] }}
                >
                  Drafting now: {currentPlayerName}
                </Typography>
                <Typography variant="body2">
                  {currentEntry.offer.legalCandidateCount} viable characters
                  {currentEntry.offer.rolledCharacterTypes.length
                    ? ` · Secret type roll: ${currentEntry.offer.rolledCharacterTypes.join(' or ')}`
                    : ''}
                </Typography>
              </Alert>
            )}
            {!currentEntry && draftState.status === 'drafting' && (
              <Alert severity="info">
                Select any grey player pill to generate their private offer.
              </Alert>
            )}
            {draftState.status === 'complete' && (
              <Alert severity="success">
                Every player has drafted. Confirm the draft to randomize and review seating.
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
        {draftState?.status === 'complete' && (
          <Button variant="contained" color="warning" onClick={() => onDraftComplete(draftState)}>
            Confirm draft and review seating
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
