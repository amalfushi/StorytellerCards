import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useGame } from '@/context/GameContext.tsx';

/**
 * Toggle switch for showing/hiding character information across all tabs.
 * OFF (default) = day/safe mode — character info hidden.
 * ON = night/storyteller mode — character details visible.
 */
export function ShowCharactersToggle() {
  const { state, toggleShowCharacters } = useGame();
  const active = state.showCharacters;

  return (
    <Tooltip title={active ? 'Hide characters (day mode)' : 'Show characters (night mode)'}>
      <IconButton
        color="inherit"
        onClick={toggleShowCharacters}
        aria-label={active ? 'Hide character info' : 'Show character info'}
        sx={{
          transition: 'all 0.3s ease',
          ...(active && {
            color: '#ffd54f',
            filter: 'drop-shadow(0 0 6px rgba(255,213,79,0.7))',
          }),
        }}
      >
        {active ? <VisibilityIcon /> : <VisibilityOffIcon />}
      </IconButton>
    </Tooltip>
  );
}
