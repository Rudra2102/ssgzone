import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';

const API = 'https://api.ssgzone.in/api/v1/webmail';

export default function WebmailDashboard() {
  const [folder, setFolder] = useState('inbox');
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
  const [videoRooms, setVideoRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModal, setTemplateModal] = useState(null);
  const [tplForm, setTplForm] = useState({ name: '', subject: '', html_body: '', category: 'general' });
  const [tplPreview, setTplPreview] = useState(false);
  const [tplSaving, setTplSaving] = useState(false);
  const [ooo, setOoo] = useState(null);
  const [oooLoading, setOooLoading] = useState(false);
  const [oooForm, setOooForm] = useState({ subject: 'Out of Office', message: '', start_date: '', end_date: '', is_active: true });
  const [oooSaving, setOooSaving] = useState(false);
  const [oooEditing, setOooEditing] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('webmail_token');
  const auth = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchFolderCounts();
    fetch(`${API}/profile`, { headers: auth }).then(r => r.json()).then(d => d.success && setProfile(d.data));
    fetchVideoRooms();
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

  const fetchVideoRooms = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/video/rooms', { headers: auth });
      const data = await res.json();
      if (data.success) setVideoRooms(data.data);
    } catch {}
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics`, { headers: auth });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch {}
    setAnalyticsLoading(false);
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch(`${API}/templates`, { headers: auth });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {}
    setTemplatesLoading(false);
  };

  const saveTemplate = async () => {
    if (!tplForm.name || !tplForm.subject || !tplForm.html_body) return alert('Name, subject and body required');
    setTplSaving(true);
    try {
      const isEdit = templateModal && templateModal.id;
      const url = isEdit ? `${API}/templates/${templateModal.id}` : `${API}/templates`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(tplForm)
      });
      const data = await res.json();
      if (data.success) {
        setTemplateModal(null);
        setTplForm({ name: '', subject: '', html_body: '', category: 'general' });
        fetchTemplates();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setTplSaving(false);
  };

  const fetchOoo = async () => {
    setOooLoading(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder', { headers: auth });
      const data = await res.json();
      if (data.success) {
        setOoo(data.data);
        if (data.data) setOooForm({
          subject: data.data.subject,
          message: data.data.message,
          start_date: data.data.start_date ? data.data.start_date.slice(0,16) : '',
          end_date: data.data.end_date ? data.data.end_date.slice(0,16) : '',
          is_active: data.data.is_active
        });
      }
    } catch {}
    setOooLoading(false);
  };

  const saveOoo = async () => {
    if (!oooForm.message) return alert('Message required');
    setOooSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(oooForm)
      });
      const data = await res.json();
      if (data.success) { setOoo(data.data); setOooEditing(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setOooSaving(false);
  };

  const toggleOoo = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder/toggle', { method: 'PATCH', headers: auth });
      const data = await res.json();
      if (data.success) setOoo(data.data);
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const deleteOoo = async () => {
    if (!window.confirm('Remove autoresponder?')) return;
    await fetch('https://api.ssgzone.in/api/v1/autoresponder', { method: 'DELETE', headers: auth });
    setOoo(null);
    setOooForm({ subject: 'Out of Office', message: '', start_date: '', end_date: '', is_active: true });
    setOooEditing(false);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await fetch(`${API}/templates/${id}`, { method: 'DELETE', headers: auth });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const useTemplate = (tpl) => {
    setCompose({ to: '', cc: '', subject: tpl.subject, body_html: tpl.html_body });
    setComposeOpen(true);
  };

  const createRoom = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/video/rooms', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle || 'Quick Meeting' })
      });
      const data = await res.json();
      if (data.success) {
        setVideoRooms(prev => [data.data, ...prev]);
        setActiveRoom(data.data);
        setShowNewMeeting(false);
        setMeetingTitle('');
      }
    } catch (err) { alert(err.message); }
  };

  const endRoom = async (roomId) => {
    await fetch(`https://api.ssgzone.in/api/v1/video/rooms/${roomId}`, { method: 'DELETE', headers: auth });
    setVideoRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoom?.id === roomId) setActiveRoom(null);
  };

  const fetchFolderCounts = async () => {
    try {
      const res = await fetch(`${API}/folders/counts`, { headers: auth });
      const data = await res.json();
      if (data.success) setFolderCounts(data.data);
    } catch {}
  };

  const openEmail = async (email) => {
    if (!email.read_status) {
      await fetch(`${API}/email/${email.id}/read`, {
        method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read_status: true } : e));
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
    if (data.success) setEmails(prev => prev.map(em => em.id === emailId ? { ...em, starred: data.is_starred } : em));
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
        body: JSON.stringify({ to: compose.to, cc: compose.cc, subject: compose.subject, html_content: compose.body_html, text_content: compose.body_html })
      });
      const data = await res.json();
      if (data.success) {
        setComposeOpen(false);
        setCompose({ to: '', cc: '', subject: '', body_html: '' });
        alert('✅ Email sent!');
        if (folder === 'sent') fetchEmails();
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
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'drafts', label: 'Drafts', icon: '📝' },
    { id: 'starred', label: 'Starred', icon: '⭐' },
    { id: 'spam', label: 'Spam', icon: '⚠️' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
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
          <div onClick={() => { setActiveNav('video'); fetchVideoRooms(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'video' ? c.primaryLight : 'transparent', color: activeNav === 'video' ? c.primary : c.text, fontWeight: activeNav === 'video' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📹</span>
            {!sidebarCollapsed && <span>Video Calls</span>}
          </div>
          <div onClick={() => { setActiveNav('analytics'); fetchAnalytics(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'analytics' ? c.primaryLight : 'transparent', color: activeNav === 'analytics' ? c.primary : c.text, fontWeight: activeNav === 'analytics' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📊</span>
            {!sidebarCollapsed && <span>Analytics</span>}
          </div>
          <div onClick={() => { setActiveNav('templates'); fetchTemplates(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'templates' ? c.primaryLight : 'transparent', color: activeNav === 'templates' ? c.primary : c.text, fontWeight: activeNav === 'templates' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>

            <span style={{ fontSize: 14 }}>📋</span>
            {!sidebarCollapsed && <span>Templates</span>}

          </div>

          <div onClick={() => { setActiveNav('ooo'); fetchOoo(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'ooo' ? c.primaryLight : 'transparent', color: activeNav === 'ooo' ? c.primary : c.text, fontWeight: activeNav === 'ooo' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>🏖</span>
            {!sidebarCollapsed && <span>Out of Office</span>}
          </div>
            <span style={{ fontSize: 14 }}>📋</span>
            {!sidebarCollapsed && <span>Templates</span>}
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
        {activeNav === 'analytics' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Analytics</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Your email activity overview</div>
            {analyticsLoading && <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading analytics...</div>}
            {analytics && (() => {
              const maxVol = Math.max(...analytics.volume7d.map(d => d.count), 1);
              const maxDow = Math.max(...analytics.dowActivity.map(d => d.count), 1);
              const s = analytics.stats;
              const total = parseInt(s.total) || 0;
              const unreadPct = total > 0 ? Math.round((parseInt(s.unread) / total) * 100) : 0;
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Emails', value: total, icon: '✉️', color: '#6366f1' },
                      { label: 'Unread', value: s.unread || 0, icon: '📬', color: '#ef4444' },
                      { label: 'Unread %', value: unreadPct + '%', icon: '📊', color: '#f59e0b' },
                      { label: 'Sent Today', value: s.sent_today || 0, icon: '📤', color: '#10b981' },
                      { label: 'Starred', value: s.starred || 0, icon: '⭐', color: '#f59e0b' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Emails Received — Last 7 Days</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {analytics.volume7d.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.count || ''}</div>
                            <div style={{ width: '100%', background: '#6366f1', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxVol) * 90, d.count > 0 ? 4 : 0)}px` }} />
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Activity by Day of Week (30 days)</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {analytics.dowActivity.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.count || ''}</div>
                            <div style={{ width: '100%', background: '#8b5cf6', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxDow) * 90, d.count > 0 ? 4 : 0)}px` }} />
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>Folder Breakdown</div>
                      {analytics.folders.length === 0 && <div style={{ color: c.textMuted, fontSize: 13 }}>No data yet</div>}
                      {analytics.folders.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
                          <div style={{ fontSize: 13, color: c.text, textTransform: 'capitalize' }}>{f.folder}</div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ fontSize: 12, color: c.textMuted }}>{f.total} total</span>
                            {parseInt(f.unread) > 0 && <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{f.unread} unread</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>Top Senders</div>
                      {analytics.topSenders.length === 0 && <div style={{ color: c.textMuted, fontSize: 13 }}>No data yet</div>}
                      {analytics.topSenders.map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{s.from_name || s.from_email}</div>
                            <div style={{ fontSize: 11, color: c.textMuted }}>{s.from_email}</div>
                          </div>
                          <span style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeNav === 'ooo' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Out of Office</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>Automatically reply to incoming emails when you're away</div>

            {oooLoading && <div style={{ color: c.textMuted, fontSize: 13 }}>Loading...</div>}

            {!oooLoading && !ooo && !oooEditing && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No autoresponder set</div>
                <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Set up an out-of-office reply for when you're away</div>
                <button onClick={() => setOooEditing(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Set Up Autoresponder
                </button>
              </div>
            )}

            {!oooLoading && ooo && !oooEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{ooo.subject}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div onClick={toggleOoo}
                        style={{ width: 44, height: 24, borderRadius: 12, background: ooo.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: ooo.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 13, color: ooo.is_active ? '#10b981' : c.textMuted, fontWeight: 600 }}>
                        {ooo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setOooEditing(true)}
                      style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                    <button onClick={deleteOoo}
                      style={{ padding: '7px 14px', border: `1px solid ${c.danger}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>Remove</button>
                  </div>
                </div>
                {(ooo.start_date || ooo.end_date) && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12 }}>
                    📅 {ooo.start_date ? new Date(ooo.start_date).toLocaleString() : 'Now'} → {ooo.end_date ? new Date(ooo.end_date).toLocaleString() : 'Indefinitely'}
                  </div>
                )}
                <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: 14, fontSize: 13, color: c.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {ooo.message}
                </div>
              </div>
            )}

            {oooEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{ooo ? 'Edit Autoresponder' : 'New Autoresponder'}</div>

                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Subject</label>
                <input value={oooForm.subject} onChange={e => setOooForm(p => ({ ...p, subject: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Message *</label>
                <textarea value={oooForm.message} onChange={e => setOooForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Hi, I'm currently out of office and will return on [date]. For urgent matters, please contact [name]."
                  rows={5}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Start Date (optional)</label>
                    <input type="datetime-local" value={oooForm.start_date} onChange={e => setOooForm(p => ({ ...p, start_date: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>End Date (optional)</label>
                    <input type="datetime-local" value={oooForm.end_date} onChange={e => setOooForm(p => ({ ...p, end_date: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div onClick={() => setOooForm(p => ({ ...p, is_active: !p.is_active }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: oooForm.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: oooForm.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: c.text }}>Activate immediately</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveOoo} disabled={oooSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: oooSaving ? 'not-allowed' : 'pointer', opacity: oooSaving ? 0.7 : 1 }}>
                    {oooSaving ? 'Saving...' : '💾 Save'}
                  </button>
                  <button onClick={() => setOooEditing(false)}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeNav === 'templates' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Email Templates</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Reusable email templates for quick compose</div>
              </div>
              <button onClick={() => { setTemplateModal('new'); setTplForm({ name: '', subject: '', html_body: '', category: 'general' }); setTplPreview(false); }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + New Template
              </button>
            </div>
            {templatesLoading && <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading...</div>}
            {!templatesLoading && templates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: c.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No templates yet</div>
                <div style={{ fontSize: 13 }}>Create reusable email templates to speed up your workflow</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{tpl.name}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{tpl.category}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' }}>Subject: {tpl.subject}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tpl.html_body.replace(/<[^>]*>/g, '').slice(0, 80)}...
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => useTemplate(tpl)}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ Use
                    </button>
                    <button onClick={() => { setTemplateModal(tpl); setTplForm({ name: tpl.name, subject: tpl.subject, html_body: tpl.html_body, category: tpl.category }); setTplPreview(false); }}
                      style={{ padding: '7px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                    <button onClick={() => deleteTemplate(tpl.id)}
                      style={{ padding: '7px 12px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeNav === 'chat' ? (
          <div style={{ flex: 1, overflow: 'hidden', padding: 16, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel userData={userData} tenantId={userData?.tenant_id || 'demo'} />
          </div>
        ) : activeNav === 'video' ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeRoom ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px 16px', background: c.card, borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>📹 {activeRoom.title}</span>
                    <span style={{ fontSize: 11, color: c.textMuted, marginLeft: 12, fontFamily: 'monospace' }}>{activeRoom.room_name}</span>
                  </div>
                  <button onClick={() => endRoom(activeRoom.id)}
                    style={{ background: c.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ✕ End Meeting
                  </button>
                </div>
                <iframe
                  src={`https://meet.jit.si/${activeRoom.room_name}#userInfo.displayName="${encodeURIComponent((profile?.first_name || '') + ' ' + (profile?.last_name || '') || userData.email)}"&config.prejoinPageEnabled=false`}
                  style={{ flex: 1, border: 'none', width: '100%' }}
                  allow="camera; microphone; fullscreen; display-capture"
                  title="Video Meeting"
                />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Video Calls</div>
                    <div style={{ fontSize: 13, color: c.textMuted }}>Start or join a meeting with your team</div>
                  </div>
                  <button onClick={() => setShowNewMeeting(true)}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + New Meeting
                  </button>
                </div>

                {showNewMeeting && (
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 12 }}>Start New Meeting</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)}
                        placeholder="Meeting title (optional)"
                        style={{ flex: 1, padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                      <button onClick={createRoom}
                        style={{ background: c.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Start</button>
                      <button onClick={() => setShowNewMeeting(false)}
                        style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>Cancel</button>
                    </div>
                  </div>
                )}

                {videoRooms.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Meetings</div>
                    {videoRooms.map(room => (
                      <div key={room.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>📹 {room.title}</div>
                          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Started by {room.host_name} · {new Date(room.started_at).toLocaleTimeString()}</div>
                          <div style={{ fontSize: 11, color: c.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{room.room_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setActiveRoom(room)}
                            style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Join</button>
                          {String(room.created_by) === String(userData.id) && (
                            <button onClick={() => endRoom(room.id)}
                              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>End</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {videoRooms.length === 0 && !showNewMeeting && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: c.textMuted }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No active meetings</div>
                    <div style={{ fontSize: 13 }}>Click "New Meeting" to start a video call with your team</div>
                  </div>
                )}
              </div>
            )}
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
                    style={{ padding: '11px 13px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', background: selectedEmail?.id === email.id ? '#eff6ff' : email.read_status ? c.card : '#fafbff', borderLeft: selectedEmail?.id === email.id ? `3px solid ${c.primary}` : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: email.read_status ? 400 : 700, color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>
                        {email.from_name || email.from_email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span onClick={e => toggleStar(e, email.id)} style={{ cursor: 'pointer', fontSize: 13, color: email.starred ? c.warning : c.border }}>★</span>
                        <span style={{ fontSize: 10, color: c.textMuted }}>{new Date(email.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: email.read_status ? 400 : 600, color: email.read_status ? c.textMuted : c.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          To: {selectedEmail.to_email} · {new Date(selectedEmail.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {/* Body */}
                    <div style={{ fontSize: 14, color: c.text, lineHeight: 1.7 }}>
                      {selectedEmail.html_content
                        ? <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }} />
                        : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedEmail.text_content || '(empty)'}</pre>
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

      {/* Template Modal */}
      {templateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.card, borderRadius: 12, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{templateModal === 'new' ? 'New Template' : 'Edit Template'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTplPreview(!tplPreview)}
                  style={{ padding: '5px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: tplPreview ? c.primaryLight : 'none', color: tplPreview ? c.primary : c.text, cursor: 'pointer', fontSize: 12 }}>
                  {tplPreview ? '✏️ Edit' : '👁 Preview'}
                </button>
                <button onClick={() => setTemplateModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
              </div>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {tplPreview ? (
                <div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Subject: <strong>{tplForm.subject}</strong></div>
                  <div style={{ border: `1px solid ${c.border}`, borderRadius: 8, padding: 16, minHeight: 200, fontSize: 14, color: c.text, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: tplForm.html_body || '<em style="color:#9ca3af">Nothing to preview</em>' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Template name *"
                      style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                    <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))}
                      style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                      {['general', 'onboarding', 'support', 'marketing', 'notification'].map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <input value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Email subject *"
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                  <textarea value={tplForm.html_body} onChange={e => setTplForm(p => ({ ...p, html_body: e.target.value }))}
                    placeholder="HTML body * (supports HTML tags)" rows={10}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setTemplateModal(null)} style={{ padding: '8px 18px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>
              <button onClick={saveTemplate} disabled={tplSaving}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, cursor: tplSaving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: tplSaving ? 0.7 : 1 }}>
                {tplSaving ? 'Saving...' : '💾 Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
