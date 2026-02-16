import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export interface LoadingStateProps {
  /** Optional message displayed below the spinner. */
  message?: string;
}

/**
 * Reusable centered loading spinner with an optional descriptive message.
 * Used when loading game data, importing scripts, etc.
 */
export function LoadingState({ message }: LoadingStateProps): ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '30vh',
        gap: 2,
      }}
      role="status"
      aria-label={message ?? 'Loading'}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
