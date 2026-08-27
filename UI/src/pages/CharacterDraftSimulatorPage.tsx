import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CasinoIcon from '@mui/icons-material/Casino';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { allCharacters, characterMap } from '@/data/characters/index.ts';
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';
import { CharacterDraftRoller } from '@/components/Drafting/CharacterDraftRoller.tsx';
import { importScript } from '@/utils/scriptImporter.ts';
import {
  createDraftSession,
  DraftPresentationMode,
  regenerateDraftOffer,
  resolveDraftPick,
  toDraftCharacters,
  type DraftOffer,
  type DraftPick,
  type DraftSessionConfig,
  type DraftSessionState,
} from '@/utils/drafting/draftSession.ts';
import {
  DraftIdentityKind,
  DraftSetupMode,
  getCharacterDraftRule,
  isProductionDraftSetupMode,
} from '@/utils/drafting/draftRules.ts';
import {
  createGameCharacterDraft,
  maskDraftOfferIdentities,
} from '@/utils/drafting/gameCharacterDraft.ts';
import type {
  CharacterDef,
  CharacterDraftState,
  CharacterType,
  Edition,
  Script,
} from '@/types/index.ts';

const BUILT_IN_SCRIPT_EDITIONS: readonly {
  id: Edition;
  name: string;
}[] = [
  { id: 'tb', name: 'Trouble Brewing' },
  { id: 'bmr', name: 'Bad Moon Rising' },
  { id: 'snv', name: 'Sects & Violets' },
];

const MODE_LABELS: Readonly<Record<DraftSetupMode, string>> = {
  standard: 'Standard',
  atheist: 'Atheist',
  legion: 'Legion',
  lilmonsta: "Lil' Monsta",
  summoner: 'Summoner',
  kazali: 'Kazali',
};

const MODE_CHARACTER_IDS: Readonly<Partial<Record<DraftSetupMode, string>>> = {
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

const FALSE_IDENTITY_KINDS: ReadonlySet<DraftIdentityKind> = new Set([
  DraftIdentityKind.FalseGood,
  DraftIdentityKind.FalseTownsfolk,
  DraftIdentityKind.FalseDemon,
]);

const HIDDEN_TEST_CHARACTERS = allCharacters.filter((character) =>
  FALSE_IDENTITY_KINDS.has(
    getCharacterDraftRule(character.id)?.identity ?? DraftIdentityKind.Actual,
  ),
);

const HIDDEN_TEST_SCRIPT_CHARACTERS = [
  ...(
    [
      ['Townsfolk', 12],
      ['Outsider', 6],
      ['Minion', 6],
      ['Demon', 4],
    ] as const
  ).flatMap(([type, limit]) => {
    const hiddenCharacters = HIDDEN_TEST_CHARACTERS.filter((character) => character.type === type);
    const ordinaryCharacters = allCharacters.filter(
      (character) => character.type === type && getCharacterDraftRule(character.id) === undefined,
    );
    return [...hiddenCharacters, ...ordinaryCharacters].slice(0, limit);
  }),
  characterMap.get('baron'),
].filter((character): character is CharacterDef => character !== undefined);

function getBuiltInScript(edition: Edition, name: string): Script {
  return {
    id: edition,
    name,
    author: 'The Pandemonium Institute',
    characterIds: allCharacters
      .filter((character) => character.edition === edition)
      .map((character) => character.id),
  };
}

const BUILT_IN_SCRIPTS = BUILT_IN_SCRIPT_EDITIONS.map(({ id, name }) => getBuiltInScript(id, name));

function getScriptCharacters(script: Script): CharacterDef[] {
  return script.characterIds
    .map((id) => characterMap.get(id))
    .filter((character): character is CharacterDef => character !== undefined);
}

function getAvailableModes(scriptCharacters: readonly CharacterDef[]): DraftSetupMode[] {
  const characterIds = new Set(scriptCharacters.map((character) => character.id));
  return Object.values(DraftSetupMode).filter((mode) => {
    if (!isProductionDraftSetupMode(mode)) return false;
    if (mode === DraftSetupMode.Standard) return true;
    const characterId = MODE_CHARACTER_IDS[mode];
    return characterId !== undefined && characterIds.has(characterId);
  });
}

export function CharacterDraftSimulatorPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customScript, setCustomScript] = useState<Script | null>(null);
  const [scriptId, setScriptId] = useState('bmr');
  const [playerCount, setPlayerCount] = useState(7);
  const [setupMode, setSetupMode] = useState<DraftSetupMode>(DraftSetupMode.Standard);
  const [presentationMode, setPresentationMode] = useState<DraftPresentationMode>(
    DraftPresentationMode.Open,
  );
  const [session, setSession] = useState<DraftSessionState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [hiddenTestCharacterId, setHiddenTestCharacterId] = useState(
    HIDDEN_TEST_CHARACTERS[0]?.id ?? '',
  );
  const [hiddenTestDraft, setHiddenTestDraft] = useState<CharacterDraftState | null>(null);
  const [hiddenTestError, setHiddenTestError] = useState<string | null>(null);

  const scripts = useMemo(
    () => (customScript ? [...BUILT_IN_SCRIPTS, customScript] : BUILT_IN_SCRIPTS),
    [customScript],
  );
  const selectedScript = scripts.find((script) => script.id === scriptId) ?? scripts[0];
  const scriptCharacters = useMemo(() => getScriptCharacters(selectedScript), [selectedScript]);
  const draftCharacters = useMemo(() => toDraftCharacters(scriptCharacters), [scriptCharacters]);
  const availableModes = useMemo(() => getAvailableModes(scriptCharacters), [scriptCharacters]);
  const config: DraftSessionConfig = useMemo(
    () => ({ playerCount, scriptCharacters: draftCharacters, setupMode, presentationMode }),
    [draftCharacters, playerCount, presentationMode, setupMode],
  );

  const handleConfigurationChange = () => {
    setSession(null);
    setHiddenTestDraft(null);
    setHiddenTestError(null);
  };

  const handleScriptChange = (nextScriptId: string) => {
    setScriptId(nextScriptId);
    setSetupMode(DraftSetupMode.Standard);
    handleConfigurationChange();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = importScript(JSON.parse(await file.text()) as unknown);
      setCustomScript(parsed);
      setScriptId(parsed.id);
      setSetupMode(DraftSetupMode.Standard);
      setSession(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import script.');
    } finally {
      event.target.value = '';
    }
  };

  const handleResolve = (characterId: string, resolution: DraftPick['resolution']) => {
    if (!session) return;
    setSession(resolveDraftPick(session, config, characterId, resolution));
  };

  const handleStartHiddenIdentityTest = () => {
    setHiddenTestError(null);
    const hiddenCharacter = characterMap.get(hiddenTestCharacterId);
    if (!hiddenCharacter) {
      setHiddenTestError('Select a hidden character to test.');
      return;
    }

    const hiddenScriptCharacters = toDraftCharacters(HIDDEN_TEST_SCRIPT_CHARACTERS);
    const hiddenConfig: DraftSessionConfig = {
      playerCount,
      scriptCharacters: hiddenScriptCharacters,
      setupMode: DraftSetupMode.Standard,
      presentationMode: DraftPresentationMode.Open,
    };
    const playerIds = Array.from({ length: playerCount }, (_, index) => `test-player-${index + 1}`);
    const baseDraft = createGameCharacterDraft(playerIds, hiddenConfig, () => 0);
    const initialSession = createDraftSession(hiddenConfig, () => 0);
    if (
      baseDraft.status === 'blocked' ||
      !initialSession.legalCandidateIds.includes(hiddenCharacter.id)
    ) {
      setHiddenTestError(
        `${hiddenCharacter.name} is not legal at the start of a ${playerCount}-player test draft.`,
      );
      return;
    }

    const apparentTypes =
      hiddenCharacter.id === 'lunatic'
        ? new Set<CharacterType>(['Demon'])
        : hiddenCharacter.id === 'drunk'
          ? new Set<CharacterType>(['Townsfolk'])
          : new Set<CharacterType>(['Townsfolk', 'Outsider']);
    const supportingCandidates = initialSession.legalCandidateIds.filter((characterId) => {
      if (characterId === hiddenCharacter.id) return false;
      const character = characterMap.get(characterId);
      const identity = getCharacterDraftRule(characterId)?.identity ?? DraftIdentityKind.Actual;
      return (
        character !== undefined &&
        !apparentTypes.has(character.type) &&
        !FALSE_IDENTITY_KINDS.has(identity)
      );
    });
    const forcedActualOffer: DraftOffer = {
      offeredCharacterIds: [hiddenCharacter.id, ...supportingCandidates.slice(0, 2)],
      mulliganCharacterId: supportingCandidates[2] ?? null,
      rolledCharacterTypes: [],
    };
    const forcedVisibleOffer = maskDraftOfferIdentities(
      forcedActualOffer,
      initialSession.legalCandidateIds.length,
      hiddenConfig,
      [],
      Math.random,
    );

    setHiddenTestDraft({
      ...baseDraft,
      activePlayerId: playerIds[0],
      entries: [{ playerId: playerIds[0], offer: forcedVisibleOffer }],
      revision: baseDraft.revision + 1,
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back to home"
            onClick={() => navigate('/')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Character Draft Simulator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Draft configuration
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="draft-script-label">Script</InputLabel>
              <Select
                labelId="draft-script-label"
                label="Script"
                value={selectedScript.id}
                onChange={(event) => handleScriptChange(event.target.value)}
              >
                {scripts.map((script) => (
                  <MenuItem key={script.id} value={script.id}>
                    {script.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="draft-presentation-mode-label">Drafting mode</InputLabel>
              <Select
                labelId="draft-presentation-mode-label"
                label="Drafting mode"
                value={presentationMode}
                onChange={(event) => {
                  setPresentationMode(event.target.value as DraftPresentationMode);
                  handleConfigurationChange();
                }}
              >
                {Object.values(DraftPresentationMode).map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {PRESENTATION_MODE_LABELS[mode]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="draft-player-count-label">Players</InputLabel>
              <Select
                labelId="draft-player-count-label"
                label="Players"
                value={playerCount}
                onChange={(event) => {
                  setPlayerCount(Number(event.target.value));
                  handleConfigurationChange();
                }}
              >
                {Array.from({ length: 11 }, (_, index) => index + 5).map((count) => (
                  <MenuItem key={count} value={count}>
                    {count}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="draft-mode-label">Setup mode</InputLabel>
              <Select
                labelId="draft-mode-label"
                label="Setup mode"
                value={setupMode}
                onChange={(event) => {
                  setSetupMode(event.target.value as DraftSetupMode);
                  handleConfigurationChange();
                }}
              >
                {availableModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {MODE_LABELS[mode]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<CasinoIcon />}
              onClick={() => setSession(createDraftSession(config))}
            >
              Start new draft
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import script JSON
            </Button>
            {session && session.status !== 'complete' && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setSession(regenerateDraftOffer(session, config))}
              >
                Regenerate current offer
              </Button>
            )}
          </Stack>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => void handleImport(event)}
            data-testid="draft-script-file"
          />
          {importError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {importError}
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }} data-testid="hidden-identity-test-tool">
          <Typography variant="h6" gutterBottom>
            Hidden character test
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Force a false-identity character into Player 1's offer to verify the Storyteller
            warning, private handoff, and secret actual-character resolution without changing a real
            game.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <FormControl fullWidth>
              <InputLabel id="hidden-test-character-label">Hidden character</InputLabel>
              <Select
                labelId="hidden-test-character-label"
                label="Hidden character"
                value={hiddenTestCharacterId}
                onChange={(event) => {
                  setHiddenTestCharacterId(event.target.value);
                  setHiddenTestDraft(null);
                  setHiddenTestError(null);
                }}
              >
                {HIDDEN_TEST_CHARACTERS.map((character) => (
                  <MenuItem key={character.id} value={character.id}>
                    {character.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="warning"
              startIcon={<ScienceIcon />}
              onClick={handleStartHiddenIdentityTest}
              sx={{ minWidth: { sm: 240 } }}
            >
              Test hidden draft
            </Button>
          </Stack>
          {hiddenTestError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {hiddenTestError}
            </Alert>
          )}
        </Paper>

        {!session && (
          <Alert severity="info">
            This standalone tool does not create or modify a game. Start a draft to test how each
            player choice changes the next legal offer.
          </Alert>
        )}

        {session?.status === 'drafting' && session.currentOffer && (
          <CharacterDraftRoller
            key={`${session.picks.length}-${session.currentOffer.offeredCharacterIds.join('-')}`}
            playerName={`Player ${session.picks.length + 1}`}
            scriptCharacters={scriptCharacters.filter((character) =>
              draftCharacters.some((draftCharacter) => draftCharacter.id === character.id),
            )}
            offer={session.currentOffer}
            onChoose={(characterId) => handleResolve(characterId, 'choice')}
            onMulligan={(characterId) => handleResolve(characterId, 'mulligan')}
          />
        )}

        {session?.status === 'blocked' && (
          <Alert severity="warning" data-testid="draft-blocked">
            <Typography fontWeight={700}>The draft cannot continue.</Typography>
            {session.blockedReason}
          </Alert>
        )}

        {session?.status === 'complete' && (
          <Alert severity="success" data-testid="draft-complete">
            Draft complete. All {playerCount} simulated players have a legal character.
          </Alert>
        )}

        {session && (
          <Paper sx={{ p: 2, mt: 2 }} data-testid="draft-diagnostics">
            <Typography variant="h6">Storyteller diagnostics</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {session.picks.length} of {playerCount} players committed ·{' '}
              {session.legalCandidateIds.length} legal candidates for the current player
            </Typography>
            {session.currentOffer?.rolledCharacterTypes.length ? (
              <Typography variant="body2" data-testid="draft-rolled-types" gutterBottom>
                Secret type roll: {session.currentOffer.rolledCharacterTypes.join(' or ')}
              </Typography>
            ) : null}
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              {session.picks.map((pick) => {
                const character = characterMap.get(pick.characterId);
                return (
                  <Chip
                    key={pick.playerIndex}
                    label={`P${pick.playerIndex + 1}: ${character?.name ?? pick.characterId}${
                      pick.resolution === 'mulligan' ? ' (mulligan)' : ''
                    }`}
                  />
                );
              })}
            </Stack>
          </Paper>
        )}
      </Container>

      {hiddenTestDraft && (
        <CharacterDraftDialog
          open
          playerIds={hiddenTestDraft.playerOrder}
          playerNames={Object.fromEntries(
            hiddenTestDraft.playerOrder.map((playerId, index) => [
              playerId,
              `Test Player ${index + 1}`,
            ]),
          )}
          scriptCharacters={HIDDEN_TEST_SCRIPT_CHARACTERS}
          draftState={hiddenTestDraft}
          onClose={() => setHiddenTestDraft(null)}
          onDraftChange={setHiddenTestDraft}
          onDraftComplete={() => setHiddenTestDraft(null)}
        />
      )}
    </Box>
  );
}
