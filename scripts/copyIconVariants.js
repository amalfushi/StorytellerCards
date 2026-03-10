/**
 * Copy alignment-variant character icons (_e.webp, _g.webp) from
 * botc-release/resources/characters/ into UI/public/icons/characters/.
 *
 * Source structure: {edition}/{characterId}_e.webp, {edition}/{characterId}_g.webp
 * Target structure: {characterId}Icon_e.webp, {characterId}Icon_g.webp (flat)
 *
 * Skips fabled/ and loric/ (no alignment variants exist for those).
 */

import { readdirSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const SOURCE_ROOT = join(__dirname, '..', '..', 'botc-release', 'resources', 'characters');
const TARGET_DIR = join(__dirname, '..', 'UI', 'public', 'icons', 'characters');

// Editions that have alignment variants
const EDITIONS_WITH_VARIANTS = ['tb', 'bmr', 'snv', 'carousel'];
// fabled and loric have NO _e/_g variants — skip

if (!existsSync(SOURCE_ROOT)) {
  console.error(`Source directory not found: ${SOURCE_ROOT}`);
  process.exit(1);
}

if (!existsSync(TARGET_DIR)) {
  mkdirSync(TARGET_DIR, { recursive: true });
}

let copiedE = 0;
let copiedG = 0;
let skipped = 0;

for (const edition of EDITIONS_WITH_VARIANTS) {
  const editionDir = join(SOURCE_ROOT, edition);
  if (!existsSync(editionDir)) {
    console.warn(`Edition directory not found, skipping: ${editionDir}`);
    continue;
  }

  const files = readdirSync(editionDir);
  for (const file of files) {
    // Match _e.webp or _g.webp files
    const eMatch = file.match(/^(.+)_e\.webp$/);
    const gMatch = file.match(/^(.+)_g\.webp$/);

    if (eMatch) {
      const charId = eMatch[1];
      const targetFile = `${charId}Icon_e.webp`;
      copyFileSync(join(editionDir, file), join(TARGET_DIR, targetFile));
      copiedE++;
    } else if (gMatch) {
      const charId = gMatch[1];
      const targetFile = `${charId}Icon_g.webp`;
      copyFileSync(join(editionDir, file), join(TARGET_DIR, targetFile));
      copiedG++;
    } else {
      // Not a variant file — skip
      skipped++;
    }
  }
}

console.log(`\nIcon variant copy complete:`);
console.log(`  Evil (_e) variants copied: ${copiedE}`);
console.log(`  Good (_g) variants copied: ${copiedG}`);
console.log(`  Total variants copied: ${copiedE + copiedG}`);
console.log(`  Non-variant files skipped: ${skipped}`);
console.log(`  Target directory: ${TARGET_DIR}`);
