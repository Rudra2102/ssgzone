import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://api.ssgzone.in';

const ROLE_COLORS = { super_admin: '#7c3aed', admin: '#2563eb', support: '#16a34a', sales: '#ea580c' };
const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', support: 'Support Agent', sales: 'Sales' };
const PRIORITY_COLORS = { high: '#dc2626', medium: '#ea580c', low: '#16a34a' };
const STATUS_COLORS = { open: '#2563eb', in_progress: '#ea580c', resolved: '#16a34a' };

const S = {
  layout: { display: 'flex', minHeight: '100vh', fontFamily: '"Inter","Roboto",sans-serif', background: '#f1f5f9' },
  sidebar: { width: 220, background: 'linear-gradient(180deg,#1e293b 0%,#0f172a 100%)', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarLogo: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  sidebarLogoText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', borderRadius: 8, margin: '2px 8px', background: active ? 'rgba(99,102,241,0.25)' : 'transparent', color: active ? '#a5b4fc' : '#94a3b8', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }),
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  content: { flex: 1, padding: 24, overflowY: 'auto' },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 },
  badge: (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + '20', color }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  btn: (color='#4f46e5') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
  btnSm: (color='#4f46e5') => ({ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw' },
  viewBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e', marginLeft: 8 },
};

export default function EmployeeDashboard() {
  const token = localStorage.getItem('super_admin_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const role = userData.role || 'support';
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [saasApps, setSaasApps] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', tenant_id: '', priority: 'medium' });
  const [darkMode, setDarkMode] = useState(false);

  const canSeeTickets = ['support', 'sales', 'admin'].includes(role);
  const canSeeSaas = ['sales', 'admin'].includes(role);
  const canSeeMailboxes = role === 'admin';

  const load = useCallback(async (section) => {
    try {
      if (section === 'dashboard') {
        const r = await fetch(`${API}/api/v1/super-admin/dashboard/stats`, { headers: authHeaders });
        const d = await r.json();
        if (d.success) setStats(d.data);
        const rt = await fetch(`${API}/api/v1/super-admin/tenants`, { headers: authHeaders });
        const dt = await rt.json();
        if (dt.success) setTenants(dt.data);
      } else if (section === 'tenants') {
        const r = await fetch(`${API}/api/v1/super-admin/tenants`, { headers: authHeaders });
        const d = await r.json();
        if (d.success) setTenants(d.data);
      } else if (section === 'users') {
        const r = await fetch(`${API}/api/v1/super-admin/users?limit=100`, { headers: authHeaders });
        const d = await r.json();
        if (d.success) setUsers(d.data);
      } else if (section === 'saas') {
        const r = await fetch(`${API}/api/v1/super-admin/saas-apps`, { headers: authHeaders });
        const d = await r.json();
        if (d.success) setSaasApps(d.data);
      } else if (section === 'tickets') {
        const r = await fetch(`${API}/api/v1/super-admin/support-tickets`, { headers: authHeaders });
        const d = await r.json();
        if (d.success) setTickets(d.data);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { if (!token) { window.location.href = '/'; return; } load(activeSection); }, [activeSection, load, token]);

  const createTicket = async () => {
    if (!ticketForm.subject) return;
    try {
      const r = await fetch(`${API}/api/v1/super-admin/support-tickets`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(ticketForm)
      });
      const d = await r.json();
      if (d.success) { setTickets(t => [d.data, ...t]); setOpenTicketDialog(false); setTicketForm({ subject: '', description: '', tenant_id: '', priority: 'medium' }); }
    } catch (e) { console.error(e); }
  };

  const cycleStatus = async (ticket) => {
    const next = { open: 'in_progress', in_progress: 'resolved', resolved: 'open' };
    try {
      const r = await fetch(`${API}/api/v1/super-admin/support-tickets/${ticket.id}/status`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status: next[ticket.status] })
      });
      const d = await r.json();
      if (d.success) setTickets(ts => ts.map(t => t.id === ticket.id ? d.data : t));
    } catch (e) { console.error(e); }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'tenants', label: 'Tenants', icon: '🏢' },
    { key: 'users', label: 'Users', icon: '👥' },
    ...(canSeeTickets ? [{ key: 'tickets', label: 'Support Tickets', icon: '🎫' }] : []),
    ...(canSeeSaas ? [{ key: 'saas', label: 'SaaS Applications', icon: '▦' }] : []),
    ...(canSeeMailboxes ? [{ key: 'mailboxes', label: 'Mailboxes', icon: '📬' }] : []),
  ];

  const bg = darkMode ? { background: '#0f172a', color: '#f1f5f9' } : {};
  const cardBg = darkMode ? { background: '#1e293b', color: '#f1f5f9' } : {};

  const filteredTickets = tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter);

  return (
    <div style={{ ...S.layout, ...bg }}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.sidebarLogoText}>SSGzone</div>
          <div style={S.sidebarLogoSub}>Employee Portal</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <div key={item.key} style={S.navItem(activeSection === item.key)} onClick={() => setActiveSection(item.key)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Header */}
        <div style={{ ...S.header, ...(darkMode ? { background: '#1e293b', borderColor: '#334155' } : {}) }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            {navItems.find(n => n.key === activeSection)?.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={S.badge(ROLE_COLORS[role] || '#64748b')}>{ROLE_LABELS[role] || role}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{userData.full_name || userData.username}</span>
            <button onClick={() => setDarkMode(d => !d)} style={{ ...S.btnSm('#64748b'), padding: '5px 10px' }}>{darkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => { localStorage.removeItem('super_admin_token'); localStorage.removeItem('user_data'); window.location.href = '/'; }} style={S.btnSm('#dc2626')}>Logout</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ ...S.content, ...(darkMode ? { background: '#0f172a' } : {}) }}>

          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div>
              <div style={S.statsGrid}>
                {[
                  { label: 'Total Tenants', value: stats.totalTenants ?? '—', icon: '🏢' },
                  { label: 'Total Users', value: stats.totalUsers ?? '—', icon: '👥' },
                  { label: 'SaaS Apps', value: stats.totalSaasApps ?? '—', icon: '▦' },
                  { label: 'Emails Today', value: stats.emailsToday ?? '—', icon: '📧' },
                ].map(s => (
                  <div key={s.label} style={{ ...S.statCard, ...cardBg }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1e293b' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...S.card, ...cardBg }}>
                <div style={{ fontWeight: 600, marginBottom: 16, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Recent Tenants</div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Company</th><th style={S.th}>Domain</th><th style={S.th}>Plan</th><th style={S.th}>Status</th><th style={S.th}>Created</th>
                  </tr></thead>
                  <tbody>{tenants.slice(0, 10).map(t => (
                    <tr key={t.id}>
                      <td style={S.td}>{t.company_name}</td>
                      <td style={{ ...S.td, color: '#64748b', fontSize: 12 }}>{t.domain}</td>
                      <td style={S.td}>{t.plan_type || '—'}</td>
                      <td style={S.td}><span style={S.badge(t.status === 'active' ? '#16a34a' : '#dc2626')}>{t.status}</span></td>
                      <td style={{ ...S.td, color: '#64748b', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tenants */}
          {activeSection === 'tenants' && (
            <div style={{ ...S.card, ...cardBg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Tenants <span style={S.viewBadge}>View Only</span></div>
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 220 }} />
              </div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Company</th><th style={S.th}>SaaS App</th><th style={S.th}>Domain</th><th style={S.th}>Users</th><th style={S.th}>Status</th>
                </tr></thead>
                <tbody>{tenants.filter(t => !search || t.company_name?.toLowerCase().includes(search.toLowerCase())).map(t => (
                  <tr key={t.id}>
                    <td style={S.td}>{t.company_name}</td>
                    <td style={S.td}>{t.saas_app_name || '—'}</td>
                    <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{t.domain}</td>
                    <td style={S.td}>{t.user_count ?? 0}</td>
                    <td style={S.td}><span style={S.badge(t.status === 'active' ? '#16a34a' : '#dc2626')}>{t.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Users */}
          {activeSection === 'users' && (
            <div style={{ ...S.card, ...cardBg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Users <span style={S.viewBadge}>View Only</span></div>
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 220 }} />
              </div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Tenant</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Last Login</th>
                </tr></thead>
                <tbody>{users.filter(u => !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())).map(u => (
                  <tr key={u.id}>
                    <td style={S.td}>{u.first_name} {u.last_name}</td>
                    <td style={{ ...S.td, fontSize: 12 }}>{u.email}</td>
                    <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{u.tenant_name || '—'}</td>
                    <td style={S.td}>{u.role}</td>
                    <td style={S.td}><span style={S.badge(u.status === 'active' ? '#16a34a' : '#dc2626')}>{u.status}</span></td>
                    <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Support Tickets */}
          {activeSection === 'tickets' && canSeeTickets && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['all','open','in_progress','resolved'].map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)} style={{ ...S.btnSm(ticketFilter === f ? '#4f46e5' : '#e2e8f0'), color: ticketFilter === f ? '#fff' : '#64748b' }}>
                      {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={() => setOpenTicketDialog(true)} style={S.btn()}>+ New Ticket</button>
              </div>
              <div style={{ ...S.card, ...cardBg }}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>#</th><th style={S.th}>Subject</th><th style={S.th}>Tenant</th><th style={S.th}>Priority</th><th style={S.th}>Status</th><th style={S.th}>Created</th><th style={S.th}>Action</th>
                  </tr></thead>
                  <tbody>{filteredTickets.map(t => (
                    <tr key={t.id}>
                      <td style={{ ...S.td, color: '#64748b' }}>#{t.id}</td>
                      <td style={S.td}>{t.subject}</td>
                      <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{t.tenant_name || '—'}</td>
                      <td style={S.td}><span style={S.badge(PRIORITY_COLORS[t.priority] || '#64748b')}>{t.priority}</span></td>
                      <td style={S.td}><span style={S.badge(STATUS_COLORS[t.status] || '#64748b')}>{t.status}</span></td>
                      <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={S.td}><button onClick={() => cycleStatus(t)} style={S.btnSm('#64748b')}>Update Status</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* SaaS Apps */}
          {activeSection === 'saas' && canSeeSaas && (
            <div style={{ ...S.card, ...cardBg }}>
              <div style={{ fontWeight: 600, marginBottom: 16, color: darkMode ? '#f1f5f9' : '#1e293b' }}>SaaS Applications <span style={S.viewBadge}>View Only</span></div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Name</th><th style={S.th}>Slug</th><th style={S.th}>Tenants</th><th style={S.th}>Status</th><th style={S.th}>Created</th>
                </tr></thead>
                <tbody>{saasApps.map(a => (
                  <tr key={a.id}>
                    <td style={S.td}>{a.name}</td>
                    <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{a.slug}</td>
                    <td style={S.td}>{a.tenant_count ?? 0}</td>
                    <td style={S.td}><span style={S.badge(a.status === 'active' ? '#16a34a' : '#dc2626')}>{a.status}</span></td>
                    <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Mailboxes */}
          {activeSection === 'mailboxes' && canSeeMailboxes && (
            <div style={{ ...S.card, ...cardBg }}>
              <div style={{ fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Mailboxes <span style={S.viewBadge}>View Only</span></div>
              <div style={{ color: '#64748b', marginTop: 16, fontSize: 13 }}>Mailbox management coming soon.</div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      {openTicketDialog && (
        <div style={S.overlay} onClick={() => setOpenTicketDialog(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>New Support Ticket</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Subject *" value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} style={S.input} />
              <textarea placeholder="Description" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} rows={4} style={{ ...S.input, resize: 'vertical' }} />
              <select value={ticketForm.tenant_id} onChange={e => setTicketForm(f => ({ ...f, tenant_id: e.target.value }))} style={S.select}>
                <option value="">— Select Tenant (optional) —</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
              </select>
              <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} style={S.select}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpenTicketDialog(false)} style={S.btnSm('#e2e8f0')}><span style={{ color: '#64748b' }}>Cancel</span></button>
              <button onClick={createTicket} style={S.btn()}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
