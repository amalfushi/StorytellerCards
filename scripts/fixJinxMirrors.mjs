/**
 * M22 Jinx Mirror Fix — Ensures all jinxes are bidirectional.
 * For every jinx A→B, adds B→A if it doesn't already exist.
 *
 * Uses jinxes.json as the source of truth for descriptions.
 * Usage: node scripts/fixJinxMirrors.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JINXES_PATH = 'D:/StorytellerCards/botc-release/resources/data/jinxes.json';
const CHAR_DIR = path.resolve(__dirname, '../UI/src/data/characters');
const TYPE_DIRS = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric'];

function escapeForSingleQuote(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function main() {
  // Load jinxes.json to get canonical descriptions
  const jinxesData = JSON.parse(fs.readFileSync(JINXES_PATH, 'utf-8'));
  
  // Build a description lookup: "charA|charB" → description
  const descriptionMap = new Map();
  for (const entry of jinxesData) {
    for (const jinx of entry.jinx) {
      const key1 = `${entry.id}|${jinx.id}`;
      const key2 = `${jinx.id}|${entry.id}`;
      descriptionMap.set(key1, jinx.reason);
      descriptionMap.set(key2, jinx.reason);
    }
  }

  // Parse existing jinxes from all character files
  const charJinxes = new Map(); // charId → Set of targetIds
  const charFiles = new Map(); // charId → file path
  const charDirs = new Map(); // charId → dir name

  for (const dir of TYPE_DIRS) {
    const dirPath = path.join(CHAR_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.ts') && !f.startsWith('_') && !f.endsWith('.test.ts'));
    
    for (const file of files) {
      const charId = path.basename(file, '.ts');
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      charFiles.set(charId, filePath);
      charDirs.set(charId, dir);
      
      // Extract existing jinx target IDs
      const targets = new Set();
      const regex = /characterId:\s*'([^']+)'/g;
      const jinxBlockMatch = content.match(/jinxes:\s*\[([\s\S]*?)\],/);
      if (jinxBlockMatch) {
        let m;
        while ((m = regex.exec(jinxBlockMatch[1])) !== null) {
          targets.add(m[1]);
        }
      }
      charJinxes.set(charId, targets);
    }
  }

  // Find missing mirrors
  const toAdd = new Map(); // targetId → [{charId, description}]
  
  for (const [charId, targets] of charJinxes) {
    for (const targetId of targets) {
      const targetJinxes = charJinxes.get(targetId);
      if (!targetJinxes || targetJinxes.has(charId)) continue;
      
      // Need to add charId to targetId's jinxes
      const key = `${charId}|${targetId}`;
      const desc = descriptionMap.get(key) || `Jinx interaction with ${charId}`;
      
      if (!toAdd.has(targetId)) toAdd.set(targetId, []);
      toAdd.get(targetId).push({ characterId: charId, description: desc });
    }
  }

  console.log(`Found ${Array.from(toAdd.values()).reduce((s, a) => s + a.length, 0)} missing jinx mirrors across ${toAdd.size} files`);

  // Add the missing jinxes
  let updated = 0;
  for (const [targetId, newJinxes] of toAdd) {
    const filePath = charFiles.get(targetId);
    if (!filePath) {
      console.log(`  ⚠ No file for ${targetId}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if character already has a jinxes array
    const hasJinxes = /jinxes:\s*\[/.test(content);
    
    if (hasJinxes) {
      // Add new entries to existing jinxes array
      const newEntries = newJinxes.map(j => {
        const desc = escapeForSingleQuote(j.description);
        return `    {\n      characterId: '${j.characterId}',\n      description:\n        '${desc}',\n    },`;
      }).join('\n');
      
      // Find the closing ] of the jinxes array
      // Match jinxes: [ ... ],
      const jinxPattern = /(jinxes:\s*\[[\s\S]*?)(  \],)/;
      const match = content.match(jinxPattern);
      if (match) {
        content = content.replace(jinxPattern, `$1${newEntries}\n  $2`);
      }
    } else {
      // Add a new jinxes array before the flavor/edition/setup fields or before closing };
      const newEntries = newJinxes.map(j => {
        const desc = escapeForSingleQuote(j.description);
        return `    {\n      characterId: '${j.characterId}',\n      description:\n        '${desc}',\n    },`;
      }).join('\n');
      
      const jinxBlock = `  jinxes: [\n${newEntries}\n  ],\n`;
      
      // Insert before flavor: or before };
      if (content.includes('  flavor:')) {
        content = content.replace('  flavor:', jinxBlock + '  flavor:');
      } else {
        const closingIdx = content.lastIndexOf('};');
        content = content.substring(0, closingIdx) + jinxBlock + content.substring(closingIdx);
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    updated++;
    console.log(`  ✓ Added ${newJinxes.length} mirror(s) to ${targetId}`);
  }

  console.log(`\n✅ Updated ${updated} files`);
}

main();
