import { useState, useMemo, useCallback, memo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CharacterDef, Script } from '@/types/index.ts';
import { CharacterType, Edition, EditionLabel } from '@/types/index.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { sortScriptCharacters } from '@/utils/scriptSortRules.ts';
import { generateId } from '@/utils/idGenerator.ts';

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
  CharacterType.Traveller,
  CharacterType.Fabled,
  CharacterType.Loric,
];

const EDITION_ORDER: string[] = Object.values(Edition);

/**
 * Dialog for creating a custom script by toggling characters on/off.
 * Characters are listed grouped by type with a search filter.
 * Two tabs: "Browse" for selecting characters, "Selection" for reviewing.
 */
export function ScriptBuilder({ open, onClose, onSave }: ScriptBuilderProps) {
  const { allCharacters } = useCharacterLookup();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scriptName, setScriptName] = useState('');
  const [author, setAuthor] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEditions, setSelectedEditions] = useState<Set<string>>(new Set());

  // Reset state when dialog transitions from closed → open
  // Uses state (not ref) to track previous `open` value — the recommended React 19 pattern
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSearch('');
      setSelectedIds(new Set());
      setScriptName('');
      setAuthor('');
      setActiveTab(0);
      setSelectedEditions(new Set());
    }
  }

  // All characters sorted by script rules (includes all types)
  const gameCharacters = useMemo(() => sortScriptCharacters(allCharacters), [allCharacters]);

  // Group by type (preserving sort order within groups)
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

  // Total counts per type (for "X/total" display)
  const totalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [type, chars] of grouped) {
      counts[type] = chars.length;
    }
    return counts;
  }, [grouped]);

  // Search + edition filter
  const filteredGrouped = useMemo(() => {
    const hasSearch = search.trim().length > 0;
    const hasEdition = selectedEditions.size > 0;
    if (!hasSearch && !hasEdition) return grouped;
    const lower = search.toLowerCase();
    const filtered = new Map<string, CharacterDef[]>();
    for (const [type, chars] of grouped) {
      filtered.set(
        type,
        chars.filter((c) => {
          if (hasSearch && !c.name.toLowerCase().includes(lower)) return false;
          if (hasEdition && (!c.edition || !selectedEditions.has(c.edition))) return false;
          return true;
        }),
      );
    }
    return filtered;
  }, [grouped, search, selectedEditions]);

  // O(1) character lookup map
  const characterMap = useMemo(() => {
    const map = new Map<string, CharacterDef>();
    for (const ch of gameCharacters) map.set(ch.id, ch);
    return map;
  }, [gameCharacters]);

  // Composition counts (selected per type)
  const composition = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of TYPE_ORDER) counts[type] = 0;
    for (const id of selectedIds) {
      const ch = characterMap.get(id);
      if (ch && counts[ch.type] !== undefined) counts[ch.type]++;
    }
    return counts;
  }, [selectedIds, characterMap]);

  // Selected characters grouped by type (for the selection tab)
  const selectedGrouped = useMemo(() => {
    const groups = new Map<string, CharacterDef[]>();
    for (const type of TYPE_ORDER) {
      groups.set(type, []);
    }
    for (const ch of gameCharacters) {
      if (selectedIds.has(ch.id)) {
        const list = groups.get(ch.type);
        if (list) list.push(ch);
      }
    }
    return groups;
  }, [gameCharacters, selectedIds]);

  const toggleCharacter = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleEdition = useCallback((edition: string) => {
    setSelectedEditions((prev) => {
      const next = new Set(prev);
      if (next.has(edition)) next.delete(edition);
      else next.add(edition);
      return next;
    });
  }, []);

  const canSave = scriptName.trim().length > 0 && selectedIds.size > 0;

  const handleSave = () => {
    if (!canSave) return;
    const script: Script = {
      id: generateId(),
      name: scriptName.trim(),
      author: author.trim() || 'Custom',
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
      <DialogContent dividers sx={{ p: 0 }}>
        {/* Script name & author */}
        <Box sx={{ px: 2, pt: 2 }}>
          <TextField
            label="Script Name"
            fullWidth
            size="small"
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
            required
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Author (optional)"
            fullWidth
            size="small"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            sx={{ mb: 1.5 }}
          />
        </Box>

        {/* Composition summary chips */}
        <Box sx={{ px: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {TYPE_ORDER.map((type) => (
            <Chip
              key={type}
              label={`${type}: ${composition[type]}/${totalCounts[type]}`}
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

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Browse Characters" />
          <Tab label={`Selection (${selectedIds.size})`} />
        </Tabs>

        {/* Tab panels */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, maxHeight: 400, overflowY: 'auto' }}>
          {activeTab === 0 && (
            <BrowsePanel
              search={search}
              onSearchChange={setSearch}
              filteredGrouped={filteredGrouped}
              selectedIds={selectedIds}
              onToggle={toggleCharacter}
              selectedEditions={selectedEditions}
              onToggleEdition={toggleEdition}
            />
          )}
          {activeTab === 1 && (
            <SelectionPanel selectedGrouped={selectedGrouped} onToggle={toggleCharacter} />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Save Script ({selectedIds.size} chars)
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Sub-component: Browse panel (select/deselect)
// ──────────────────────────────────────────────

const BrowsePanel = memo(function BrowsePanel({
  search,
  onSearchChange,
  filteredGrouped,
  selectedIds,
  onToggle,
  selectedEditions,
  onToggleEdition,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filteredGrouped: Map<string, CharacterDef[]>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  selectedEditions: Set<string>;
  onToggleEdition: (edition: string) => void;
}) {
  return (
    <>
      <TextField
        label="Search characters…"
        fullWidth
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ mb: 1 }}
      />

      {/* Edition filter chips */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {EDITION_ORDER.map((edition) => {
          const isActive = selectedEditions.has(edition);
          return (
            <Chip
              key={edition}
              label={EditionLabel[edition as Edition] ?? edition}
              size="small"
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              onClick={() => onToggleEdition(edition)}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          );
        })}
      </Box>

      {TYPE_ORDER.map((type) => {
        const chars = filteredGrouped.get(type) ?? [];
        if (chars.length === 0) return null;
        const color = getCharacterTypeColor(type);

        return (
          <Box key={type} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color, mb: 0.5 }}>
              {type} ({chars.length})
            </Typography>
            {chars.map((ch) => {
              const isSelected = selectedIds.has(ch.id);
              return (
                <CharacterRow
                  key={ch.id}
                  character={ch}
                  selected={isSelected}
                  color={color}
                  onToggle={onToggle}
                />
              );
            })}
          </Box>
        );
      })}
    </>
  );
});

// ──────────────────────────────────────────────
// Sub-component: Selection panel (review)
// ──────────────────────────────────────────────

const SelectionPanel = memo(function SelectionPanel({
  selectedGrouped,
  onToggle,
}: {
  selectedGrouped: Map<string, CharacterDef[]>;
  onToggle: (id: string) => void;
}) {
  const hasAny = Array.from(selectedGrouped.values()).some((arr) => arr.length > 0);

  if (!hasAny) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No characters selected yet. Use the Browse tab to add characters.
      </Typography>
    );
  }

  return (
    <>
      {TYPE_ORDER.map((type) => {
        const chars = selectedGrouped.get(type) ?? [];
        if (chars.length === 0) return null;
        const color = getCharacterTypeColor(type);

        return (
          <Box key={type} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color, mb: 0.5 }}>
              {type} ({chars.length})
            </Typography>
            <Divider sx={{ mb: 0.5 }} />
            {chars.map((ch) => (
              <CharacterRow key={ch.id} character={ch} selected color={color} onToggle={onToggle} />
            ))}
          </Box>
        );
      })}
    </>
  );
});

// ──────────────────────────────────────────────
// Sub-component: single character row
// ──────────────────────────────────────────────

const CharacterRow = memo(function CharacterRow({
  character,
  selected,
  color,
  onToggle,
}: {
  character: CharacterDef;
  selected: boolean;
  color: string;
  onToggle: (id: string) => void;
}) {
  return (
    <FormControlLabel
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mx: 0,
        mb: 0.25,
        '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 },
      }}
      control={
        <Checkbox
          checked={selected}
          onChange={() => onToggle(character.id)}
          size="small"
          sx={{
            color,
            '&.Mui-checked': { color },
            mt: -0.5,
          }}
        />
      }
      label={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: color,
                mr: 0.75,
                verticalAlign: 'middle',
              }}
            />
            {character.name}
            {character.edition && (
              <Chip
                component="span"
                label={EditionLabel[character.edition] ?? character.edition}
                size="small"
                variant="outlined"
                sx={{
                  ml: 0.75,
                  height: 16,
                  fontSize: '0.6rem',
                  verticalAlign: 'middle',
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            )}
          </Typography>
          {character.abilityShort && character.abilityShort !== '<TODO>' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1.3, mt: 0.25 }}
            >
              {character.abilityShort}
            </Typography>
          )}
        </Box>
      }
    />
  );
});
