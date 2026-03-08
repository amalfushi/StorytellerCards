/**
 * M23 Phase 1 — Import reminder token data from roles.json into character files.
 *
 * Usage: node scripts/importReminders.js
 */

const fs = require('fs');
const path = require('path');

const ROLES_PATH = 'D:/StorytellerCards/botc-release/resources/data/roles.json';
const CHARS_DIR = path.resolve(__dirname, '..', 'UI', 'src', 'data', 'characters');

// ── Helpers ──

/** Convert reminder text to a clean alphanumeric fragment for IDs. */
function toIdFragment(text) {
  const fragment = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return fragment || 'unknown';
}

/** Escape single quotes for use in JS strings. */
function escapeQuotes(text) {
  return text.replace(/'/g, "\\'");
}

/** Recursively find all character .ts files (skip tests, barrels, _-prefixed). */
function findCharFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findCharFiles(path.join(dir, entry.name)));
    } else if (
      entry.name.endsWith('.ts') &&
      !entry.name.startsWith('_') &&
      entry.name !== 'index.ts' &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.stories.tsx')
    ) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

/** Generate ReminderToken objects from roles.json reminder labels. */
function generateReminders(charId, reminderTexts) {
  // Count occurrences of each label
  const counts = {};
  for (const text of reminderTexts) {
    counts[text] = (counts[text] || 0) + 1;
  }

  const tokens = [];
  const seen = {};
  for (const text of reminderTexts) {
    const base = toIdFragment(text);
    const isDuplicate = counts[text] > 1;

    if (isDuplicate) {
      seen[text] = (seen[text] || 0) + 1;
      tokens.push({
        id: `${charId}-${base}-${seen[text]}`,
        text,
        sourceCharacterId: charId,
      });
    } else {
      tokens.push({
        id: `${charId}-${base}`,
        text,
        sourceCharacterId: charId,
      });
    }
  }
  return tokens;
}

/** Format a single token as a JS object literal string. */
function formatToken(t) {
  const escapedText = escapeQuotes(t.text);
  return `{ id: '${t.id}', text: '${escapedText}', sourceCharacterId: '${t.sourceCharacterId}' }`;
}

/** Format the full reminders array for insertion into a .ts file. */
function formatRemindersBlock(tokens) {
  if (tokens.length === 0) return '  reminders: [],';
  if (tokens.length === 1) {
    return `  reminders: [${formatToken(tokens[0])}],`;
  }
  const lines = tokens.map((t) => `    ${formatToken(t)},`);
  return `  reminders: [\n${lines.join('\n')}\n  ],`;
}

// Regex to match the entire `reminders: [...]` block (handles single-line and multi-line)
const REMINDERS_BLOCK_RE = /  reminders: \[[\s\S]*?\],/;

// ── Main ──

const roles = JSON.parse(fs.readFileSync(ROLES_PATH, 'utf-8'));

// Build map: charId → reminder labels
const reminderMap = new Map();
for (const role of roles) {
  if (role.reminders && role.reminders.length > 0) {
    reminderMap.set(role.id, role.reminders);
  }
}

const charFiles = findCharFiles(CHARS_DIR);
let updatedFromRoles = 0;
let updatedExisting = 0;

for (const filePath of charFiles) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const charId = path.basename(filePath, '.ts');

  if (reminderMap.has(charId)) {
    // Stage 1: Character is in roles.json with reminders — regenerate entire block
    const tokens = generateReminders(charId, reminderMap.get(charId));
    const formatted = formatRemindersBlock(tokens);
    const newContent = content.replace(REMINDERS_BLOCK_RE, formatted);

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      updatedFromRoles++;
      console.log(`[roles.json] ${charId} → ${tokens.length} reminder(s)`);
    }
  } else {
    // Stage 2: Not in roles.json — add sourceCharacterId to any existing non-empty reminders
    const hasExistingReminders =
      content.includes('reminders: [') && !content.match(/reminders: \[\],/);

    if (hasExistingReminders) {
      // Add sourceCharacterId to existing tokens that don't have it
      const newContent = content.replace(
        REMINDERS_BLOCK_RE,
        (match) => {
          // Only modify if there's no sourceCharacterId already
          if (match.includes('sourceCharacterId')) return match;
          // Add sourceCharacterId before each closing brace of token objects
          return match.replace(
            /\{ id: '([^']+)', text: '([^']+)'((?:, isGlobal: true)?) \}/g,
            `{ id: '$1', text: '$2'$3, sourceCharacterId: '${charId}' }`,
          );
        },
      );

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        updatedExisting++;
        console.log(`[existing] ${charId} → added sourceCharacterId`);
      }
    }
  }
}

console.log(
  `\nDone! Updated ${updatedFromRoles} from roles.json, ${updatedExisting} existing.`,
);
console.log(`Total characters in roles.json with reminders: ${reminderMap.size}`);
