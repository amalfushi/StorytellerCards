import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { NightOrderEntry } from '@/types/index.ts';
import { SubActionChecklist } from './SubActionChecklist.tsx';

export interface StructuralCardProps {
  entry: NightOrderEntry;
  checkedStates: boolean[];
  onToggleSubAction: (index: number) => void;
  readOnly?: boolean;
}

/** Background colour per structural entry type. */
const structuralBg: Record<string, string> = {
  dusk: '#4a148c',
  dawn: '#ff8f00',
  minioninfo: '#6d1b1b',
  demoninfo: '#4a0e0e',
};

/** Icon per structural type. */
const structuralIcon: Record<string, string> = {
  dusk: '🌙',
  dawn: '🌅',
  minioninfo: '😈',
  demoninfo: '👹',
};

/** Short descriptor below the title. */
const structuralHelpHint: Record<string, string> = {
  dusk: 'Begin the night. Ask all players to close their eyes.',
  dawn: 'The night is over. Ask all players to open their eyes.',
  minioninfo: 'Show the Minions who the Demon is and who the other Minions are.',
  demoninfo: 'Show the Demon who the Minions are and three not-in-play characters.',
};

/**
 * Special flashcard for structural entries (Dusk, Dawn, Minion Info, Demon Info).
 *
 * Uses a distinct background colour per type and renders the sub-action checklist
 * when the structural entry has sub-actions (e.g. Minion Info, Demon Info).
 */
export function StructuralCard({
  entry,
  checkedStates,
  onToggleSubAction,
  readOnly = false,
}: StructuralCardProps) {
  const bg = structuralBg[entry.id] ?? '#333';
  const icon = structuralIcon[entry.id] ?? '⚙️';
  const hint = structuralHelpHint[entry.id] ?? entry.helpText;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${bg} 0%, ${bg}dd 100%)`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        p: 3,
        mx: 1,
        minHeight: 0,
        flex: 1,
        overflow: 'auto',
        alignItems: 'center',
        justifyContent: entry.subActions.length <= 1 ? 'center' : 'flex-start',
      }}
    >
      {/* Icon */}
      <Box sx={{ fontSize: '3.5rem', mb: 2 }}>{icon}</Box>

      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          mb: 1.5,
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {entry.name}
      </Typography>

      {/* Help hint */}
      <Typography
        variant="body1"
        sx={{
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          mb: 2,
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {hint}
      </Typography>

      {/* Sub-action checklist (for minioninfo / demoninfo which have multi-step) */}
      {entry.subActions.length > 1 && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <SubActionChecklist
            subActions={entry.subActions}
            checkedStates={checkedStates}
            onToggle={onToggleSubAction}
            readOnly={readOnly}
          />
        </Box>
      )}
    </Box>
  );
}
