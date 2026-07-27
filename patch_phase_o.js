const fs = require('fs');
const f = 'd:/Pradeep_Singh/Creations/Softwares/SSGzone/unified-login/src/WebmailDashboard.js';
let c = fs.readFileSync(f, 'utf8');

// 1. Add draft + toast state after showToSuggestions
c = c.replace(
  `  const [showToSuggestions, setShowToSuggestions] = useState(false);`,
  `  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastUnread, setLastUnread] = useState(null);
  const [toast, setToast] = useState(null);`
);

// 2. Add useEffect for tab title after existing mount useEffect
c = c.replace(
  `    fetchVideoRooms();
    fetchSignature();
  }, []);`,
  `    fetchVideoRooms();
    fetchSignature();
  }, []);

  useEffect(() => {
    document.title = unread > 0 ? \`(\${unread}) SSGzone Mail\` : 'SSGzone Mail';
  }, [unread]);`
);

// 3. Add polling + auto-save effects after the folder/page/search useEffect
c = c.replace(
  `  useEffect(() => {
    if (activeNav === 'inbox') fetchEmails();
  }, [folder, page, search]);`,
  `  useEffect(() => {
    if (activeNav === 'inbox') fetchEmails();
  }, [folder, page, search]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`\${API}/folders/counts\`, { headers: auth });
        const data = await res.json();
        if (!data.success) return;
        const currentUnread = data.data?.inbox?.unread || 0;
        if (lastUnread !== null && currentUnread > lastUnread) {
          const diff = currentUnread - lastUnread;
          showToastNotification(\`📬 \${diff} new email\${diff > 1 ? 's' : ''} arrived\`);
          if (activeNav === 'inbox' && folder === 'inbox') fetchEmails();
          fetchFolderCounts();
        }
        setLastUnread(currentUnread);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [lastUnread, activeNav, folder, token]);

  useEffect(() => {
    if (!composeOpen) return;
    const timer = setTimeout(() => {
      if (compose.subject || compose.body_html || compose.to) {
        saveDraft(compose, draftId);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [compose, composeOpen]);`
);

// 4. Add saveDraft, discardDraft, showToastNotification before fetchContacts
c = c.replace(
  `  const fetchContacts = async (search = '') => {`,
  `  const saveDraft = async (composeData, existingDraftId) => {
    setDraftSaving(true);
    try {
      if (existingDraftId) {
        await fetch(\`\${API}/drafts/\${existingDraftId}\`, {
          method: 'PUT',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: composeData.subject, to: composeData.to, cc: composeData.cc, html_content: composeData.body_html, text_content: composeData.body_html })
        });
      } else {
        const res = await fetch(\`\${API}/drafts\`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: composeData.subject, to: composeData.to, cc: composeData.cc, html_content: composeData.body_html, text_content: composeData.body_html })
        });
        const data = await res.json();
        if (data.success) setDraftId(data.data.id);
      }
    } catch {}
    setDraftSaving(false);
  };

  const discardDraft = async (id) => {
    if (!id) return;
    try {
      await fetch(\`\${API}/drafts/\${id}\`, { method: 'DELETE', headers: auth });
    } catch {}
    setDraftId(null);
  };

  const showToastNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchContacts = async (search = '') => {`
);

// 5. Update openEmail to handle drafts
c = c.replace(
  `  const openEmail = async (email) => {
    if (!email.read_status) {`,
  `  const openEmail = async (email) => {
    if (email.folder === 'drafts') {
      setDraftId(email.id);
      setCompose({ to: email.to_email || '', cc: '', subject: email.subject || '', body_html: email.html_content || email.preview || '' });
      setComposeOpen(true);
      return;
    }
    if (!email.read_status) {`
);

// 6. Update sendEmail — add currentDraftId capture
c = c.replace(
  `  const sendEmail = async () => {
    if (!compose.to || !compose.subject) return alert('To and Subject required');
    setSending(true);
    try {`,
  `  const sendEmail = async () => {
    if (!compose.to || !compose.subject) return alert('To and Subject required');
    setSending(true);
    const currentDraftId = draftId;
    try {`
);

// 7. Update send success block — replace alert with toast, discard draft
c = c.replace(
  `      if (data.success) {
        setComposeOpen(false);
        setCompose({ to: '', cc: '', subject: '', body_html: '' });

        alert('バ. Email sent!');

        if (folder === 'sent') fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);`,
  `      if (data.success) {
        setComposeOpen(false);
        setCompose({ to: '', cc: '', subject: '', body_html: '' });
        if (currentDraftId) discardDraft(currentDraftId);
        setDraftId(null);
        showToastNotification('✅ Email sent!');
        if (folder === 'sent') fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);`
);

// 8. Update compose footer — add draft status + wrap buttons
c = c.replace(
  `            <div style={{ padding: '12px 20px', borderTop: \`1px solid \${c.border}\`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setComposeOpen(false)} style={{ padding: '8px 18px', border: \`1px solid \${c.border}\`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>`,
  `            <div style={{ padding: '12px 20px', borderTop: \`1px solid \${c.border}\`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: c.textMuted }}>{draftSaving ? '💾 Saving draft...' : draftId ? '✓ Draft saved' : ''}</span>
              <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { discardDraft(draftId); setDraftId(null); setComposeOpen(false); }} style={{ padding: '8px 18px', border: \`1px solid \${c.border}\`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>`
);

// 9. Close the inner buttons div after Send button
c = c.replace(
  `              </button>

            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}`,
  `              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1f2937', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast}
          <span onClick={() => setToast(null)} style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.7, fontSize: 16 }}>×</span>
        </div>
      )}

      {/* Template Modal */}`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done.');
console.log('draftId state:', c.includes('const [draftId'));
console.log('saveDraft fn:', c.includes('const saveDraft'));
console.log('toast UI:', c.includes('Toast notification'));
console.log('tab title:', c.includes('document.title'));
console.log('polling:', c.includes('setInterval'));
console.log('draft openEmail:', c.includes("email.folder === 'drafts'"));
