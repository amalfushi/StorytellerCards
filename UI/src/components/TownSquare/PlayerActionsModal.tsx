import { useState, useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
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
import type { PlayerSeat, CharacterDef, Alignment } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

/** Type display order for grouping in the character selector. */
const TYPE_ORDER = ['Townsfolk', 'Outsider', 'Minion', 'Demon', 'Traveller', 'Fabled', 'Loric'];

/** Character option extended with section info for the grouped Autocomplete. */
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
  player: PlayerSeat | null;
  showCharacters: boolean;
  scriptCharacters: CharacterDef[];
  /** All characters from the registry — for "All Other" section in dropdown. */
  allCharacters?: CharacterDef[];
  onClose: () => void;
  onToggleAlive: (seat: number) => void;
  onToggleGhostVote: (seat: number) => void;
  onRemoveTraveller: (seat: number) => void;
  onManageTokens: (seat: number) => void;
  onSaveCharacter: (
    seat: number,
    updates: { characterId?: string; actualAlignment?: Alignment },
  ) => void;
  onSwapWith?: (seat: number) => void;
}

/**
 * Unified player actions modal for the Town Square.
 *
 * - **Hidden mode** (`showCharacters=false`): compact dialog with only
 *   Mark Dead/Alive, Ghost Vote, and Remove Traveller actions.
 * - **Visible mode** (`showCharacters=true`): full dialog with all actions
 *   including Manage Tokens, Change Character, and Change Alignment.
 */
export function PlayerActionsModal({
  open,
  player,
  showCharacters,
  scriptCharacters,
  allCharacters,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
  onSwapWith,
}: PlayerActionsModalProps) {
  if (!player || !open) return null;

  return (
    <PlayerActionsModalInner
      key={`${player.seat}-${player.characterId}-${player.actualAlignment}`}
      player={player}
      showCharacters={showCharacters}
      scriptCharacters={scriptCharacters}
      allCharacters={allCharacters}
      onClose={onClose}
      onToggleAlive={onToggleAlive}
      onToggleGhostVote={onToggleGhostVote}
      onRemoveTraveller={onRemoveTraveller}
      onManageTokens={onManageTokens}
      onSaveCharacter={onSaveCharacter}
      onSwapWith={onSwapWith}
    />
  );
}

/** Inner component that owns local edit state; remounted via key when player changes. */
function PlayerActionsModalInner({
  player,
  showCharacters,
  scriptCharacters,
  allCharacters,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
  onSwapWith,
}: Omit<PlayerActionsModalProps, 'open'> & { player: PlayerSeat }) {
  const [characterId, setCharacterId] = useState(player.characterId ?? '');
  const [actualAlignment, setActualAlignment] = useState<Alignment>(
    player.actualAlignment ?? 'Unknown',
  );

  // Build grouped character options for the Autocomplete
  const characterOptions = useMemo(() => {
    const scriptIds = new Set(scriptCharacters.map((c) => c.id));
    const options: CharacterOption[] = [];

    // Section 1: Script characters
    for (const ch of scriptCharacters) {
      options.push({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        section: 'Current Script',
        sectionOrder: 0,
        typeOrder: TYPE_ORDER.indexOf(ch.type),
      });
    }

    // Section 2: All other characters (not on script)
    if (allCharacters) {
      for (const ch of allCharacters) {
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

    // Sort: by section order, then by type order, then by name
    options.sort((a, b) => {
      if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
      if (a.typeOrder !== b.typeOrder) return a.typeOrder - b.typeOrder;
      return a.name.localeCompare(b.name);
    });

    return options;
  }, [scriptCharacters, allCharacters]);

  // Find the currently selected option
  const selectedOption = characterOptions.find((o) => o.id === characterId) ?? null;

  const isDead = !player.alive;

  const handleToggleAlive = () => {
    onToggleAlive(player.seat);
  };

  const handleToggleGhostVote = () => {
    onToggleGhostVote(player.seat);
  };

  const handleRemoveTraveller = () => {
    onRemoveTraveller(player.seat);
    onClose();
  };

  const handleSwapWith = () => {
    if (onSwapWith) {
      onSwapWith(player.seat);
      onClose();
    }
  };

  const handleManageTokens = () => {
    onManageTokens(player.seat);
    onClose();
  };

  const handleSaveCharacter = () => {
    onSaveCharacter(player.seat, { characterId, actualAlignment });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        {player.playerName} — Seat {player.seat}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
        {/* ── Mark Dead / Alive toggle ── */}
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

        {/* ── Ghost Vote toggle (only when dead) ── */}
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

        {/* ── Swap with another player ── */}
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

        {/* ── Remove Traveller (only when traveller) ── */}
        {player.isTraveller && (
          <>
            <Divider />
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemoveIcon />}
              onClick={handleRemoveTraveller}
              fullWidth
            >
              Remove Traveller
            </Button>
          </>
        )}

        {/* ── Visible-mode only actions ── */}
        {showCharacters && (
          <>
            <Divider />

            {/* Manage Tokens */}
            <Button
              variant="outlined"
              startIcon={<TokenIcon />}
              onClick={handleManageTokens}
              fullWidth
            >
              Manage Tokens
            </Button>

            <Divider />

            {/* Change Character — grouped searchable dropdown */}
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

            {/* Change Alignment */}
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

            {/* Save character/alignment changes */}
            <Button variant="contained" onClick={handleSaveCharacter} fullWidth>
              Save Changes
            </Button>
          </>
        )}

        {/* ── Close button ── */}
        <Button onClick={onClose} sx={{ mt: 0.5 }}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
