/**
 * M8 — Update existing character files with wikiLink and abilityDetailed
 *
 * This script adds wikiLink and abilityDetailed to existing character .ts files
 * that were created in M6 (before the wiki data was available).
 *
 * Usage:  node updateExistingCharacters.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SCRIPT_DIR = resolve(import.meta.dirname);
const ROOT = resolve(SCRIPT_DIR, '..', '..', '..');
const CHARACTERS_DIR = join(ROOT, 'UI', 'src', 'data', 'characters');

// ── Character ID generation ──
function toCharacterId(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function toWikiLink(name) {
  return `https://wiki.bloodontheclocktower.com/${name.replace(/ /g, '_')}`;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripWikiMarkup(text) {
  let result = text;
  result = result.replace(/<[^>]+>/g, '');
  result = result.replace(/\[\[File:[^\]]*\]\]/g, '');
  result = result.replace(/\{\{Jinx\|[^}]*\}\}/g, '');
  result = result.replace(/\{\{(?:Good|Evil)\|([^}]*)\}\}/g, '$1');
  result = result.replace(/\{\{[^}]*\}\}/g, '');
  result = result.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1');
  result = result.replace(/\[\[([^\]]*)\]\]/g, '$1');
  result = result.replace(/'{2,}/g, '');
  result = result.replace(/^=+\s*/gm, '');
  result = result.replace(/\s*=+$/gm, '');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

function extractSection(wikitext, sectionName) {
  const regex = new RegExp(
    `==\\s*${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s|$)`,
    'i'
  );
  const match = wikitext.match(regex);
  return match ? match[1].trim() : null;
}

function extractAbilityDetailed(wikitext) {
  const summary = extractSection(wikitext, 'Summary');
  if (!summary) return null;
  const lines = summary.split('\n');
  let pastQuote = false;
  const detailLines = [];
  for (const line of lines) {
    if (!pastQuote) {
      if (line.includes('"')) pastQuote = true;
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

function parseXmlDump(xmlContent) {
  const pages = [];
  const pageRegex = /<page>([\s\S]*?)<\/page>/g;
  let pageMatch;
  while ((pageMatch = pageRegex.exec(xmlContent)) !== null) {
    const pageXml = pageMatch[1];
    const titleMatch = pageXml.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) continue;
    const title = decodeEntities(titleMatch[1].trim());
    const textMatch = pageXml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
    if (!textMatch) continue;
    const wikitext = decodeEntities(textMatch[1]);
    pages.push({ title, wikitext });
  }
  return pages;
}

// ── Process XML files ──
const XML_FILES = [
  { file: 'Townsfolk.xml', subdir: 'townsfolk' },
  { file: 'Outsiders.xml', subdir: 'outsider' },
  { file: 'Minions.xml', subdir: 'minion' },
  { file: 'Demons.xml', subdir: 'demon' },
  { file: 'Fabled.xml', subdir: 'fabled' },
  { file: 'Travellers.xml', subdir: 'traveller' },
  { file: 'Loric.xml', subdir: 'loric' },
];

// Build lookup of wiki data by character ID
const wikiData = new Map();
for (const xmlConfig of XML_FILES) {
  const xmlPath = join(SCRIPT_DIR, xmlConfig.file);
  if (!existsSync(xmlPath)) continue;
  const xmlContent = readFileSync(xmlPath, 'utf-8');
  const pages = parseXmlDump(xmlContent);
  for (const page of pages) {
    const id = toCharacterId(page.title);
    wikiData.set(id, {
      name: page.title,
      wikiLink: toWikiLink(page.title),
      abilityDetailed: extractAbilityDetailed(page.wikitext),
      subdir: xmlConfig.subdir,
    });
  }
}

console.log(`Loaded wiki data for ${wikiData.size} characters\n`);

// ── Find existing character files that need updating ──
const subdirs = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveller', 'loric'];
let updated = 0;
let skipped = 0;

for (const subdir of subdirs) {
  const dir = join(CHARACTERS_DIR, subdir);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith('.ts') && !f.startsWith('_'));

  for (const file of files) {
    const charId = file.replace('.ts', '');
    const filePath = join(dir, file);
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    const wiki = wikiData.get(charId);
    if (!wiki) {
      console.log(`  ⚠ No wiki data for ${charId}`);
      continue;
    }

    // Add wikiLink if not present
    if (!content.includes('wikiLink:') && !content.includes('wikiLink :')) {
      // Find a good insertion point — after abilityShort or abilityDetailed line end
      // We'll insert before the firstNight line
      const firstNightIndex = content.indexOf('  firstNight:');
      if (firstNightIndex !== -1) {
        content = content.slice(0, firstNightIndex) +
          `  wikiLink: '${wiki.wikiLink}',\n` +
          content.slice(firstNightIndex);
        modified = true;
      }
    }

    // Add abilityDetailed if not present and we have wiki data
    if (!content.includes('abilityDetailed:') && !content.includes('abilityDetailed :') && wiki.abilityDetailed) {
      const firstNightIndex = content.indexOf('  firstNight:');
      const wikiLinkIndex = content.indexOf('  wikiLink:');
      // Insert before wikiLink if present, otherwise before firstNight
      const insertBeforeIndex = wikiLinkIndex !== -1 ? wikiLinkIndex : firstNightIndex;
      if (insertBeforeIndex !== -1) {
        const escapedDetailed = wiki.abilityDetailed
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$');
        content = content.slice(0, insertBeforeIndex) +
          `  abilityDetailed:\n    \`${escapedDetailed}\`,\n` +
          content.slice(insertBeforeIndex);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      updated++;
      console.log(`  ✓ Updated ${subdir}/${charId}.ts`);
    } else {
      skipped++;
    }
  }
}

console.log(`\nDone! Updated: ${updated}, Already up-to-date: ${skipped}`);
