/**
 * updateIconPaths.mjs
 *
 * Updates all character .ts files to add icon paths (small, medium, large)
 * pointing to the downloaded PNGs in UI/public/icons/characters/.
 *
 * For characters without a downloaded icon (e.g., bigwig), the icon field
 * is left as { placeholder: '...' } only.
 *
 * Usage:
 *   node docs/milestones/8\ -\ wiki\ scraping/updateIconPaths.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..', '..');

const DRY_RUN = process.argv.includes('--dry-run');

// ── 1. Collect downloaded icon IDs ──
const iconsDir = join(repoRoot, 'UI', 'public', 'icons', 'characters');
const downloadedIcons = new Set(
  readdirSync(iconsDir)
    .filter((f) => f.endsWith('Icon.png'))
    .map((f) => f.replace('Icon.png', ''))
);
console.log(`Found ${downloadedIcons.size} downloaded icons`);

// ── 2. Parse barrel export to get character IDs and file paths ──
const indexPath = join(repoRoot, 'UI', 'src', 'data', 'characters', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

// Match lines like: import { acrobat } from './townsfolk/acrobat.ts';
const importRegex = /import\s+\{\s*(\w+)\s*\}\s+from\s+'\.\/([^']+)'/g;
const characters = [];
let match;
while ((match = importRegex.exec(indexContent)) !== null) {
  characters.push({
    id: match[1],
    relativePath: match[2],
    fullPath: join(repoRoot, 'UI', 'src', 'data', 'characters', match[2]),
  });
}
console.log(`Found ${characters.length} character imports in barrel export`);

// ── 3. Update each character file ──
let updated = 0;
let skipped = 0;
let alreadyDone = 0;

for (const char of characters) {
  const hasIcon = downloadedIcons.has(char.id);

  if (!hasIcon) {
    console.log(`  SKIP (no icon): ${char.id}`);
    skipped++;
    continue;
  }

  const filePath = char.fullPath;
  if (!existsSync(filePath)) {
    console.log(`  SKIP (file not found): ${filePath}`);
    skipped++;
    continue;
  }

  let content = readFileSync(filePath, 'utf-8');
  const iconPath = `/icons/characters/${char.id}Icon.png`;

  // Check if already has icon paths
  if (content.includes(`small: '${iconPath}'`)) {
    alreadyDone++;
    continue;
  }

  // Strategy: Replace the icon field.
  // Pattern 1: icon: { placeholder: '#xxxxxx' },
  // Pattern 2: icon: {\n    placeholder: '#xxxxxx',\n  },
  // We need to handle both single-line and multi-line icon declarations.

  // Try single-line first: icon: { placeholder: '#xxxxxx' },
  const singleLineRegex = /icon:\s*\{\s*placeholder:\s*'([^']+)'\s*\}/;
  const singleLineMatch = content.match(singleLineRegex);

  if (singleLineMatch) {
    const placeholder = singleLineMatch[1];
    const replacement = `icon: {\n    small: '${iconPath}',\n    medium: '${iconPath}',\n    large: '${iconPath}',\n    placeholder: '${placeholder}',\n  }`;
    content = content.replace(singleLineRegex, replacement);
  } else {
    // Try multi-line: icon already has some fields
    // Look for icon: { ... placeholder: '...' ... }
    const multiLineRegex = /icon:\s*\{[^}]*placeholder:\s*'([^']+)'[^}]*\}/s;
    const multiLineMatch = content.match(multiLineRegex);

    if (multiLineMatch) {
      const placeholder = multiLineMatch[1];
      const replacement = `icon: {\n    small: '${iconPath}',\n    medium: '${iconPath}',\n    large: '${iconPath}',\n    placeholder: '${placeholder}',\n  }`;
      content = content.replace(multiLineRegex, replacement);
    } else {
      console.log(`  WARN (no icon field match): ${char.id}`);
      skipped++;
      continue;
    }
  }

  if (DRY_RUN) {
    console.log(`  DRY-RUN would update: ${char.id}`);
  } else {
    writeFileSync(filePath, content, 'utf-8');
  }
  updated++;
}

console.log(`\n── Summary ──`);
console.log(`Updated: ${updated}`);
console.log(`Already done: ${alreadyDone}`);
console.log(`Skipped: ${skipped}`);
console.log(`Total: ${characters.length}`);
if (DRY_RUN) console.log('(dry-run mode — no files were modified)');
