const fs = require('fs');
const f = 'd:/Pradeep_Singh/Creations/Softwares/SSGzone/unified-login/src/WebmailDashboard.js';
let c = fs.readFileSync(f, 'utf8');

const idx = c.indexOf("{ key: 'to', placeholder: 'To' }");
if (idx === -1) { console.log('marker not found'); process.exit(1); }

// Find the start of the {[ array
const start = c.lastIndexOf('{[', idx);
// Find the end: closing ))} after the map
const end = c.indexOf('))}', idx) + 3;

const oldBlock = c.substring(start, end);
console.log('Old block length:', oldBlock.length);

const newBlock = `<div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={compose.to}
                  onChange={e => { setCompose(p => ({ ...p, to: e.target.value })); fetchToSuggestions(e.target.value); }}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 150)}
                  placeholder="To"
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {showToSuggestions && toSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: \`1px solid \${c.border}\`, borderRadius: 7, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {toSuggestions.map((s, i) => (
                      <div key={i} onMouseDown={() => { setCompose(p => ({ ...p, to: s.email })); setShowToSuggestions(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: \`1px solid \${c.border}\` }}>
                        <span style={{ fontWeight: 600, color: c.text }}>{s.name}</span>
                        <span style={{ color: c.textMuted, marginLeft: 8 }}>{s.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {[
                { key: 'cc', placeholder: 'CC (optional)' },
                { key: 'subject', placeholder: 'Subject' },
              ].map(f => (
                <input key={f.key} value={compose[f.key]} onChange={e => setCompose(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
              ))}`;

c = c.substring(0, start) + newBlock + c.substring(end);
fs.writeFileSync(f, c, 'utf8');
console.log('Done. showToSuggestions:', c.includes('showToSuggestions'));
