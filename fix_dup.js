const fs = require('fs');
const file = 'unified-login/src/SuperAdminDashboard.js';
const content = fs.readFileSync(file, 'utf8');

// Find the two direct-clients lines
const idx1 = content.indexOf("{ id: 'direct-clients'");
const idx2 = content.indexOf("{ id: 'direct-clients'", idx1 + 1);

if (idx1 === -1 || idx2 === -1) {
  console.log('Could not find duplicate. idx1:', idx1, 'idx2:', idx2);
  process.exit(1);
}

// Find the end of the second line (up to and including the newline)
const lineEnd = content.indexOf('\n', idx2);
const removeFrom = content.lastIndexOf('\n', idx2 - 1) + 1; // start of second line
const removeTo = lineEnd + 1; // include the newline

console.log('Removing chars', removeFrom, 'to', removeTo);
console.log('Removed text:', JSON.stringify(content.slice(removeFrom, removeTo)));

const fixed = content.slice(0, removeFrom) + content.slice(removeTo);
fs.writeFileSync(file, fixed, 'utf8');
console.log('Done. Size:', content.length, '->', fixed.length);
