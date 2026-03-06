import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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
import type { PlayerSeat, CharacterDef, Alignment } from '@/types/index.ts';

export interface PlayerActionsModalProps {
  open: boolean;
  player: PlayerSeat | null;
  showCharacters: boolean;
  scriptCharacters: CharacterDef[];
  onClose: () => void;
  onToggleAlive: (seat: number) => void;
  onToggleGhostVote: (seat: number) => void;
  onRemoveTraveller: (seat: number) => void;
  onManageTokens: (seat: number) => void;
  onSaveCharacter: (
    seat: number,
    updates: { characterId?: string; actualAlignment?: Alignment },
  ) => void;
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
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
}: PlayerActionsModalProps) {
  if (!player || !open) return null;

  return (
    <PlayerActionsModalInner
      key={`${player.seat}-${player.characterId}-${player.actualAlignment}`}
      player={player}
      showCharacters={showCharacters}
      scriptCharacters={scriptCharacters}
      onClose={onClose}
      onToggleAlive={onToggleAlive}
      onToggleGhostVote={onToggleGhostVote}
      onRemoveTraveller={onRemoveTraveller}
      onManageTokens={onManageTokens}
      onSaveCharacter={onSaveCharacter}
    />
  );
}

/** Inner component that owns local edit state; remounted via key when player changes. */
function PlayerActionsModalInner({
  player,
  showCharacters,
  scriptCharacters,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onRemoveTraveller,
  onManageTokens,
  onSaveCharacter,
}: Omit<PlayerActionsModalProps, 'open'> & { player: PlayerSeat }) {
  const [characterId, setCharacterId] = useState(player.characterId ?? '');
  const [actualAlignment, setActualAlignment] = useState<Alignment>(
    player.actualAlignment ?? 'Unknown',
  );

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

            {/* Change Character */}
            <FormControl fullWidth size="small">
              <InputLabel id="actions-char-select-label">Character</InputLabel>
              <Select
                labelId="actions-char-select-label"
                value={characterId}
                label="Character"
                onChange={(e) => setCharacterId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {scriptCharacters.map((ch) => (
                  <MenuItem key={ch.id} value={ch.id}>
                    {ch.name} ({ch.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
