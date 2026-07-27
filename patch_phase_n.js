const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, 'unified-login/src/WebmailDashboard.js');
let c = fs.readFileSync(f, 'utf8');

// 1. Add contacts + signature state after applyingRules
c = c.replace(
  `  const [applyingRules, setApplyingRules] = useState(false);`,
  `  const [applyingRules, setApplyingRules] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [signature, setSignature] = useState(null);
  const [sigForm, setSigForm] = useState({ name: 'Default', html_body: '', is_active: true });
  const [sigSaving, setSigSaving] = useState(false);
  const [sigEditing, setSigEditing] = useState(false);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);`
);

// 2. Add fetchSignature to useEffect mount
c = c.replace(
  `    fetchVideoRooms();\n\n  }, []);`,
  `    fetchVideoRooms();
    fetchSignature();
  }, []);`
);

// 3. Add contacts/signature functions before fetchRules
c = c.replace(
  `  const fetchRules = async () => {`,
  `  const fetchContacts = async (search = '') => {
    setContactsLoading(true);
    try {
      const params = search ? \`?search=\${encodeURIComponent(search)}\` : '';
      const res = await fetch(\`https://api.ssgzone.in/api/v1/contacts\${params}\`, { headers: auth });
      const data = await res.json();
      if (data.success) setContacts(data.data);
    } catch {}
    setContactsLoading(false);
  };

  const saveContact = async () => {
    if (!contactForm.name || !contactForm.email) return alert('Name and email required');
    setContactSaving(true);
    try {
      const isEdit = !!editingContact;
      const url = isEdit ? \`https://api.ssgzone.in/api/v1/contacts/\${editingContact.id}\` : 'https://api.ssgzone.in/api/v1/contacts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (data.success) {
        setContactFormOpen(false);
        setEditingContact(null);
        setContactForm({ name: '', email: '', phone: '', company: '', notes: '' });
        fetchContacts(contactSearch);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setContactSaving(false);
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await fetch(\`https://api.ssgzone.in/api/v1/contacts/\${id}\`, { method: 'DELETE', headers: auth });
    setContacts(prev => prev.filter(ct => ct.id !== id));
  };

  const fetchSignature = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/signatures', { headers: auth });
      const data = await res.json();
      if (data.success && data.data) {
        setSignature(data.data);
        setSigForm({ name: data.data.name, html_body: data.data.html_body, is_active: data.data.is_active });
      }
    } catch {}
  };

  const saveSignature = async () => {
    setSigSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/signatures', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(sigForm)
      });
      const data = await res.json();
      if (data.success) { setSignature(data.data); setSigEditing(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setSigSaving(false);
  };

  const toggleSignature = async () => {
    const res = await fetch('https://api.ssgzone.in/api/v1/signatures/toggle', { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setSignature(data.data);
  };

  const fetchToSuggestions = async (q) => {
    if (!q || q.length < 2) { setToSuggestions([]); setShowToSuggestions(false); return; }
    try {
      const res = await fetch(\`https://api.ssgzone.in/api/v1/contacts/suggest?q=\${encodeURIComponent(q)}\`, { headers: auth });
      const data = await res.json();
      if (data.success && data.data.length) { setToSuggestions(data.data); setShowToSuggestions(true); }
      else { setToSuggestions([]); setShowToSuggestions(false); }
    } catch {}
  };

  const fetchRules = async () => {`
);

// 4. Wire signature into compose button
c = c.replace(
  `            <button onClick={() => setComposeOpen(true)}`,
  `            <button onClick={() => {
              const sig = signature?.is_active ? \`\\n\\n--\\n\${signature.html_body.replace(/<[^>]*>/g, '')}\` : '';
              setCompose(p => ({ ...p, body_html: sig }));
              setComposeOpen(true);
            }}`
);

// 5. Add contacts + signature nav items before rules nav
c = c.replace(
  `          <div onClick={() => { setActiveNav('rules'); fetchRules(); }}`,
  `          <div onClick={() => { setActiveNav('contacts'); fetchContacts(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'contacts' ? c.primaryLight : 'transparent', color: activeNav === 'contacts' ? c.primary : c.text, fontWeight: activeNav === 'contacts' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>👤</span>
            {!sidebarCollapsed && <span>Contacts</span>}
          </div>
          <div onClick={() => { setActiveNav('signature'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'signature' ? c.primaryLight : 'transparent', color: activeNav === 'signature' ? c.primary : c.text, fontWeight: activeNav === 'signature' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>✍️</span>
            {!sidebarCollapsed && <span>Signature</span>}
          </div>
          <div onClick={() => { setActiveNav('rules'); fetchRules(); }}`
);

// 6. Replace compose modal To field with autocomplete version
const oldCompose = `              {[

                { key: 'to', placeholder: 'To' },

                { key: 'cc', placeholder: 'CC (optional)' },

                { key: 'subject', placeholder: 'Subject' },
              ].map(f => (

                <input key={f.key} value={compose[f.key]} onChange={e => setCompose(p => ({ ...p, [f.key]: e.target.value }))}


                  placeholder={f.placeholder}


                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />


              ))}`;

const newCompose = `              <div style={{ position: 'relative', marginBottom: 10 }}>
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

if (c.includes(oldCompose)) {
  c = c.replace(oldCompose, newCompose);
  console.log('Compose To field replaced');
} else {
  console.log('WARNING: compose To field exact match failed — skipping');
}

// 7. Add contacts panel + signature panel before rules panel
const contactsPanel = `        ) : activeNav === 'contacts' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Contacts</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Your personal address book</div>
              </div>
              <button onClick={() => { setContactForm({ name: '', email: '', phone: '', company: '', notes: '' }); setEditingContact(null); setContactFormOpen(true); }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + New Contact
              </button>
            </div>

            <input value={contactSearch} onChange={e => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
              placeholder="Search contacts..."
              style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

            {contactFormOpen && (
              <div style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>{editingContact ? 'Edit Contact' : 'New Contact'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name *" style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email *" style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone" style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="Company" style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                </div>
                <textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (optional)" rows={2}
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveContact} disabled={contactSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: contactSaving ? 'not-allowed' : 'pointer', opacity: contactSaving ? 0.7 : 1 }}>
                    {contactSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setContactFormOpen(false); setEditingContact(null); }}
                    style={{ background: 'none', border: \`1px solid \${c.border}\`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {contactsLoading && <div style={{ color: c.textMuted, fontSize: 13, padding: 20 }}>Loading...</div>}

            {!contactsLoading && contacts.length === 0 && !contactFormOpen && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No contacts yet</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Add contacts to enable autocomplete when composing emails</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {contacts.map(contact => (
                <div key={contact.id} style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {contact.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{contact.name}</div>
                        <div style={{ fontSize: 12, color: c.textMuted }}>{contact.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setContactForm({ name: contact.name, email: contact.email, phone: contact.phone || '', company: contact.company || '', notes: contact.notes || '' }); setEditingContact(contact); setContactFormOpen(true); }}
                        style={{ padding: '4px 10px', border: \`1px solid \${c.border}\`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: c.text }}>Edit</button>
                      <button onClick={() => deleteContact(contact.id)}
                        style={{ padding: '4px 10px', border: \`1px solid \${c.danger}\`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: c.danger }}>Del</button>
                    </div>
                  </div>
                  {contact.company && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>{contact.company}</div>}
                  {contact.phone && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>{contact.phone}</div>}
                  <button onClick={() => { setCompose({ to: contact.email, cc: '', subject: '', body_html: signature?.is_active ? \`\\n\\n--\\n\${signature.html_body.replace(/<[^>]*>/g, '')}\` : '' }); setComposeOpen(true); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                    ✉️ Compose
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeNav === 'signature' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Email Signature</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>Automatically appended to new emails</div>

            {!signature && !sigEditing && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No signature set</div>
                <button onClick={() => setSigEditing(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Create Signature
                </button>
              </div>
            )}

            {signature && !sigEditing && (
              <div style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div onClick={toggleSignature}
                      style={{ width: 44, height: 24, borderRadius: 12, background: signature.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: signature.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: signature.is_active ? '#10b981' : c.textMuted }}>{signature.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button onClick={() => setSigEditing(true)}
                    style={{ padding: '7px 14px', border: \`1px solid \${c.border}\`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                </div>
                <div style={{ background: c.bg, border: \`1px solid \${c.border}\`, borderRadius: 8, padding: 14, fontSize: 13, color: c.text, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: signature.html_body || '<em>Empty signature</em>' }} />
              </div>
            )}

            {sigEditing && (
              <div style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{signature ? 'Edit Signature' : 'New Signature'}</div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Name</label>
                <input value={sigForm.name} onChange={e => setSigForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Signature (HTML supported)</label>
                <textarea value={sigForm.html_body} onChange={e => setSigForm(p => ({ ...p, html_body: e.target.value }))}
                  placeholder="<p>Best regards,<br><strong>Your Name</strong><br>Your Title</p>"
                  rows={6}
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div onClick={() => setSigForm(p => ({ ...p, is_active: !p.is_active }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: sigForm.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: sigForm.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: c.text }}>Active</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveSignature} disabled={sigSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: sigSaving ? 'not-allowed' : 'pointer', opacity: sigSaving ? 0.7 : 1 }}>
                    {sigSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setSigEditing(false)}
                    style={{ background: 'none', border: \`1px solid \${c.border}\`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeNav === 'rules' ? (`;

c = c.replace(`        ) : activeNav === 'rules' ? (`, contactsPanel);

fs.writeFileSync(f, c, 'utf8');
console.log('Done.');
console.log('fetchContacts:', c.includes('fetchContacts'));
console.log('fetchSignature:', c.includes('fetchSignature'));
console.log('Contacts panel:', c.includes("activeNav === 'contacts'"));
console.log('Signature panel:', c.includes("activeNav === 'signature'"));
console.log('Autocomplete:', c.includes('fetchToSuggestions'));
