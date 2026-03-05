import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';

export interface CharacterDetailModalProps {
  open: boolean;
  character: CharacterDef | null;
  onClose: () => void;
}

/**
 * Modal showing full character details: name, type, abilities, night actions, wiki link.
 * Can be opened from any character icon/name in the app.
 */
export function CharacterDetailModal({ open, character, onClose }: CharacterDetailModalProps) {
  if (!character) return null;

  const typeColor = getCharacterTypeColor(character.type);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        {/* Character icon */}
        <CharacterIconImage
          characterId={character.id}
          characterName={character.name}
          typeColor={typeColor}
          size={40}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 'bold' }}>
            {character.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            <Chip
              label={character.type}
              size="small"
              sx={{
                bgcolor: `${typeColor}22`,
                color: typeColor,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
            <Chip
              label={character.defaultAlignment}
              size="small"
              sx={{
                bgcolor:
                  character.defaultAlignment === 'Good'
                    ? 'rgba(25,118,210,0.12)'
                    : character.defaultAlignment === 'Evil'
                      ? 'rgba(211,47,47,0.12)'
                      : 'rgba(158,158,158,0.12)',
                color:
                  character.defaultAlignment === 'Good'
                    ? '#1976d2'
                    : character.defaultAlignment === 'Evil'
                      ? '#d32f2f'
                      : '#9e9e9e',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Short ability */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Ability
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {character.abilityShort}
        </Typography>

        {/* Detailed ability */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Detailed Rules
        </Typography>
        {character.abilityDetailed ? (
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {character.abilityDetailed}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }} color="text.disabled">
            Detailed rules not yet available.
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Night actions */}
        {character.firstNight && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              First Night (order {character.firstNight.order})
            </Typography>
            <Typography variant="body2">{character.firstNight.helpText}</Typography>
          </Box>
        )}

        {character.otherNights && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Other Nights (order {character.otherNights.order})
            </Typography>
            <Typography variant="body2">{character.otherNights.helpText}</Typography>
          </Box>
        )}

        {!character.firstNight && !character.otherNights && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
            No night actions.
          </Typography>
        )}

        {/* Reminders */}
        {character.reminders.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Reminder Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {character.reminders.map((r) => (
                <Chip key={r.id} label={r.text} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Wiki link */}
        {character.wikiLink && (
          <Box sx={{ mt: 2 }}>
            <Link
              href={character.wikiLink}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <OpenInNewIcon fontSize="small" />
              View on Wiki
            </Link>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
