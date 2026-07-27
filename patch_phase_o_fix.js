const fs = require('fs');
const f = 'd:/Pradeep_Singh/Creations/Softwares/SSGzone/unified-login/src/WebmailDashboard.js';
let c = fs.readFileSync(f, 'utf8');

// The inner buttons div is missing its closing </div>
// Find the Send button block and add the missing </div>
const marker = `              </button>\n\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}`;
const fixed = `              </button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}`;

if (c.includes(marker)) {
  c = c.replace(marker, fixed);
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed.');
} else {
  // Try finding by index
  const idx = c.indexOf('      {/* Toast notification */}');
  console.log('Toast at:', idx);
  const snippet = c.substring(idx - 150, idx);
  console.log('Before toast:', JSON.stringify(snippet));
}
