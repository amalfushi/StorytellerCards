import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CharacterDef, Script } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

export interface ScriptBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (script: Script) => void;
}

const TYPE_ORDER: string[] = [
  CharacterType.Townsfolk,
  CharacterType.Outsider,
  CharacterType.Minion,
  CharacterType.Demon,
];

/**
 * Dialog for creating a custom script by toggling characters on/off.
 * Characters are listed grouped by type with a search filter.
 */
export function ScriptBuilder({ open, onClose, onSave }: ScriptBuilderProps) {
  const { allCharacters } = useCharacterLookup();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scriptName, setScriptName] = useState('');

  // Filter to non-Traveller/Fabled/Loric game characters
  const gameCharacters = useMemo(
    () =>
      allCharacters.filter(
        (c) =>
          c.type === CharacterType.Townsfolk ||
          c.type === CharacterType.Outsider ||
          c.type === CharacterType.Minion ||
          c.type === CharacterType.Demon,
      ),
    [allCharacters],
  );

  // Group by type
  const grouped = useMemo(() => {
    const groups = new Map<string, CharacterDef[]>();
    for (const type of TYPE_ORDER) {
      groups.set(type, []);
    }
    for (const ch of gameCharacters) {
      const list = groups.get(ch.type);
      if (list) list.push(ch);
    }
    return groups;
  }, [gameCharacters]);

  // Search filter
  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped;
    const lower = search.toLowerCase();
    const filtered = new Map<string, CharacterDef[]>();
    for (const [type, chars] of grouped) {
      filtered.set(
        type,
        chars.filter((c) => c.name.toLowerCase().includes(lower)),
      );
    }
    return filtered;
  }, [grouped, search]);

  // Composition counts
  const composition = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of TYPE_ORDER) counts[type] = 0;
    for (const id of selectedIds) {
      const ch = gameCharacters.find((c) => c.id === id);
      if (ch && counts[ch.type] !== undefined) counts[ch.type]++;
    }
    return counts;
  }, [selectedIds, gameCharacters]);

  const toggleCharacter = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = () => {
    const name = scriptName.trim() || 'Custom Script';
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const script: Script = {
      id,
      name,
      author: 'Custom',
      characterIds: Array.from(selectedIds),
    };
    // Save to localStorage
    try {
      localStorage.setItem(`storyteller-script-${script.id}`, JSON.stringify(script));
    } catch {
      // Ignore storage errors
    }
    onSave(script);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography component="span" variant="h6">
          Create Script
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {/* Script name */}
        <TextField
          label="Script Name"
          fullWidth
          size="small"
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Search */}
        <TextField
          label="Search characters…"
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Composition summary */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {TYPE_ORDER.map((type) => (
            <Chip
              key={type}
              label={`${type}: ${composition[type]}`}
              size="small"
              sx={{
                bgcolor: `${getCharacterTypeColor(type)}22`,
                color: getCharacterTypeColor(type),
                fontWeight: 600,
              }}
            />
          ))}
          <Chip
            label={`Total: ${selectedIds.size}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Character groups */}
        {TYPE_ORDER.map((type) => {
          const chars = filteredGrouped.get(type) ?? [];
          if (chars.length === 0) return null;
          const color = getCharacterTypeColor(type);

          return (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color, mb: 0.5 }}>
                {type} ({chars.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {chars.map((ch) => {
                  const isSelected = selectedIds.has(ch.id);
                  return (
                    <Chip
                      key={ch.id}
                      label={ch.name}
                      size="small"
                      onClick={() => toggleCharacter(ch.id)}
                      sx={{
                        bgcolor: isSelected ? color : 'transparent',
                        color: isSelected ? '#fff' : 'text.primary',
                        border: `1px solid ${color}`,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isSelected ? color : `${color}22`,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={selectedIds.size === 0}>
          Save Script ({selectedIds.size} chars)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
