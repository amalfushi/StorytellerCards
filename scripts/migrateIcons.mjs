/**
 * M22 Icon Migration Script — Copies WebP icons from botc-release
 * into our UI/public/icons/characters/ directory.
 *
 * Strategy: Use plain .webp if available, otherwise _g.webp (good variant).
 * Names follow our convention: {characterId}Icon.webp
 *
 * Usage: node scripts/migrateIcons.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = 'D:/StorytellerCards/botc-release/resources/characters';
const TARGET_DIR = path.resolve(__dirname, '../UI/public/icons/characters');
const CHAR_DIR = path.resolve(__dirname, '../UI/src/data/characters');

// Collect all character IDs from our character files
function getAllCharacterIds() {
  const TYPE_DIRS = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric'];
  const ids = [];
  for (const dir of TYPE_DIRS) {
    const dirPath = path.join(CHAR_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.ts') && !f.startsWith('_') && !f.endsWith('.test.ts'));
    for (const f of files) {
      ids.push(path.basename(f, '.ts'));
    }
  }
  return ids;
}

// Build a map of all available WebP files across edition subdirectories
function buildSourceMap() {
  const map = new Map(); // characterId → full path to best WebP
  const editions = fs.readdirSync(SOURCE_DIR);
  
  for (const ed of editions) {
    const edPath = path.join(SOURCE_DIR, ed);
    if (!fs.statSync(edPath).isDirectory()) continue;
    
    const files = fs.readdirSync(edPath);
    for (const f of files) {
      if (!f.endsWith('.webp')) continue;
      const match = f.match(/^(.+?)(?:_(e|g))?\.webp$/);
      if (!match) continue;
      
      const charId = match[1];
      const variant = match[2] || 'plain'; // 'e', 'g', or 'plain'
      
      if (!map.has(charId)) map.set(charId, {});
      map.get(charId)[variant] = path.join(edPath, f);
    }
  }
  return map;
}

function main() {
  const charIds = getAllCharacterIds();
  console.log(`Found ${charIds.length} character IDs in our codebase`);
  
  const sourceMap = buildSourceMap();
  console.log(`Found ${sourceMap.size} characters in botc-release icons`);
  
  let copied = 0;
  let missing = 0;
  let totalOldSize = 0;
  let totalNewSize = 0;
  const missingChars = [];
  
  for (const charId of charIds) {
    const variants = sourceMap.get(charId);
    if (!variants) {
      console.log(`  ⚠ No WebP icon for: ${charId}`);
      missing++;
      missingChars.push(charId);
      continue;
    }
    
    // Prefer: plain > g (good) > e (evil)
    const sourcePath = variants.plain || variants.g || variants.e;
    const targetPath = path.join(TARGET_DIR, `${charId}Icon.webp`);
    
    fs.copyFileSync(sourcePath, targetPath);
    
    const newSize = fs.statSync(targetPath).size;
    totalNewSize += newSize;
    
    // Check old PNG size
    const oldPng = path.join(TARGET_DIR, `${charId}Icon.png`);
    if (fs.existsSync(oldPng)) {
      totalOldSize += fs.statSync(oldPng).size;
    }
    
    copied++;
  }
  
  console.log(`\n✅ Copied: ${copied} WebP icons`);
  console.log(`⚠ Missing: ${missing}`);
  if (missingChars.length > 0) {
    console.log(`  Missing chars: ${missingChars.join(', ')}`);
  }
  console.log(`\n📊 Size comparison:`);
  console.log(`  Old PNGs: ${(totalOldSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  New WebPs: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Reduction: ${((1 - totalNewSize / totalOldSize) * 100).toFixed(1)}%`);
}

main();
