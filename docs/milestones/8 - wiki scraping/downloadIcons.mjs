/**
 * M8.2 — Download character icon PNGs from the BotC wiki.
 *
 * Uses the MediaWiki API to resolve icon file URLs in batches,
 * then downloads each PNG to UI/public/icons/characters/{id}Icon.png.
 *
 * Usage:
 *   node "docs/milestones/8 - wiki scraping/downloadIcons.mjs"
 *   node "docs/milestones/8 - wiki scraping/downloadIcons.mjs" --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');
const API_BASE = 'https://wiki.bloodontheclocktower.com/api.php';
const ICONS_DIR = path.resolve(__dirname, '../../../UI/public/icons/characters');
const CHARS_DIR = path.resolve(__dirname, '../../../UI/src/data/characters');
const BATCH_SIZE = 50; // MediaWiki API limit for anonymous requests
const DOWNLOAD_DELAY_MS = 200; // Be polite to the wiki server

// ─── Collect all character IDs from barrel export ───────────────────

function getAllCharacterIds() {
  const indexPath = path.join(CHARS_DIR, 'index.ts');
  const content = fs.readFileSync(indexPath, 'utf-8');

  // Match: import { characterid } from './type/characterid.ts';
  const importRegex = /import\s+\{\s*(\w+)\s*\}\s+from\s+'\.\/\w+\/\w+\.ts';/g;
  const ids = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

// ─── Resolve icon URLs via MediaWiki API ────────────────────────────

async function resolveIconUrls(characterIds) {
  const results = new Map(); // characterId -> imageUrl

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < characterIds.length; i += BATCH_SIZE) {
    const batch = characterIds.slice(i, i + BATCH_SIZE);
    const titles = batch.map((id) => `File:Icon_${id}.png`).join('|');

    const url = `${API_BASE}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json`;

    const resp = await fetch(url);
    const data = await resp.json();

    // Build a map of normalized title -> original characterId
    // MediaWiki normalizes underscores to spaces in titles
    const titleToId = new Map();
    for (const id of batch) {
      // After normalization: "File:Icon_xyz.png" -> "File:Icon xyz.png"
      const normalized = `File:Icon ${id}.png`;
      titleToId.set(normalized, id);
    }

    // Also handle any explicit normalization entries from the API
    const normalizations = data.query?.normalized || [];
    for (const norm of normalizations) {
      // norm.from -> norm.to: map the "to" title back to original ID
      const origId = batch.find(
        (id) => `File:Icon_${id}.png` === norm.from.replace(/ /g, '_')
      );
      if (origId) {
        titleToId.set(norm.to, origId);
      }
    }

    const pages = data.query?.pages || {};
    for (const page of Object.values(pages)) {
      const imgUrl = page.imageinfo?.[0]?.url;
      const charId = titleToId.get(page.title);
      if (charId && imgUrl) {
        results.set(charId, imgUrl);
      }
    }

    // Log progress
    const batchEnd = Math.min(i + BATCH_SIZE, characterIds.length);
    const resolved = [...batch].filter((id) => results.has(id)).length;
    console.log(
      `  API batch ${Math.floor(i / BATCH_SIZE) + 1}: resolved ${resolved}/${batch.length} icons (chars ${i + 1}-${batchEnd})`
    );
  }

  return results;
}

// ─── Download a single icon PNG ─────────────────────────────────────

async function downloadIcon(imageUrl, outputPath) {
  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${imageUrl}`);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== M8.2 Icon Download${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  // 1. Collect all character IDs
  const characterIds = getAllCharacterIds();
  console.log(`Found ${characterIds.length} characters in barrel export.\n`);

  // 2. Ensure output directory exists
  if (!DRY_RUN) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log(`Output directory: ${ICONS_DIR}\n`);
  }

  // 3. Check which icons already exist (skip re-downloading)
  const existing = new Set();
  if (fs.existsSync(ICONS_DIR)) {
    for (const file of fs.readdirSync(ICONS_DIR)) {
      if (file.endsWith('Icon.png')) {
        const id = file.replace('Icon.png', '');
        existing.add(id);
      }
    }
  }
  if (existing.size > 0) {
    console.log(`${existing.size} icons already downloaded — will skip.\n`);
  }

  // Filter to only characters needing icons
  const needsDownload = characterIds.filter((id) => !existing.has(id));
  console.log(`${needsDownload.length} icons to download.\n`);

  if (needsDownload.length === 0) {
    console.log('All icons already present. Nothing to do.');
    return;
  }

  // 4. Resolve icon URLs via API
  console.log('Resolving icon URLs via MediaWiki API...');
  const urlMap = await resolveIconUrls(needsDownload);
  console.log(`\nResolved ${urlMap.size}/${needsDownload.length} icon URLs.\n`);

  const missing = needsDownload.filter((id) => !urlMap.has(id));
  if (missing.length > 0) {
    console.log(`⚠  Missing icons (${missing.length}):`);
    missing.forEach((id) => console.log(`   - ${id}`));
    console.log();
  }

  if (DRY_RUN) {
    console.log('DRY RUN — no files downloaded.');
    console.log('\nSample URLs:');
    let count = 0;
    for (const [id, url] of urlMap) {
      console.log(`  ${id}Icon.png <- ${url}`);
      if (++count >= 10) {
        console.log(`  ... and ${urlMap.size - 10} more`);
        break;
      }
    }
    return;
  }

  // 5. Download each icon
  console.log('Downloading icons...');
  let downloaded = 0;
  let failed = 0;
  let totalBytes = 0;

  for (const [id, imageUrl] of urlMap) {
    const outputPath = path.join(ICONS_DIR, `${id}Icon.png`);
    try {
      const bytes = await downloadIcon(imageUrl, outputPath);
      totalBytes += bytes;
      downloaded++;

      if (downloaded % 20 === 0 || downloaded === urlMap.size) {
        console.log(
          `  Downloaded ${downloaded}/${urlMap.size} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`
        );
      }

      // Polite delay between downloads
      await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_DELAY_MS));
    } catch (err) {
      console.error(`  ✗ Failed to download ${id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Download Complete ===`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Missing from wiki: ${missing.length}`);
  console.log(`  Total size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Skipped (existing): ${existing.size}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
