import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import EditIcon from '@mui/icons-material/Edit';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import TokenIcon from '@mui/icons-material/Token';
import type { PlayerSeat } from '@/types/index.ts';

export interface PlayerQuickActionsProps {
  anchorEl: HTMLElement | null;
  player: PlayerSeat | null;
  showCharacters: boolean;
  onClose: () => void;
  onToggleAlive: (seat: number) => void;
  onToggleGhostVote: (seat: number) => void;
  onEditCharacter: (seat: number) => void;
  onRemoveTraveller: (seat: number) => void;
  onManageTokens?: (seat: number) => void;
}

/**
 * Context menu that appears when tapping a player token in day view.
 *
 * Options:
 * - Mark as Dead / Alive (toggle)
 * - Use Ghost Vote / Ghost Vote Used (toggle, only when dead)
 * - Edit Character (night view only) → opens PlayerEditDialog
 * - Remove Traveller (traveller tokens only)
 */
export function PlayerQuickActions({
  anchorEl,
  player,
  showCharacters,
  onClose,
  onToggleAlive,
  onToggleGhostVote,
  onEditCharacter,
  onRemoveTraveller,
  onManageTokens,
}: PlayerQuickActionsProps) {
  if (!player) return null;

  const isDead = !player.alive;

  const handleToggleAlive = () => {
    onToggleAlive(player.seat);
    onClose();
  };

  const handleToggleGhostVote = () => {
    onToggleGhostVote(player.seat);
    onClose();
  };

  const handleEdit = () => {
    onEditCharacter(player.seat);
    onClose();
  };

  const handleRemoveTraveller = () => {
    onRemoveTraveller(player.seat);
    onClose();
  };

  const handleManageTokens = () => {
    onManageTokens?.(player.seat);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {/* Toggle alive / dead */}
      <MenuItem onClick={handleToggleAlive}>
        <ListItemIcon>
          {isDead ? <FavoriteIcon color="success" /> : <HeartBrokenIcon color="error" />}
        </ListItemIcon>
        <ListItemText>{isDead ? 'Mark as Alive' : 'Mark as Dead'}</ListItemText>
      </MenuItem>

      {/* Ghost vote toggle — only when dead */}
      {isDead && (
        <MenuItem onClick={handleToggleGhostVote}>
          <ListItemIcon>
            {player.ghostVoteUsed ? (
              <HowToVoteIcon color="primary" />
            ) : (
              <DoNotDisturbIcon color="warning" />
            )}
          </ListItemIcon>
          <ListItemText>
            {player.ghostVoteUsed ? 'Restore Ghost Vote' : 'Use Ghost Vote'}
          </ListItemText>
        </MenuItem>
      )}

      {/* Manage Tokens */}
      {onManageTokens && [
        <Divider key="div-tokens" />,
        <MenuItem key="tokens" onClick={handleManageTokens}>
          <ListItemIcon>
            <TokenIcon />
          </ListItemIcon>
          <ListItemText>Manage Tokens</ListItemText>
        </MenuItem>,
      ]}

      {/* Night-view only: edit character */}
      {showCharacters && [
        <Divider key="div-edit" />,
        <MenuItem key="edit" onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit Character</ListItemText>
        </MenuItem>,
      ]}

      {/* Traveller only: remove */}
      {player.isTraveller && [
        <Divider key="div-remove" />,
        <MenuItem key="remove" onClick={handleRemoveTraveller}>
          <ListItemIcon>
            <PersonRemoveIcon color="error" />
          </ListItemIcon>
          <ListItemText>Remove Traveller</ListItemText>
        </MenuItem>,
      ]}
    </Menu>
  );
}
