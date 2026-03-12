import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SyncStatus } from '@/types/index.ts';

/** Props for the SyncStatusIndicator component. */
export interface SyncStatusIndicatorProps {
  /** Current sync status. */
  status: SyncStatus;
  /** Called when the manual refresh button is tapped. */
  onRefresh?: () => void;
}

const statusConfig: Record<
  SyncStatus,
  { label: string; color: 'success' | 'warning' | 'disabled' | 'info' }
> = {
  idle: { label: 'Synced', color: 'success' },
  syncing: { label: 'Syncing…', color: 'info' },
  error: { label: 'Sync error', color: 'warning' },
  offline: { label: 'Offline', color: 'disabled' },
};

/** Small sync status icon for the AppBar. Shows current sync state with optional refresh. */
export function SyncStatusIndicator({ status, onRefresh }: SyncStatusIndicatorProps) {
  const { label, color } = statusConfig[status];

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          aria-label={`sync status: ${label}`}
          sx={{ color: color === 'disabled' ? 'text.disabled' : `${color}.main`, ml: 0.5 }}
        >
          {status === 'idle' && <CheckCircleOutlineIcon fontSize="small" />}
          {status === 'syncing' && <CircularProgress size={18} color="inherit" />}
          {status === 'error' && <WarningAmberIcon fontSize="small" />}
          {status === 'offline' && <CloudOffIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      {onRefresh && (
        <Tooltip title="Refresh from server">
          <IconButton size="small" aria-label="refresh sync" onClick={onRefresh} sx={{ ml: 0.25 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}
