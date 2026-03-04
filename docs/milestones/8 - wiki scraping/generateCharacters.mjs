/**
 * M8 Character File Generator
 *
 * Parses wiki XML dumps + nightOrder.json to generate individual .ts
 * character files following the M6 template pattern.
 *
 * Usage:  node generateCharacters.mjs [--dry-run] [--type Townsfolk]
 *
 * Data sources:
 *   - XML dumps in this folder (Townsfolk.xml, Outsiders.xml, etc.)
 *   - nightOrder.json recovered from git (docs/milestones/6 - character restructuring/)
 *   - NightOrder.md master reference (docs/milestones/1 - initial app setup/)
 *
 * Output:
 *   - Character .ts files in UI/src/data/characters/{type}/
 *   - Updated index.ts barrel export
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ── Paths ──
const SCRIPT_DIR = resolve(import.meta.dirname);
const ROOT = resolve(SCRIPT_DIR, '..', '..', '..');
const CHARACTERS_DIR = join(ROOT, 'UI', 'src', 'data', 'characters');
const NIGHT_ORDER_PATH = join(ROOT, 'docs', 'milestones', '6 - character restructuring', 'nightOrder.json');

const DRY_RUN = process.argv.includes('--dry-run');
const TYPE_FILTER = (() => {
  const idx = process.argv.indexOf('--type');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ── Type mapping from XML filename to CharacterType ──
const XML_FILES = [
  { file: 'Townsfolk.xml', type: 'Townsfolk', subdir: 'townsfolk', alignment: 'Good', placeholder: '#1976d2' },
  { file: 'Outsiders.xml', type: 'Outsider', subdir: 'outsider', alignment: 'Good', placeholder: '#42a5f5' },
  { file: 'Minions.xml', type: 'Minion', subdir: 'minion', alignment: 'Evil', placeholder: '#d32f2f' },
  { file: 'Demons.xml', type: 'Demon', subdir: 'demon', alignment: 'Evil', placeholder: '#b71c1c' },
  { file: 'Travellers.xml', type: 'Traveller', subdir: 'traveller', alignment: 'Unknown', placeholder: '#9c27b0' },
  { file: 'Fabled.xml', type: 'Fabled', subdir: 'fabled', alignment: 'Good', placeholder: '#ff9800' },
  { file: 'Loric.xml', type: 'Loric', subdir: 'loric', alignment: 'Good', placeholder: '#558b2f' },
];

// ── Character ID generation: lowercase, no spaces, no hyphens, no apostrophes ──
function toCharacterId(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')     // remove apostrophes
    .replace(/[^a-z0-9]/g, '') // remove everything except alphanumerics
    .trim();
}

// ── Wiki link generation ──
function toWikiLink(name) {
  return `https://wiki.bloodontheclocktower.com/${name.replace(/ /g, '_')}`;
}

// ── HTML entity decoding ──
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ── Strip wikitext markup ──
function stripWikiMarkup(text) {
  let result = text;
  // Remove HTML tags
  result = result.replace(/<[^>]+>/g, '');
  // Remove wiki links: [[File:...|...]] → remove entirely
  result = result.replace(/\[\[File:[^\]]*\]\]/g, '');
  // Remove template calls: {{Good|Name}} → Name, {{Evil|Name}} → Name, {{Jinx|...}} → remove
  result = result.replace(/\{\{Jinx\|[^}]*\}\}/g, '');
  result = result.replace(/\{\{(?:Good|Evil)\|([^}]*)\}\}/g, '$1');
  result = result.replace(/\{\{[^}]*\}\}/g, '');
  // Remove wiki links: [[Character Types#Townsfolk|Townsfolk]] → Townsfolk
  result = result.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1');
  // Remove simple wiki links: [[Some Page]] → Some Page
  result = result.replace(/\[\[([^\]]*)\]\]/g, '$1');
  // Remove bold/italic markers
  result = result.replace(/'{2,}/g, '');
  // Remove heading markers
  result = result.replace(/^=+\s*/gm, '');
  result = result.replace(/\s*=+$/gm, '');
  // Collapse whitespace
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

// ── Extract sections from wikitext ──
function extractSection(wikitext, sectionName) {
  // Match == Section Name == through to the next == heading or end
  const regex = new RegExp(
    `==\\s*${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s|$)`,
    'i'
  );
  const match = wikitext.match(regex);
  return match ? match[1].trim() : null;
}

// ── Extract ability short from Summary section ──
function extractAbilityShort(wikitext) {
  const summary = extractSection(wikitext, 'Summary');
  if (!summary) return null;

  // The ability is usually the first quoted line in Summary
  // Pattern: "ability text here"
  const quoteMatch = summary.match(/"([^"]+)"/);
  if (quoteMatch) {
    return decodeEntities(stripWikiMarkup(quoteMatch[1])).trim();
  }

  // Fallback: first non-empty line
  const lines = summary.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    return decodeEntities(stripWikiMarkup(lines[0])).trim();
  }
  return null;
}

// ── Extract ability detailed from Summary section (bullet points after the quote) ──
function extractAbilityDetailed(wikitext) {
  const summary = extractSection(wikitext, 'Summary');
  if (!summary) return null;

  // Get everything after the first quoted line
  const lines = summary.split('\n');
  let pastQuote = false;
  const detailLines = [];

  for (const line of lines) {
    if (!pastQuote) {
      if (line.includes('"')) {
        pastQuote = true;
      }
      continue;
    }
    const stripped = stripWikiMarkup(line).trim();
    if (stripped && stripped.startsWith('*')) {
      detailLines.push(stripped.replace(/^\*\s*/, '• '));
    } else if (stripped) {
      detailLines.push(stripped);
    }
  }

  if (detailLines.length === 0) return null;
  return decodeEntities(detailLines.join('\n'));
}

// ── Extract How to Run text ──
function extractHowToRun(wikitext) {
  const howToRun = extractSection(wikitext, 'How to Run');
  if (!howToRun) return null;
  return decodeEntities(stripWikiMarkup(howToRun)).trim();
}

// ── Extract jinxes from wikitext ──
function extractJinxes(wikitext) {
  // Match {{Jinx|CharName|charid|alignment|description}}
  const jinxes = [];
  const regex = /\{\{Jinx\|([^|]*)\|([^|]*)\|([^|]*)\|([^}]*)\}\}/g;
  let match;
  while ((match = regex.exec(wikitext)) !== null) {
    const targetName = match[1].trim();
    const description = decodeEntities(match[4].trim());
    jinxes.push({
      characterId: toCharacterId(targetName),
      description,
    });
  }
  return jinxes;
}

// ── Extract setup modifications from ability text ──
function extractSetupModification(abilityShort) {
  if (!abilityShort) return null;
  // Look for patterns like [+2 Outsiders] or [-1 Outsider]
  const setupMatch = abilityShort.match(/\[[+-]\d+\s+\w+\]/);
  if (setupMatch) {
    return { description: abilityShort };
  }
  return null;
}

// ── Extract reminder tokens from How to Run text ──
function extractReminders(howToRun, characterId) {
  if (!howToRun) return [];
  const reminders = [];
  const seen = new Set();
  // Look for bold reminder token names: '''TOKEN_NAME'''
  // In the raw wikitext (before stripping), look for '''...'''
  const regex = /'''([A-Z][A-Z\s]+[A-Z])'''/g;
  let match;
  while ((match = regex.exec(howToRun)) !== null) {
    const tokenText = match[1].trim();
    // Skip common info tokens that aren't character-specific reminders
    const skipTokens = ['YOU ARE', 'THIS IS THE DEMON', 'THESE ARE YOUR MINIONS',
      'THESE CHARACTERS ARE NOT IN PLAY', 'THIS CHARACTER SELECTED YOU',
      'THIS PLAYER IS', 'DEAD'];
    if (skipTokens.includes(tokenText)) continue;
    if (seen.has(tokenText)) continue;
    seen.add(tokenText);
    const reminderId = `${characterId}-${tokenText.toLowerCase().replace(/\s+/g, '')}`;
    reminders.push({ id: reminderId, text: tokenText });
  }
  return reminders;
}

// ── Parse choices from night action help text ──
function parseChoicesFromHelpText(helpText) {
  if (!helpText) return [];
  const lower = helpText.toLowerCase();
  const choices = [];

  // Compound: "chooses a player & a character"
  if (/chooses?\s+a\s+player\s+&\s+a\s+(?:demon\s+)?character/.test(lower)) {
    choices.push({ type: 'player', maxSelections: 1, label: 'Choose a player' });
    choices.push({ type: 'character', maxSelections: 1, label: 'Choose a character' });
    return choices;
  }

  // Multi living player: "chooses 2 living players"
  const multiLivingMatch = lower.match(/(?:chooses?|might\s+choose)\s+(\d+)\s+living\s+players?/);
  if (multiLivingMatch) {
    const count = parseInt(multiLivingMatch[1], 10);
    choices.push({ type: 'livingPlayer', maxSelections: count, label: `Choose ${count} living players` });
    return choices;
  }

  // Multi player: "chooses 2 players" / "chooses 3 players"
  const multiPlayerMatch = lower.match(/(?:chooses?|might\s+choose)\s+(\d+)\s+players?/);
  if (multiPlayerMatch) {
    const count = parseInt(multiPlayerMatch[1], 10);
    choices.push({ type: 'player', maxSelections: count, label: `Choose ${count} players` });
    return choices;
  }

  // "Point to 2 players" / "Point to the 2 players"
  const pointMultiMatch = lower.match(/points?\s+to\s+(?:the\s+)?(\d+)\s+players?/);
  if (pointMultiMatch) {
    const count = parseInt(pointMultiMatch[1], 10);
    choices.push({ type: 'player', maxSelections: count, label: `Choose ${count} players` });
    return choices;
  }

  // Single living player
  if (/(?:chooses?|might\s+choose)\s+a\s+living\s+player/.test(lower)) {
    choices.push({ type: 'livingPlayer', maxSelections: 1, label: 'Choose a living player' });
    return choices;
  }

  // Single dead player
  if (/(?:chooses?|might\s+choose)\s+a\s+dead\s+player/.test(lower)) {
    choices.push({ type: 'deadPlayer', maxSelections: 1, label: 'Choose a dead player' });
    return choices;
  }

  // Single player
  if (/(?:chooses?|might\s+choose)\s+a\s+player/.test(lower) ||
      /points?\s+to\s+a\s+player/.test(lower)) {
    choices.push({ type: 'player', maxSelections: 1, label: 'Choose a player' });
    return choices;
  }

  // Single character
  if (/(?:chooses?|might\s+choose)\s+a\s+character/.test(lower) ||
      /name\s+a\s+character/.test(lower)) {
    choices.push({ type: 'character', maxSelections: 1, label: 'Choose a character' });
    return choices;
  }

  // Yes/No
  if (/(?:either\s+)?nod\s+(?:yes\s+)?or\s+shake/.test(lower) ||
      /shake\s+(?:no\s+)?or\s+nod/.test(lower) ||
      /nod\s+or\s+shake/.test(lower)) {
    choices.push({ type: 'yesno', maxSelections: 1, label: 'Nod / Shake' });
    return choices;
  }

  // Alignment
  if (/good\s+or\s+evil/.test(lower) || /choose.*alignment/.test(lower)) {
    choices.push({ type: 'alignment', maxSelections: 1, label: 'Alignment' });
    return choices;
  }

  return choices;
}

// ── Parse XML dump to extract pages ──
function parseXmlDump(xmlContent) {
  const pages = [];
  // Split by <page> tags
  const pageRegex = /<page>([\s\S]*?)<\/page>/g;
  let pageMatch;

  while ((pageMatch = pageRegex.exec(xmlContent)) !== null) {
    const pageXml = pageMatch[1];

    // Extract title
    const titleMatch = pageXml.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) continue;
    const title = decodeEntities(titleMatch[1].trim());

    // Extract wikitext content (inside <text ...>...</text>)
    const textMatch = pageXml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
    if (!textMatch) continue;
    const wikitext = decodeEntities(textMatch[1]);

    pages.push({ title, wikitext });
  }

  return pages;
}

// ── Load night order data ──
function loadNightOrder() {
  const data = JSON.parse(readFileSync(NIGHT_ORDER_PATH, 'utf-8'));
  const map = new Map();

  // Build a map of characterId → { firstNight, otherNights }
  for (const entry of data.firstNight) {
    if (entry.type !== 'character') continue;
    if (!map.has(entry.id)) {
      map.set(entry.id, { firstNight: null, otherNights: null });
    }
    map.get(entry.id).firstNight = entry;
  }
  for (const entry of data.otherNights) {
    if (entry.type !== 'character') continue;
    if (!map.has(entry.id)) {
      map.set(entry.id, { firstNight: null, otherNights: null });
    }
    map.get(entry.id).otherNights = entry;
  }

  return map;
}

// ── Escape single quotes and backslashes for TypeScript string literals ──
function escapeTs(str) {
  if (!str) return str;
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

// ── Format a NightAction as TypeScript ──
function formatNightAction(entry, characterId, phase) {
  if (!entry) return 'null';
  const prefix = phase === 'fn' ? 'fn' : 'on';
  const subActions = entry.subActions || [];
  const choices = parseChoicesFromHelpText(entry.helpText);

  let result = `{\n    order: ${entry.order},\n`;
  result += `    helpText:\n      '${escapeTs(entry.helpText)}',\n`;
  result += `    subActions: [\n`;

  for (let i = 0; i < subActions.length; i++) {
    const sa = subActions[i];
    result += `      {\n`;
    result += `        id: '${characterId}-${prefix}-${i + 1}',\n`;
    result += `        description: '${escapeTs(sa.description)}',\n`;
    result += `        isConditional: ${sa.isConditional},\n`;
    result += `      },\n`;
  }

  result += `    ],\n`;

  if (choices.length > 0) {
    result += `    choices: [\n`;
    for (const c of choices) {
      result += `      { type: '${c.type}', maxSelections: ${c.maxSelections}, label: '${escapeTs(c.label)}' },\n`;
    }
    result += `    ],\n`;
  }

  result += `  }`;
  return result;
}

// ── Format reminders array ──
function formatReminders(reminders) {
  if (!reminders || reminders.length === 0) return '[]';
  let result = '[\n';
  for (const r of reminders) {
    result += `    { id: '${escapeTs(r.id)}', text: '${escapeTs(r.text)}' },\n`;
  }
  result += '  ]';
  return result;
}

// ── Format jinxes array ──
function formatJinxes(jinxes) {
  if (!jinxes || jinxes.length === 0) return null;
  let result = '[\n';
  for (const j of jinxes) {
    result += `    { characterId: '${escapeTs(j.characterId)}', description: '${escapeTs(j.description)}' },\n`;
  }
  result += '  ]';
  return result;
}

// ── Generate a character .ts file ──
function generateCharacterFile(charData) {
  const {
    id, name, type, alignment, placeholder,
    abilityShort, abilityDetailed, wikiLink,
    firstNight, otherNights,
    reminders, jinxes, setupModification,
  } = charData;

  let content = `import type { CharacterDef } from '@/types/index.ts';\n\n`;
  content += `export const ${id}: CharacterDef = {\n`;
  content += `  id: '${id}',\n`;
  content += `  name: '${escapeTs(name)}',\n`;
  content += `  type: '${type}',\n`;
  content += `  defaultAlignment: '${alignment}',\n`;
  content += `  abilityShort:\n    '${escapeTs(abilityShort || '<TODO>')}',\n`;

  if (abilityDetailed) {
    // Multi-line detailed text: use template literal
    const escapedDetailed = abilityDetailed
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    content += `  abilityDetailed:\n    \`${escapedDetailed}\`,\n`;
  }

  content += `  wikiLink: '${wikiLink}',\n`;
  content += `  firstNight: ${formatNightAction(firstNight, id, 'fn')},\n`;
  content += `  otherNights: ${formatNightAction(otherNights, id, 'on')},\n`;
  content += `  icon: { placeholder: '${placeholder}' },\n`;
  content += `  reminders: ${formatReminders(reminders)},\n`;

  if (setupModification) {
    content += `  setupModification: {\n    description: '${escapeTs(setupModification.description)}',\n  },\n`;
  }

  if (jinxes) {
    content += `  jinxes: ${formatJinxes(jinxes)},\n`;
  }

  content += `};\n`;

  return content;
}

// ── Get list of existing character IDs ──
function getExistingCharacterIds() {
  const ids = new Set();
  const subdirs = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveller', 'loric'];
  for (const subdir of subdirs) {
    const dir = join(CHARACTERS_DIR, subdir);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.ts') && !f.startsWith('_'));
    for (const file of files) {
      ids.add(file.replace('.ts', ''));
    }
  }
  return ids;
}

// ── Generate barrel index.ts ──
function generateBarrelExport(allCharacters) {
  // Group by type
  const groups = {};
  for (const c of allCharacters) {
    if (!groups[c.subdir]) groups[c.subdir] = [];
    groups[c.subdir].push(c);
  }

  // Sort each group alphabetically
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.id.localeCompare(b.id));
  }

  const typeOrder = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveller', 'loric'];
  const typeLabels = {
    townsfolk: 'Townsfolk',
    outsider: 'Outsiders',
    minion: 'Minions',
    demon: 'Demons',
    fabled: 'Fabled',
    traveller: 'Travellers',
    loric: 'Loric',
  };

  let content = `import type { CharacterDef } from '@/types/index.ts';\n\n`;

  // Imports
  for (const subdir of typeOrder) {
    const chars = groups[subdir];
    if (!chars || chars.length === 0) continue;
    content += `// ── ${typeLabels[subdir]} ──\n`;
    for (const c of chars) {
      content += `import { ${c.id} } from './${subdir}/${c.id}.ts';\n`;
    }
    content += `\n`;
  }

  // allCharacters array
  content += `/** All character definitions. */\n`;
  content += `export const allCharacters: CharacterDef[] = [\n`;
  for (const subdir of typeOrder) {
    const chars = groups[subdir];
    if (!chars || chars.length === 0) continue;
    content += `  // ${typeLabels[subdir]}\n`;
    for (const c of chars) {
      content += `  ${c.id},\n`;
    }
  }
  content += `];\n\n`;

  // Map and getCharacter
  content += `/** Fast lookup map: character ID → CharacterDef. */\n`;
  content += `export const characterMap: Map<string, CharacterDef> = new Map(allCharacters.map((c) => [c.id, c]));\n\n`;
  content += `/**\n`;
  content += ` * Get a character definition by ID.\n`;
  content += ` * Returns \`undefined\` if not found (caller should use getFallbackCharacter for unknowns).\n`;
  content += ` */\n`;
  content += `export function getCharacter(id: string): CharacterDef | undefined {\n`;
  content += `  return characterMap.get(id);\n`;
  content += `}\n\n`;
  content += `export { buildNightOrder, FIRST_NIGHT_STRUCTURAL, OTHER_NIGHTS_STRUCTURAL } from './_nightOrder.ts';\n`;

  return content;
}

// ── Extract reminders from raw wikitext (before stripping) ──
function extractRemindersFromWikitext(wikitext, characterId) {
  if (!wikitext) return [];
  const howToRun = extractSection(wikitext, 'How to Run');
  if (!howToRun) return [];
  
  const reminders = [];
  const seen = new Set();
  // Look for bold reminder token names in raw wikitext: '''TOKEN_NAME'''
  const regex = /'''([A-Z][A-Z\s]*[A-Z])'''/g;
  let match;
  while ((match = regex.exec(howToRun)) !== null) {
    const tokenText = match[1].trim();
    // Skip common info tokens
    const skipTokens = ['YOU ARE', 'THIS IS THE DEMON', 'THESE ARE YOUR MINIONS',
      'THESE CHARACTERS ARE NOT IN PLAY', 'THIS CHARACTER SELECTED YOU',
      'THIS PLAYER IS', 'DEAD', 'FINAL NIGHT'];
    if (skipTokens.includes(tokenText)) continue;
    if (seen.has(tokenText)) continue;
    seen.add(tokenText);
    const reminderId = `${characterId}-${tokenText.toLowerCase().replace(/\s+/g, '')}`;
    reminders.push({ id: reminderId, text: tokenText });
  }
  return reminders;
}

// ══════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════

console.log('=== M8 Character File Generator ===\n');

// Step 1: Load night order data
console.log('Loading night order data...');
const nightOrderMap = loadNightOrder();
console.log(`  Found ${nightOrderMap.size} characters with night actions\n`);

// Step 2: Parse all XML dumps
console.log('Parsing XML dumps...');
const allParsedCharacters = [];

for (const xmlConfig of XML_FILES) {
  if (TYPE_FILTER && xmlConfig.type !== TYPE_FILTER) continue;

  const xmlPath = join(SCRIPT_DIR, xmlConfig.file);
  if (!existsSync(xmlPath)) {
    console.log(`  ⚠ ${xmlConfig.file} not found, skipping`);
    continue;
  }

  const xmlContent = readFileSync(xmlPath, 'utf-8');
  const pages = parseXmlDump(xmlContent);
  console.log(`  ${xmlConfig.file}: ${pages.length} characters found`);

  for (const page of pages) {
    const id = toCharacterId(page.title);
    const abilityShort = extractAbilityShort(page.wikitext);
    const abilityDetailed = extractAbilityDetailed(page.wikitext);
    const jinxes = extractJinxes(page.wikitext);
    const reminders = extractRemindersFromWikitext(page.wikitext, id);
    const setupMod = extractSetupModification(abilityShort);
    const nightData = nightOrderMap.get(id) || { firstNight: null, otherNights: null };

    allParsedCharacters.push({
      id,
      name: page.title,
      type: xmlConfig.type,
      subdir: xmlConfig.subdir,
      alignment: xmlConfig.alignment,
      placeholder: xmlConfig.placeholder,
      abilityShort,
      abilityDetailed,
      wikiLink: toWikiLink(page.title),
      firstNight: nightData.firstNight,
      otherNights: nightData.otherNights,
      reminders,
      jinxes: jinxes.length > 0 ? jinxes : null,
      setupModification: setupMod,
    });
  }
}

console.log(`\nTotal parsed: ${allParsedCharacters.length} characters\n`);

// Step 3: Determine which characters are new vs existing
const existingIds = getExistingCharacterIds();
const newCharacters = allParsedCharacters.filter(c => !existingIds.has(c.id));
const existingCharacters = allParsedCharacters.filter(c => existingIds.has(c.id));

console.log(`Existing characters: ${existingIds.size}`);
console.log(`Characters to create: ${newCharacters.length}`);
console.log(`Characters to update (wikiLink, abilityDetailed): ${existingCharacters.length}\n`);

// Characters in nightOrder but NOT in XML dumps
const xmlIds = new Set(allParsedCharacters.map(c => c.id));
const nightOnlyIds = [...nightOrderMap.keys()].filter(id => !xmlIds.has(id));
if (nightOnlyIds.length > 0) {
  console.log(`⚠ Characters in nightOrder.json but not in XML dumps: ${nightOnlyIds.join(', ')}\n`);
}

// Characters in XML but NOT in nightOrder (no night action — expected for some)
const noNightAction = allParsedCharacters.filter(
  c => !nightOrderMap.has(c.id)
);
if (noNightAction.length > 0) {
  console.log(`Characters without night actions (expected for passive characters):`);
  console.log(`  ${noNightAction.map(c => c.name).join(', ')}\n`);
}

// Step 4: Create new character files
if (!DRY_RUN) {
  console.log('Creating new character files...');
  let created = 0;

  for (const charData of newCharacters) {
    const dir = join(CHARACTERS_DIR, charData.subdir);
    mkdirSync(dir, { recursive: true });

    const filePath = join(dir, `${charData.id}.ts`);
    const content = generateCharacterFile(charData);
    writeFileSync(filePath, content, 'utf-8');
    created++;
  }
  console.log(`  Created ${created} new character files\n`);

  // Step 5: Update existing character files with wikiLink and abilityDetailed
  console.log('Updating existing characters with wikiLink and abilityDetailed...');
  let updated = 0;

  for (const charData of existingCharacters) {
    const filePath = join(CHARACTERS_DIR, charData.subdir, `${charData.id}.ts`);
    if (!existsSync(filePath)) continue;

    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Add wikiLink if not present
    if (!content.includes('wikiLink')) {
      // Insert after abilityShort (or abilityDetailed if present)
      const insertAfter = content.includes('abilityDetailed')
        ? /abilityDetailed:.*?,\n/s
        : /abilityShort:.*?,\n/s;
      
      const match = content.match(insertAfter);
      if (match) {
        const insertPos = match.index + match[0].length;
        content = content.slice(0, insertPos) +
          `  wikiLink: '${charData.wikiLink}',\n` +
          content.slice(insertPos);
        modified = true;
      }
    }

    // Add abilityDetailed if not present and we have it
    if (!content.includes('abilityDetailed') && charData.abilityDetailed) {
      const insertAfter = /abilityShort:.*?,\n/s;
      const match = content.match(insertAfter);
      if (match) {
        const escapedDetailed = charData.abilityDetailed
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$');
        const insertPos = match.index + match[0].length;
        content = content.slice(0, insertPos) +
          `  abilityDetailed:\n    \`${escapedDetailed}\`,\n` +
          content.slice(insertPos);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      updated++;
    }
  }
  console.log(`  Updated ${updated} existing character files\n`);

  // Step 6: Generate barrel index.ts
  console.log('Generating barrel export index.ts...');
  
  // Collect all characters (existing + new)
  const allCharsForBarrel = [];
  const subdirs = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveller', 'loric'];
  for (const subdir of subdirs) {
    const dir = join(CHARACTERS_DIR, subdir);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.ts') && !f.startsWith('_') && !f.startsWith('.'));
    for (const file of files) {
      const charId = file.replace('.ts', '');
      allCharsForBarrel.push({ id: charId, subdir });
    }
  }

  const barrelContent = generateBarrelExport(allCharsForBarrel);
  writeFileSync(join(CHARACTERS_DIR, 'index.ts'), barrelContent, 'utf-8');
  console.log(`  Generated index.ts with ${allCharsForBarrel.length} characters\n`);
} else {
  console.log('[DRY RUN] Would create these new characters:');
  for (const c of newCharacters) {
    console.log(`  ${c.subdir}/${c.id}.ts — ${c.name}`);
  }
  console.log(`\n[DRY RUN] Would update ${existingCharacters.length} existing characters with wikiLink/abilityDetailed`);
}

// Step 7: Summary report
console.log('=== Summary ===');
console.log(`Total characters in XML dumps: ${allParsedCharacters.length}`);
console.log(`Previously existing: ${existingIds.size}`);
console.log(`New files created: ${DRY_RUN ? '(dry run)' : newCharacters.length}`);
console.log(`Existing files updated: ${DRY_RUN ? '(dry run)' : existingCharacters.length}`);
console.log(`Characters with first night actions: ${allParsedCharacters.filter(c => c.firstNight).length}`);
console.log(`Characters with other night actions: ${allParsedCharacters.filter(c => c.otherNights).length}`);
console.log(`Characters with jinxes: ${allParsedCharacters.filter(c => c.jinxes).length}`);
console.log(`Characters with setup modifications: ${allParsedCharacters.filter(c => c.setupModification).length}`);
console.log('\nDone!');
