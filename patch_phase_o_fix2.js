const fs = require('fs');
const f = 'd:/Pradeep_Singh/Creations/Softwares/SSGzone/unified-login/src/WebmailDashboard.js';
let c = fs.readFileSync(f, 'utf8');

// Find "Send'}\n              </button>\n            </div>" and insert </div> before </button>\n            </div>
const sendEnd = `              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}`;
const sendFixed = `              </button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}`;

// Use indexOf with the actual newline chars
const idx = c.indexOf('              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}');
console.log('Pattern found at:', idx);

if (idx !== -1) {
  c = c.substring(0, idx) + '              </button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Toast notification */}' + c.substring(idx + sendEnd.length);
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed.');
} else {
  console.log('Pattern not found, trying alternate...');
  // Find the toast marker and look back
  const toastIdx = c.indexOf('      {/* Toast notification */}');
  const before = c.substring(toastIdx - 100, toastIdx);
  console.log('Before toast (raw):', JSON.stringify(before));
}
