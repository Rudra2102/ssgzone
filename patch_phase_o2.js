const fs = require('fs');
const f = 'd:/Pradeep_Singh/Creations/Softwares/SSGzone/unified-login/src/WebmailDashboard.js';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Add toast UI before Template Modal
const tmIdx = c.indexOf('      {/* Template Modal */}');
if (tmIdx === -1) { console.log('ERROR: Template Modal not found'); process.exit(1); }

const toastBlock = `      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1f2937', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast}
          <span onClick={() => setToast(null)} style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.7, fontSize: 16 }}>×</span>
        </div>
      )}

`;
c = c.substring(0, tmIdx) + toastBlock + c.substring(tmIdx);

// Fix 2: Add tab title useEffect after fetchSignature useEffect
const sigEffectEnd = `    fetchSignature();
  }, []);`;
const sigIdx = c.indexOf(sigEffectEnd);
if (sigIdx === -1) { console.log('ERROR: fetchSignature effect not found'); process.exit(1); }
const insertAfter = sigIdx + sigEffectEnd.length;
const titleEffect = `

  useEffect(() => {
    document.title = unread > 0 ? \`(\${unread}) SSGzone Mail\` : 'SSGzone Mail';
  }, [unread]);`;
c = c.substring(0, insertAfter) + titleEffect + c.substring(insertAfter);

fs.writeFileSync(f, c, 'utf8');
console.log('Done.');
console.log('toast UI:', c.includes('Toast notification'));
console.log('tab title:', c.includes('document.title'));
