import { useCallback, useMemo } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import type { NightSubAction } from '@/types/index.ts';
import { computeActionableIndices } from './subActionUtils.ts';

export interface SubActionChecklistProps {
  subActions: NightSubAction[];
  checkedStates: boolean[];
  onToggle: (index: number) => void;
  readOnly?: boolean;
  /** Labels for player-facing choices, shown as fullscreen icons on actionable items. */
  choiceLabels?: string[];
  /** Called when a fullscreen icon is clicked, with the choice label. */
  onShowChoiceFullscreen?: (label: string) => void;
}

/**
 * Renders a list of checkable sub-action steps within a night flashcard.
 *
 * Only top-level actionable items and conditional (`if`) blocks get checkboxes.
 * Detail sub-steps are shown indented without checkboxes.
 * Checked items show strikethrough and reduced opacity with a smooth transition.
 */
export function SubActionChecklist({
  subActions,
  checkedStates,
  onToggle,
  readOnly = false,
  choiceLabels = [],
  onShowChoiceFullscreen,
}: SubActionChecklistProps) {
  const handleToggle = useCallback(
    (index: number) => () => {
      if (!readOnly) {
        onToggle(index);
      }
    },
    [onToggle, readOnly],
  );

  const actionableIndices = computeActionableIndices(subActions);

  // Build a map from sub-action index to choice label index
  // (actionable items consume choice labels in order)
  const actionableToChoiceIdx = useMemo(() => {
    const map = new Map<number, number>();
    let choiceIdx = 0;
    for (let i = 0; i < subActions.length; i++) {
      if (actionableIndices.has(i) && choiceIdx < choiceLabels.length) {
        map.set(i, choiceIdx);
        choiceIdx++;
      }
    }
    return map;
  }, [subActions.length, actionableIndices, choiceLabels.length]);

  return (
    <List dense disablePadding>
      {subActions.map((sa, index) => {
        const isActionable = actionableIndices.has(index);
        const checked = checkedStates[index] ?? false;
        const choiceIdx = actionableToChoiceIdx.get(index);
        const choiceLabel = choiceIdx !== undefined ? choiceLabels[choiceIdx] : undefined;

        if (isActionable) {
          // ── Actionable item: rendered WITH checkbox ──
          return (
            <ListItem
              key={sa.id}
              disableGutters
              disablePadding
              onClick={handleToggle(index)}
              sx={{
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'opacity 0.25s ease, background-color 0.15s ease',
                opacity: checked ? 0.45 : 1,
                borderRadius: 1,
                '&:active': readOnly
                  ? {}
                  : {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      transform: 'scale(0.98)',
                    },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={checked}
                  disabled={readOnly}
                  disableRipple={readOnly}
                  tabIndex={-1}
                  size="small"
                  aria-label={`${sa.isConditional ? 'Conditional: ' : ''}${sa.description}`}
                  onClick={(e) => e.stopPropagation()}
                  onChange={handleToggle(index)}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&.Mui-checked': { color: '#66bb6a' },
                    transition: 'transform 0.15s ease',
                    transform: checked ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box
                    component="span"
                    sx={{
                      textDecoration: checked ? 'line-through' : 'none',
                      fontStyle: sa.isConditional ? 'italic' : 'normal',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      color: sa.isConditional ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.95)',
                      transition: 'text-decoration 0.2s ease, opacity 0.25s ease',
                    }}
                  >
                    {sa.isConditional && (
                      <Box
                        component="span"
                        sx={{
                          color: '#ffb74d',
                          fontWeight: 600,
                          fontStyle: 'normal',
                        }}
                      >
                        {'If… '}
                      </Box>
                    )}
                    {sa.description}
                  </Box>
                }
              />
              {choiceLabel && onShowChoiceFullscreen && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowChoiceFullscreen(choiceLabel);
                  }}
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                    ml: 0.5,
                    '&:hover': { color: 'rgba(255,255,255,0.8)' },
                  }}
                  aria-label={`Show "${choiceLabel}" fullscreen`}
                  data-testid={`choice-fullscreen-${index}`}
                >
                  <FullscreenIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              )}
            </ListItem>
          );
        }

        // ── Non-actionable item: rendered WITHOUT checkbox, indented ──
        return (
          <ListItem
            key={sa.id}
            disableGutters
            disablePadding
            sx={{
              pl: 5,
              cursor: 'default',
            }}
          >
            <ListItemText
              primary={
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  {sa.description}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}
