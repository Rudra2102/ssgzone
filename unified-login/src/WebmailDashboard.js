import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';

const API = 'https://api.ssgzone.in/api/v1/webmail';

export default function WebmailDashboard() {
  const [folder, setFolder] = useState('INBOX');
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [folderCounts, setFolderCounts] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('inbox');
  const [compose, setCompose] = useState({ to: '', cc: '', subject: '', body_html: '' });
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState(null);

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('webmail_token');
  const auth = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchFolderCounts();
    fetch(`${API}/profile`, { headers: auth }).then(r => r.json()).then(d => d.success && setProfile(d.data));
  }, []);

  useEffect(() => {
    if (activeNav === 'inbox') fetchEmails();
  }, [folder, page, search]);

  const fetchEmails = async () => {
    setLoading(true);
    setSelectedEmail(null);
    try {
      const params = new URLSearchParams({ folder, page, limit: 25 });
      if (search) params.append('search', search);
      const res = await fetch(`${API}/inbox?${params}`, { headers: auth });
      const data = await res.json();
      if (data.success) { setEmails(data.data); setTotal(data.total); setUnread(data.unread || 0); }
    } catch {}
    setLoading(false);
  };

  const fetchFolderCounts = async () => {
    try {
      const res = await fetch(`${API}/folders/counts`, { headers: auth });
      const data = await res.json();
      if (data.success) setFolderCounts(data.data);
    } catch {}
  };

  const openEmail = async (email) => {
    if (!email.is_read) {
      await fetch(`${API}/email/${email.id}/read`, {
        method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      setUnread(u => Math.max(0, u - 1));
    }
    const res = await fetch(`${API}/email/${email.id}`, { headers: auth });
    const data = await res.json();
    if (data.success) setSelectedEmail(data.data);
  };

  const toggleStar = async (e, emailId) => {
    e.stopPropagation();
    const res = await fetch(`${API}/email/${emailId}/star`, { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setEmails(prev => prev.map(em => em.id === emailId ? { ...em, is_starred: data.is_starred } : em));
  };

  const deleteEmail = async (emailId) => {
    await fetch(`${API}/email/${emailId}`, { method: 'DELETE', headers: auth });
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) setSelectedEmail(null);
    fetchFolderCounts();
  };

  const sendEmail = async () => {
    if (!compose.to || !compose.subject) return alert('To and Subject required');
    setSending(true);
    try {
      const res = await fetch(`${API}/send`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...compose, body_text: compose.body_html })
      });
      const data = await res.json();
      if (data.success) {
        setComposeOpen(false);
        setCompose({ to: '', cc: '', subject: '', body_html: '' });
        alert('✅ Email sent!');
        if (folder === 'Sent') fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setSending(false);
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };
  const initials = (userData.full_name || userData.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const c = {
    primary: '#6366f1', primaryLight: '#eff6ff',
    danger: '#ef4444', warning: '#f59e0b',
    text: '#1f2937', textMuted: '#6b7280', border: '#e5e7eb', bg: '#f8fafc', card: '#ffffff'
  };

  const FOLDERS = [
    { id: 'INBOX', label: 'Inbox', icon: '📥' },
    { id: 'Sent', label: 'Sent', icon: '📤' },
    { id: 'Drafts', label: 'Drafts', icon: '📝' },
    { id: 'Starred', label: 'Starred', icon: '⭐' },
    { id: 'Spam', label: 'Spam', icon: '⚠️' },
    { id: 'Trash', label: 'Trash', icon: '🗑️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 56 : 220, minHeight: '100vh', background: c.card, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s', overflow: 'hidden' }}>
        <div style={{ padding: '16px 12px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>S</div>
          {!sidebarCollapsed && <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>SSGzone Mail</span>}
        </div>

        {!sidebarCollapsed && (
          <div style={{ padding: '12px 12px 4px' }}>
            <button onClick={() => setComposeOpen(true)}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ✏️ Compose
            </button>
          </div>
        )}

        <div style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, padding: '8px 8px 4px', letterSpacing: '0.06em' }}>{!sidebarCollapsed && 'MAIL'}</div>
          {FOLDERS.map(f => {
            const count = folderCounts[f.id];
            const isActive = activeNav === 'inbox' && folder === f.id;
            return (
              <div key={f.id} onClick={() => { setActiveNav('inbox'); setFolder(f.id); setPage(1); setSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 1, background: isActive ? c.primaryLight : 'transparent', color: isActive ? c.primary : c.text, fontWeight: isActive ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{f.label}</span>
                    {count?.unread > 0 && <span style={{ background: c.danger, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{count.unread}</span>}
                  </>
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, padding: '12px 8px 4px', letterSpacing: '0.06em' }}>{!sidebarCollapsed && 'COLLABORATION'}</div>
          <div onClick={() => setActiveNav('chat')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'chat' ? c.primaryLight : 'transparent', color: activeNav === 'chat' ? c.primary : c.text, fontWeight: activeNav === 'chat' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>💬</span>
            {!sidebarCollapsed && <span>Team Chat</span>}
          </div>
        </div>

        <div style={{ padding: 8, borderTop: `1px solid ${c.border}` }}>
          {!sidebarCollapsed && profile && (
            <div style={{ padding: '8px 10px', marginBottom: 4, borderRadius: 6, background: c.bg }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>{profile.email}</div>
            </div>
          )}
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: c.danger, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span>🚪</span>{!sidebarCollapsed && 'Sign Out'}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textMuted }}>☰</button>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search emails..."
              style={{ width: '100%', padding: '7px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.bg }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{userData.full_name || userData.email}</span>
          </div>
        </div>

        {/* Content */}
        {activeNav === 'chat' ? (
          <div style={{ flex: 1, overflow: 'hidden', padding: 16, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel userData={userData} tenantId={userData?.tenant_id || 'demo'} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Email list */}
            <div style={{ width: 320, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', background: c.card, flexShrink: 0 }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{FOLDERS.find(f => f.id === folder)?.label || folder}</div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{total} messages{unread > 0 ? `, ${unread} unread` : ''}</div>
                </div>
                <button onClick={fetchEmails} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: c.textMuted }}>↻</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading && <div style={{ padding: 20, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Loading...</div>}
                {!loading && emails.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                    <div style={{ fontSize: 13 }}>No emails in {folder}</div>
                  </div>
                )}
                {emails.map(email => (
                  <div key={email.id} onClick={() => openEmail(email)}
                    style={{ padding: '11px 13px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', background: selectedEmail?.id === email.id ? '#eff6ff' : email.is_read ? c.card : '#fafbff', borderLeft: selectedEmail?.id === email.id ? `3px solid ${c.primary}` : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: email.is_read ? 400 : 700, color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>
                        {email.from_name || email.from_email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span onClick={e => toggleStar(e, email.id)} style={{ cursor: 'pointer', fontSize: 13, color: email.is_starred ? c.warning : c.border }}>★</span>
                        <span style={{ fontSize: 10, color: c.textMuted }}>{new Date(email.received_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: email.is_read ? 400 : 600, color: email.is_read ? c.textMuted : c.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject || '(no subject)'}
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.preview || ''}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {total > 25 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 12 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '4px 10px', border: `1px solid ${c.border}`, borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>← Prev</button>
                    <span style={{ fontSize: 12, color: c.textMuted, padding: '4px 8px' }}>Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
                      style={{ padding: '4px 10px', border: `1px solid ${c.border}`, borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>Next →</button>
                  </div>
                )}
              </div>
            </div>

            {/* Email view */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.bg }}>
              {!selectedEmail ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textMuted }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                    <div style={{ fontSize: 14 }}>Select an email to read</div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  <div style={{ background: c.card, borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {/* Email header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>{selectedEmail.subject || '(no subject)'}</h2>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, body_html: '', cc: '' }); setComposeOpen(true); }}
                          style={{ padding: '6px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>↩ Reply</button>
                        <button onClick={() => deleteEmail(selectedEmail.id)}
                          style={{ padding: '6px 12px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>🗑 Delete</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '12px 0', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                        {(selectedEmail.from_name || selectedEmail.from_email || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{selectedEmail.from_name || selectedEmail.from_email}</div>
                        <div style={{ fontSize: 12, color: c.textMuted }}>{selectedEmail.from_email}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                          To: {selectedEmail.to_email} · {new Date(selectedEmail.received_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {/* Body */}
                    <div style={{ fontSize: 14, color: c.text, lineHeight: 1.7 }}>
                      {selectedEmail.body_html
                        ? <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                        : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedEmail.body_text || '(empty)'}</pre>
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.card, borderRadius: 12, width: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Compose Email</span>
              <button onClick={() => setComposeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              {[
                { key: 'to', placeholder: 'To' },
                { key: 'cc', placeholder: 'CC (optional)' },
                { key: 'subject', placeholder: 'Subject' },
              ].map(f => (
                <input key={f.key} value={compose[f.key]} onChange={e => setCompose(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
              ))}
              <textarea value={compose.body_html} onChange={e => setCompose(p => ({ ...p, body_html: e.target.value }))}
                placeholder="Message" rows={8}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setComposeOpen(false)} style={{ padding: '8px 18px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>
              <button onClick={sendEmail} disabled={sending}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, cursor: sending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending...' : '➤ Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
