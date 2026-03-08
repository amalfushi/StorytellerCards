import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Avatar from '@mui/material/Avatar';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { CharacterDef } from '@/types/index.ts';
import { EditionLabel } from '@/types/index.ts';
import {
  getCharacterTypeColor,
  getReminderTokenColor,
} from '@/components/common/characterTypeColor.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getAlignmentBorderColor, getCharacterIconPath } from '@/utils/characterIcon.ts';
import { getCharacterActiveJinxes } from '@/utils/jinxUtils.ts';

export interface CharacterDetailModalProps {
  open: boolean;
  character: CharacterDef | null;
  onClose: () => void;
  /** Character IDs on the current script (for jinx context). Empty = show all jinxes. */
  scriptCharacterIds?: string[];
}

/**
 * Modal showing full character details: name, type, abilities, night actions, wiki link.
 * Can be opened from any character icon/name in the app.
 */
export function CharacterDetailModal({
  open,
  character,
  onClose,
  scriptCharacterIds = [],
}: CharacterDetailModalProps) {
  if (!character) return null;

  const typeColor = getCharacterTypeColor(character.type);
  // All jinxes defined on this character (for the accordion)
  const allJinxes = getCharacterActiveJinxes(character.id, []);
  // Only jinxes where both characters are on the script (active)
  const activeJinxIds = new Set(
    scriptCharacterIds.length > 0
      ? getCharacterActiveJinxes(character.id, scriptCharacterIds).map((j) => j.character2Id)
      : [],
  );
  const hasActiveJinxes = activeJinxIds.size > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        {/* Character icon */}
        <CharacterIconImage
          characterId={character.id}
          characterName={character.name}
          typeColor={typeColor}
          size={48}
          borderColor={getAlignmentBorderColor(character.defaultAlignment, typeColor)}
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
            {character.edition && (
              <Chip
                label={EditionLabel[character.edition] ?? character.edition}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            )}
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

        {/* Flavor text */}
        {character.flavor && (
          <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
            &ldquo;{character.flavor}&rdquo;
          </Typography>
        )}

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
              {character.reminders.map((r) => {
                const tokenColor = getReminderTokenColor(r.sourceCharacterId);
                return (
                  <Chip
                    key={r.id}
                    label={r.text}
                    size="small"
                    avatar={
                      r.sourceCharacterId ? (
                        <Avatar
                          src={getCharacterIconPath(r.sourceCharacterId)}
                          alt={r.sourceCharacterId}
                          sx={{ width: 20, height: 20 }}
                        />
                      ) : undefined
                    }
                    sx={{
                      bgcolor: `${tokenColor}22`,
                      color: tokenColor,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: `1px solid ${tokenColor}55`,
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Jinxes Accordion */}
        {allJinxes.length > 0 && (
          <Box sx={{ mb: 1.5 }} data-testid="jinx-section">
            <Divider sx={{ my: 1.5 }} />
            <Accordion
              defaultExpanded={hasActiveJinxes}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#f59e0b' }} />}
                sx={{ px: 0, minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}
              >
                <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                  ⚡ Jinxes ({allJinxes.length})
                  {hasActiveJinxes && (
                    <Chip
                      label={`${activeJinxIds.size} active`}
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                {allJinxes.map((jinx) => {
                  const isActive = activeJinxIds.has(jinx.character2Id);
                  return (
                    <Box
                      key={jinx.character2Id}
                      data-testid={isActive ? 'jinx-active' : 'jinx-inactive'}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.04)',
                        border: isActive
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px solid rgba(245, 158, 11, 0.1)',
                      }}
                    >
                      <CharacterIconImage
                        characterId={jinx.character2Id}
                        characterName={jinx.character2Name}
                        typeColor="#f59e0b"
                        size={32}
                        borderColor="#f59e0b"
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {jinx.character2Name}
                          {isActive && (
                            <Chip
                              label="In Play"
                              size="small"
                              sx={{
                                ml: 0.5,
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: 'rgba(76, 175, 80, 0.2)',
                                color: '#4caf50',
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {jinx.description}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
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
