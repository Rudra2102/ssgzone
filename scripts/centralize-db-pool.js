/**
 * Task 0.4 — DB Pool Centralization
 * Replaces all `new Pool({...})` declarations with DatabaseService import.
 * Covers: routes/, jobs/, middleware/, services/ (excluding DatabaseService itself)
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../api-gateway/src');

const SCAN_DIRS = ['routes', 'jobs', 'middleware', 'services'];

// Files to skip (they legitimately define their own pool)
const SKIP_FILES = new Set([
  'DatabaseService.js',
  'user-dashboard.js', // vmailDb is a separate DB — handled manually
]);

const PG_REQUIRE_RE = /const \{ Pool \} = require\('pg'\);\n?/g;
const PG_REQUIRE_RE2 = /const Pool = require\('pg'\)\.Pool;\n?/g;
// Matches new Pool({ ... }); spanning multiple lines
const POOL_BLOCK_RE = /const (pool|db) = new Pool\(\{[\s\S]*?\}\);?\n?/g;
// Fallback: new Pool( without { on same line
const POOL_BLOCK_RE2 = /const (pool|db) = new Pool\([\s\S]*?\);\n?/g;

let changed = 0;

for (const dir of SCAN_DIRS) {
  const dirPath = path.join(srcDir, dir);
  if (!fs.existsSync(dirPath)) continue;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    if (SKIP_FILES.has(file)) continue;

    const filePath = path.join(dirPath, file);
    let src = fs.readFileSync(filePath, 'utf8');
    const original = src;

    const varMatch = src.match(/const (pool|db) = new Pool\(/);
    if (!varMatch) continue;
    const varName = varMatch[1];

    src = src.replace(PG_REQUIRE_RE, '');
    src = src.replace(PG_REQUIRE_RE2, '');
    src = src.replace(POOL_BLOCK_RE, '');
    if (src.includes('new Pool(')) {
      src = src.replace(POOL_BLOCK_RE2, '');
    }

    // Determine correct relative path to DatabaseService
    const relPath = dir === 'routes' ? '../services/DatabaseService'
      : dir === 'jobs' ? '../services/DatabaseService'
      : dir === 'middleware' ? '../services/DatabaseService'
      : './DatabaseService'; // services/ dir

    const dbImport = `const ${varName} = require('${relPath}');\n`;

    // Insert before first router/class/function/module.exports line
    const insertPos = src.search(/\nconst router|\nclass |\nfunction |\nmodule\.exports/);
    if (insertPos > 0) {
      src = src.slice(0, insertPos + 1) + dbImport + src.slice(insertPos + 1);
    } else {
      src = dbImport + src;
    }

    if (src !== original) {
      fs.writeFileSync(filePath, src, 'utf8');
      console.log(`✓ ${dir}/${file} — replaced ${varName} with DatabaseService`);
      changed++;
    }
  }
}

console.log(`\nDone. ${changed} files updated.`);
