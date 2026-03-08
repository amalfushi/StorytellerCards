/**
 * M22 Import Script — Adds flavor, edition, setup, and remindersGlobal
 * to each character .ts file from the official BotC roles.json.
 *
 * Usage: node scripts/importCharacterMeta.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_PATH = 'D:/StorytellerCards/botc-release/resources/data/roles.json';
const CHAR_DIR = path.resolve(__dirname, '../UI/src/data/characters');

// Character type → subdirectory mapping
const TYPE_TO_DIR = {
  townsfolk: 'townsfolk',
  outsider: 'outsider',
  minion: 'minion',
  demon: 'demon',
  traveller: 'traveller',
  fabled: 'fabled',
  loric: 'loric',
};

function escapeForTemplate(str) {
  // Escape backticks and ${} for template literals
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function escapeForSingleQuote(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function main() {
  const roles = JSON.parse(fs.readFileSync(ROLES_PATH, 'utf-8'));
  console.log(`Loaded ${roles.length} characters from roles.json`);

  // Build lookup by ID
  const roleMap = new Map();
  for (const role of roles) {
    roleMap.set(role.id, role);
  }

  // Track results
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const errors = [];

  // Walk all character subdirectories
  for (const [team, dir] of Object.entries(TYPE_TO_DIR)) {
    const dirPath = path.join(CHAR_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`  Skipping missing directory: ${dir}/`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') && !f.startsWith('_') && !f.endsWith('.test.ts'));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const charId = path.basename(file, '.ts');
      const role = roleMap.get(charId);

      if (!role) {
        console.log(`  ⚠ No roles.json entry for: ${charId}`);
        notFound++;
        continue;
      }

      let content = fs.readFileSync(filePath, 'utf-8');

      // Check if already has flavor field (skip if already imported)
      if (content.includes("flavor:") || content.includes("flavor :")) {
        console.log(`  ⏭ Already imported: ${charId}`);
        skipped++;
        continue;
      }

      try {
        content = addMetaFields(content, charId, role);
        fs.writeFileSync(filePath, content, 'utf-8');
        updated++;
      } catch (err) {
        console.error(`  ✗ Error processing ${charId}: ${err.message}`);
        errors.push({ charId, error: err.message });
      }
    }
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`⏭ Skipped (already imported): ${skipped}`);
  console.log(`⚠ Not found in roles.json: ${notFound}`);
  if (errors.length > 0) {
    console.log(`✗ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e.charId}: ${e.error}`));
  }
}

function addMetaFields(content, charId, role) {
  const { flavor, edition, setup, remindersGlobal } = role;

  // Build the new fields to insert
  const newFields = [];

  if (flavor) {
    // Use single-quoted string, escape apostrophes
    const escaped = escapeForSingleQuote(flavor);
    newFields.push(`  flavor:\n    '${escaped}',`);
  }

  if (edition) {
    newFields.push(`  edition: '${edition}',`);
  }

  if (setup === true) {
    newFields.push(`  setup: true,`);
  }

  if (remindersGlobal && remindersGlobal.length > 0) {
    const tokens = remindersGlobal.map(text => {
      const tokenId = `${charId}-global-${text.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`;
      const escapedText = escapeForSingleQuote(text);
      return `    { id: '${tokenId}', text: '${escapedText}', isGlobal: true },`;
    });
    newFields.push(`  remindersGlobal: [\n${tokens.join('\n')}\n  ],`);
  }

  if (newFields.length === 0) return content;

  // Strategy: insert before the closing `};` at the end of the file
  // But after jinxes (if present) or after the last field
  // Find the last `};` in the file
  const closingIndex = content.lastIndexOf('};');
  if (closingIndex === -1) {
    throw new Error('Could not find closing `};`');
  }

  // Find the line before `};` to insert after
  const before = content.substring(0, closingIndex);
  const after = content.substring(closingIndex);

  // Check if jinxes exist — if so, insert before jinxes
  // Actually, insert after jinxes (at end) is cleaner
  // Just insert our new fields before the closing `};`
  const insertion = newFields.join('\n') + '\n';

  return before + insertion + after;
}

main();
