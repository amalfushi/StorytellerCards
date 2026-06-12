import { useState, useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import TokenIcon from '@mui/icons-material/Token';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CasinoIcon from '@mui/icons-material/Casino';
import type { CharacterDef, Alignment, PlayerId } from '@/types/index.ts';
import type { TownSquarePlayer } from '@/components/TownSquare/PlayerToken.tsx';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';
import { filterCharacterDropdownOptions } from '@/utils/characterAssignment.ts';

/** Type display order for grouping in the character selector. */
const TYPE_ORDER = ['Townsfolk', 'Outsider', 'Minion', 'Demon', 'Traveller'];

/** Character option extended with section info for the grouped Autocomplete. */
type PlayerActionKey = PlayerId | number;
type PlayerActionHandler = ((value: PlayerId) => void) | ((value: number) => void);
type SaveCharacterHandler =
  | ((value: PlayerId, updates: { characterId?: string; actualAlignment?: Alignment }) => void)
  | ((value: number, updates: { characterId?: string; actualAlignment?: Alignment }) => void);

function playerDisplayName(player: TownSquarePlayer): string {
  return player.name ?? player['playerName'] ?? 'Unknown player';
}

function playerDisplaySeat(player: TownSquarePlayer): number {
  return player.seatNumber ?? player['seat'] ?? 0;
}

function playerActionKey(player: TownSquarePlayer): PlayerActionKey {
  return player.seatNumber !== undefined ? player.playerId : (player['seat'] ?? player.playerId);
}

function invokePlayerAction(handler: PlayerActionHandler, player: TownSquarePlayer): void {
  const key = playerActionKey(player);
  if (typeof key === 'number') {
    (handler as (value: number) => void)(key);
  } else {
    (handler as (value: PlayerId) => void)(key);
  }
}

interface CharacterOption {
  id: string;
  name: string;
  type: string;
  section: string;
  sectionOrder: number;
  typeOrder: number;
}

export interface PlayerActionsModalProps {
  open: boolean;
  player: TownSquarePlayer | null;
  showCharacters: boolean;
  scriptCharacters: CharacterDef[];
  allCharacters?: CharacterDef[];
  demonBluffs?: string[];
  bluffCharacters?: CharacterDef[];
  availableBluffCharacters?: CharacterDef[];
  bluffLabel?: string;
  onClose: () => void;
  onToggleAlive: PlayerActionHandler;
  onToggleGhostVote: PlayerActionHandler;
  onRemoveParticipant?: PlayerActionHandler;
  onRemoveTraveller?: PlayerActionHandler;
  onManageTokens: PlayerActionHandler;
  onSaveCharacter: SaveCharacterHandler;
  onSwapWith?: PlayerActionHandler;
  onChangeBluff?: (oldBluffId: string, newBluffId: string) => void;
  /**
   * Open the slot-machine "Roll for Character" overlay for this player.
   * When omitted, the Roll button is hidden (e.g. on legacy or read-only views).
   */
  onRollForCharacter?: PlayerActionHandler;
}

export function PlayerActionsModal({
  open,
  player,
  showCharacters,
  scriptCharacters,
  allCharacters,
  demonBluffs,
  bluffCharacters,
  availableBluffCharacters,
  bluffLabel,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveParticipant,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
  onSwapWith,
  onChangeBluff,
  onRollForCharacter,
}: PlayerActionsModalProps) {
  if (!player || !open) return null;

  return (
    <PlayerActionsModalInner
      key={`${player.playerId}-${player.characterId}-${player.actualAlignment}`}
      player={player}
      showCharacters={showCharacters}
      scriptCharacters={scriptCharacters}
      allCharacters={allCharacters}
      demonBluffs={demonBluffs}
      bluffCharacters={bluffCharacters}
      availableBluffCharacters={availableBluffCharacters}
      bluffLabel={bluffLabel}
      onClose={onClose}
      onToggleAlive={onToggleAlive}
      onToggleGhostVote={onToggleGhostVote}
      onRemoveParticipant={onRemoveParticipant}
      onRemoveTraveller={onRemoveTraveller}
      onManageTokens={onManageTokens}
      onSaveCharacter={onSaveCharacter}
      onSwapWith={onSwapWith}
      onChangeBluff={onChangeBluff}
      onRollForCharacter={onRollForCharacter}
    />
  );
}

function PlayerActionsModalInner({
  player,
  showCharacters,
  scriptCharacters,
  allCharacters,
  demonBluffs,
  bluffCharacters,
  availableBluffCharacters,
  bluffLabel,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveParticipant,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
  onSwapWith,
  onChangeBluff,
  onRollForCharacter,
}: Omit<PlayerActionsModalProps, 'open'> & { player: TownSquarePlayer }) {
  const [characterId, setCharacterId] = useState(player.characterId ?? '');
  const [actualAlignment, setActualAlignment] = useState<Alignment>(
    player.actualAlignment ?? 'Unknown',
  );

  const characterOptions = useMemo(() => {
    const assignableScriptCharacters = filterCharacterDropdownOptions(scriptCharacters);
    const scriptIds = new Set(assignableScriptCharacters.map((c) => c.id));
    const options: CharacterOption[] = [];

    for (const ch of assignableScriptCharacters) {
      options.push({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        section: 'Current Script',
        sectionOrder: 0,
        typeOrder: TYPE_ORDER.indexOf(ch.type),
      });
    }

    if (allCharacters) {
      for (const ch of filterCharacterDropdownOptions(allCharacters)) {
        if (!scriptIds.has(ch.id)) {
          options.push({
            id: ch.id,
            name: ch.name,
            type: ch.type,
            section: 'All Other',
            sectionOrder: 1,
            typeOrder: TYPE_ORDER.indexOf(ch.type),
          });
        }
      }
    }

    options.sort((a, b) => {
      if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
      if (a.typeOrder !== b.typeOrder) return a.typeOrder - b.typeOrder;
      return a.name.localeCompare(b.name);
    });

    return options;
  }, [scriptCharacters, allCharacters]);

  const selectedOption = characterOptions.find((o) => o.id === characterId) ?? null;
  const isDead = !player.alive;

  const handleToggleAlive = () => invokePlayerAction(onToggleAlive, player);
  const handleToggleGhostVote = () => invokePlayerAction(onToggleGhostVote, player);

  const handleRemoveParticipant = () => {
    const removeHandler = onRemoveParticipant ?? onRemoveTraveller;
    if (removeHandler) invokePlayerAction(removeHandler, player);
    onClose();
  };

  const handleSwapWith = () => {
    if (onSwapWith) {
      invokePlayerAction(onSwapWith, player);
      onClose();
    }
  };

  const handleRollForCharacter = () => {
    if (onRollForCharacter) {
      invokePlayerAction(onRollForCharacter, player);
      onClose();
    }
  };

  const handleManageTokens = () => {
    invokePlayerAction(onManageTokens, player);
    onClose();
  };

  const handleSaveCharacter = () => {
    const key = playerActionKey(player);
    if (typeof key === 'number') {
      (
        onSaveCharacter as (
          value: number,
          updates: { characterId?: string; actualAlignment?: Alignment },
        ) => void
      )(key, { characterId, actualAlignment });
    } else {
      (
        onSaveCharacter as (
          value: PlayerId,
          updates: { characterId?: string; actualAlignment?: Alignment },
        ) => void
      )(key, { characterId, actualAlignment });
    }
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        {playerDisplayName(player)} — Seat {playerDisplaySeat(player)}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
        <Button
          variant="contained"
          color={isDead ? 'success' : 'error'}
          startIcon={isDead ? <FavoriteIcon /> : <HeartBrokenIcon />}
          onClick={handleToggleAlive}
          fullWidth
          size="large"
        >
          {isDead ? 'Mark as Alive' : 'Mark as Dead'}
        </Button>

        {isDead && (
          <Button
            variant="outlined"
            color={player.ghostVoteUsed ? 'primary' : 'warning'}
            startIcon={player.ghostVoteUsed ? <HowToVoteIcon /> : <DoNotDisturbIcon />}
            onClick={handleToggleGhostVote}
            fullWidth
          >
            {player.ghostVoteUsed ? 'Restore Ghost Vote' : 'Use Ghost Vote'}
          </Button>
        )}

        {onSwapWith && (
          <>
            <Divider />
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={handleSwapWith}
              fullWidth
            >
              Swap with…
            </Button>
          </>
        )}

        {onRollForCharacter && !player.isTraveller && (
          <>
            <Divider />
            <Button
              variant="outlined"
              color="warning"
              startIcon={<CasinoIcon />}
              onClick={handleRollForCharacter}
              fullWidth
              data-testid="player-actions-roll-for-character"
            >
              Roll for Character
            </Button>
          </>
        )}

        {player.isTraveller && (
          <>
            <Divider />
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemoveIcon />}
              onClick={handleRemoveParticipant}
              fullWidth
            >
              Remove Traveller
            </Button>
          </>
        )}

        {showCharacters &&
          demonBluffs &&
          demonBluffs.length > 0 &&
          bluffCharacters &&
          bluffCharacters.length > 0 && (
            <>
              <Divider />
              <Box data-testid="demon-bluffs-section">
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b71c1c', mb: 0.5 }}>
                  {bluffLabel ?? 'Demon Bluffs'}
                </Typography>
                {bluffCharacters.map((ch) => (
                  <Box
                    key={ch.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
                    data-testid={`bluff-${ch.id}`}
                  >
                    <Avatar
                      src={getCharacterIconPath(ch.id)}
                      alt={ch.name}
                      sx={{ width: 28, height: 28 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ flexGrow: 1, color: getCharacterTypeColor(ch.type), fontWeight: 500 }}
                    >
                      {ch.name}
                    </Typography>
                    {onChangeBluff && availableBluffCharacters && (
                      <Autocomplete
                        options={availableBluffCharacters.filter(
                          (a) => !demonBluffs.includes(a.id),
                        )}
                        getOptionLabel={(opt) => opt.name}
                        onChange={(_, newVal) => {
                          if (newVal) onChangeBluff(ch.id, newVal.id);
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Swap" size="small" />
                        )}
                        size="small"
                        sx={{ minWidth: 120 }}
                        data-testid={`swap-bluff-${ch.id}`}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}

        {showCharacters && (
          <>
            <Divider />
            <Button
              variant="outlined"
              startIcon={<TokenIcon />}
              onClick={handleManageTokens}
              fullWidth
            >
              Manage Tokens
            </Button>
            <Divider />
            <Autocomplete
              options={characterOptions}
              value={selectedOption}
              onChange={(_, newVal) => setCharacterId(newVal?.id ?? '')}
              getOptionLabel={(opt) => opt.name}
              groupBy={(opt) => `${opt.section} — ${opt.type}`}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => <TextField {...params} label="Character" size="small" />}
              renderOption={(props, opt) => {
                const typeColor = getCharacterTypeColor(opt.type);
                if (opt.type === 'Traveller') {
                  // Travellers can be on either alignment; show the name in
                  // two halves coloured for good (blue) and evil (red) so they
                  // stand out from solid-coloured townsfolk/outsiders/minions.
                  const mid = Math.ceil(opt.name.length / 2);
                  const firstHalf = opt.name.slice(0, mid);
                  const secondHalf = opt.name.slice(mid);
                  return (
                    <Box component="li" {...props} key={opt.id} sx={{ fontSize: '0.875rem' }}>
                      <Box component="span" sx={{ color: 'info.main', fontWeight: 600 }}>
                        {firstHalf}
                      </Box>
                      <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {secondHalf}
                      </Box>
                    </Box>
                  );
                }
                return (
                  <Box
                    component="li"
                    {...props}
                    key={opt.id}
                    sx={{ color: typeColor, fontSize: '0.875rem' }}
                  >
                    {opt.name}
                  </Box>
                );
              }}
              renderGroup={(params) => (
                <Box key={params.key}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      fontWeight: 700,
                      color: 'text.secondary',
                      display: 'block',
                      bgcolor: 'action.hover',
                    }}
                  >
                    {params.group}
                  </Typography>
                  {params.children}
                </Box>
              )}
              size="small"
              fullWidth
              clearOnEscape
              data-testid="character-autocomplete"
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Actual Alignment
              </Typography>
              <ToggleButtonGroup
                value={actualAlignment}
                exclusive
                onChange={(_, val) => {
                  if (val !== null) setActualAlignment(val as Alignment);
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="Good" sx={{ color: '#1976d2' }}>
                  Good
                </ToggleButton>
                <ToggleButton value="Evil" sx={{ color: '#b71c1c' }}>
                  Evil
                </ToggleButton>
                <ToggleButton value="Unknown" sx={{ color: '#9e9e9e' }}>
                  Unknown
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Button variant="contained" onClick={handleSaveCharacter} fullWidth>
              Save Changes
            </Button>
          </>
        )}

        <Button onClick={onClose} sx={{ mt: 0.5 }}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
