import { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';

interface CharacterCardProps {
  character: CharacterDef;
}

/**
 * Expandable card showing a single character from the script.
 * Summary: icon placeholder, name, short ability.
 * Expanded: detailed rules, night action help, wiki link.
 */
export function CharacterCard({ character }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const typeColor = getCharacterTypeColor(character.type);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      sx={{
        '&:before': { display: 'none' },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1.5, py: 0.5, minHeight: 48 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          {/* Character icon — click opens detail modal */}
          <CharacterIconImage
            characterId={character.id}
            characterName={character.name}
            typeColor={typeColor}
            size={48}
            borderColor={getAlignmentBorderColor(character.defaultAlignment, typeColor)}
            onClick={(e) => {
              e.stopPropagation();
              setDetailOpen(true);
            }}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {character.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3,
              }}
            >
              {character.abilityShort}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 1.5, pb: 2 }}>
        {/* Detailed rules */}
        {character.abilityDetailed && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Detailed Rules
            </Typography>
            <Typography variant="body2">{character.abilityDetailed}</Typography>
          </Box>
        )}

        {/* First Night help text */}
        {character.firstNight && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              First Night
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {character.firstNight.helpText}
            </Typography>
          </Box>
        )}

        {/* Other Nights help text */}
        {character.otherNights && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Other Nights
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {character.otherNights.helpText}
            </Typography>
          </Box>
        )}

        {/* Wiki link */}
        {character.wikiLink && (
          <Link
            href={character.wikiLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
          >
            Wiki →
          </Link>
        )}

        {/* Reminders */}
        {character.reminders.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Reminder Tokens
            </Typography>
            <Typography variant="body2">
              {character.reminders.map((r) => r.text).join(', ')}
            </Typography>
          </Box>
        )}
      </AccordionDetails>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={character}
        onClose={() => setDetailOpen(false)}
      />
    </Accordion>
  );
}
