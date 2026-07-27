import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://api.ssgzone.in';

const COLORS = {
  primary: '#4f46e5', primaryDark: '#3730a3',
  sidebar: '#1e293b', sidebarDark: '#0f172a',
  bg: '#f8fafc', card: '#ffffff',
  text: '#1e293b', textMuted: '#64748b',
  border: '#e2e8f0', success: '#10b981', danger: '#ef4444',
  warning: '#f59e0b', info: '#3b82f6',
};

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#7c3aed' },
  admin:       { label: 'Admin',        color: '#4f46e5' },
  support:     { label: 'Support Agent',color: '#10b981' },
  sales:       { label: 'Sales',        color: '#f59e0b' },
};

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const STATUS_COLOR   = { open: '#ef4444', in_progress: '#3b82f6', resolved: '#10b981' };

const styles = {
  wrap:    { display:'flex', minHeight:'100vh', fontFamily:'"Inter","Roboto",sans-serif', background: COLORS.bg },
  sidebar: { width:220, background:`linear-gradient(180deg,${COLORS.sidebar} 0%,${COLORS.sidebarDark} 100%)`, display:'flex', flexDirection:'column', flexShrink:0 },
  logo:    { padding:'24px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)' },
  logoTxt: { fontSize:18, fontWeight:700, color:'#fff' },
  logoSub: { fontSize:11, color:'#94a3b8', marginTop:2 },
  navItem: (a) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', cursor:'pointer', borderRadius:8, margin:'2px 8px', background: a?'rgba(99,102,241,0.25)':'transparent', color: a?'#a5b4fc':'#94a3b8', fontSize:13, fontWeight: a?600:400 }),
  main:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header:  { background:'#fff', borderBottom:`1px solid ${COLORS.border}`, padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  content: { flex:1, padding:24, overflowY:'auto' },
  card:    { background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:20 },
  grid4:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:20 },
  statCard:{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },
  badge:   (c) => ({ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c }),
  viewBadge:{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:'#fef3c7', color:'#92400e', marginLeft:8 },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:      { textAlign:'left', padding:'10px 12px', borderBottom:`2px solid ${COLORS.border}`, color:COLORS.textMuted, fontWeight:600, fontSize:12, textTransform:'uppercase' },
  td:      { padding:'10px 12px', borderBottom:`1px solid #f1f5f9`, color:COLORS.text },
  tdMuted: { padding:'10px 12px', borderBottom:`1px solid #f1f5f9`, color:COLORS.textMuted, fontSize:12 },
  btn:     (c='#4f46e5') => ({ background:c, color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }),
  btnSm:   (c='#4f46e5') => ({ background:c, color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }),
  input:   { width:'100%', padding:'9px 12px', border:`1px solid ${COLORS.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', padding:'9px 12px', border:`1px solid ${COLORS.border}`, borderRadius:8, fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:   { background:'#fff', borderRadius:16, padding:28, width:480, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' },
  sectionTitle: { fontWeight:700, fontSize:16, color:COLORS.text, marginBottom:16, display:'flex', alignItems:'center', gap:8 },
  searchRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  filterRow: { display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' },
  formRow: { display:'flex', flexDirection:'column', gap:12 },
  label:   { fontSize:12, fontWeight:600, color:COLORS.textMuted, marginBottom:4 },
  msg:     (ok) => ({ padding:'10px 14px', borderRadius:8, fontSize:13, background: ok?'#d1fae5':'#fee2e2', color: ok?'#065f46':'#991b1b', marginBottom:12 }),
};

export default function EmployeeDashboard() {
  const token    = localStorage.getItem('super_admin_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const role     = localStorage.getItem('user_role') || userData.role || 'support';
  const authH    = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [section, setSection]     = useState('dashboard');
  const [stats, setStats]         = useState({});
  const [tenants, setTenants]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [saasApps, setSaasApps]   = useState([]);
  const [tickets, setTickets]     = useState([]);
  const [search, setSearch]       = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [showDialog, setShowDialog]     = useState(false);
  const [ticketForm, setTicketForm]     = useState({ subject:'', description:'', tenant_id:'', priority:'medium' });
  const [pwForm, setPwForm]       = useState({ current_password:'', new_password:'', confirm:'' });
  const [pwMsg, setPwMsg]         = useState(null);
  const [darkMode, setDarkMode]   = useState(false);

  const canTickets  = ['support','sales','admin'].includes(role);
  const canSaas     = ['sales','admin'].includes(role);
  const canMailbox  = role === 'admin';

  const sidebarNav = [
    { id:'dashboard', label:'Dashboard',         icon:'📊' },
    { id:'tenants',   label:'Tenants',            icon:'🏢' },
    { id:'users',     label:'Users',              icon:'👥' },
    ...(canTickets ? [{ id:'tickets',  label:'Support Tickets',    icon:'🎫' }] : []),
    ...(canSaas    ? [{ id:'saas-apps',label:'SaaS Applications',  icon:'▦'  }] : []),
    ...(canMailbox ? [{ id:'mailboxes',label:'Mailboxes',          icon:'📬' }] : []),
    { id:'profile',   label:'My Profile',         icon:'👤' },
  ];

  const api = useCallback(async (path) => {
    const r = await fetch(`${API}${path}`, { headers: authH });
    const d = await r.json();
    return d.success ? d.data : [];
  }, [token]);

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
  }, [token]);

  useEffect(() => {
    (async () => {
      if (section === 'dashboard') {
        const [s, t] = await Promise.all([
          fetch(`${API}/api/v1/super-admin/dashboard/stats`, { headers: authH }).then(r=>r.json()).catch(()=>({})),
          api('/api/v1/super-admin/tenants'),
        ]);
        if (s.success) setStats(s.data);
        setTenants(Array.isArray(t) ? t : []);
      } else if (section === 'tenants') {
        setTenants(await api('/api/v1/super-admin/tenants'));
      } else if (section === 'users') {
        setUsers(await api('/api/v1/super-admin/users?limit=100'));
      } else if (section === 'saas-apps') {
        setSaasApps(await api('/api/v1/super-admin/saas-apps'));
      } else if (section === 'tickets') {
        setTickets(await api('/api/v1/super-admin/support-tickets'));
        if (!tenants.length) setTenants(await api('/api/v1/super-admin/tenants'));
      }
    })();
  }, [section]);

  const createTicket = async () => {
    if (!ticketForm.subject) return;
    const r = await fetch(`${API}/api/v1/super-admin/support-tickets`, {
      method:'POST', headers: authH, body: JSON.stringify(ticketForm)
    });
    const d = await r.json();
    if (d.success) { setTickets(t => [d.data, ...t]); setShowDialog(false); setTicketForm({ subject:'', description:'', tenant_id:'', priority:'medium' }); }
  };

  const updateTicketStatus = async (id, status) => {
    const r = await fetch(`${API}/api/v1/super-admin/support-tickets/${id}/status`, {
      method:'PATCH', headers: authH, body: JSON.stringify({ status })
    });
    const d = await r.json();
    if (d.success) setTickets(ts => ts.map(t => t.id === id ? d.data : t));
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg({ ok:false, text:'Passwords do not match' }); return; }
    const r = await fetch(`${API}/api/v1/super-admin/profile/change-password`, {
      method:'PATCH', headers: authH,
      body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password })
    });
    const d = await r.json();
    setPwMsg({ ok: d.success, text: d.message || d.error });
    if (d.success) setPwForm({ current_password:'', new_password:'', confirm:'' });
  };

  const nextStatus = { open:'in_progress', in_progress:'resolved', resolved:'open' };
  const nextLabel  = { open:'Mark In Progress', in_progress:'Mark Resolved', resolved:'Reopen' };

  const filteredTickets = tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter);
  const roleMeta = ROLE_META[role] || ROLE_META.support;

  const dm = darkMode ? { background:'#0f172a', color:'#f1f5f9' } : {};
  const dmCard = darkMode ? { background:'#1e293b', color:'#f1f5f9' } : {};

  return (
    <div style={{ ...styles.wrap, ...dm }}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoTxt}>SSGzone</div>
          <div style={styles.logoSub}>Employee Portal</div>
        </div>
        <nav style={{ flex:1, padding:'12px 0' }}>
          {sidebarNav.map(n => (
            <div key={n.id} style={styles.navItem(section === n.id)} onClick={() => { setSection(n.id); setSearch(''); }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={styles.main}>

        {/* Header */}
        <div style={{ ...styles.header, ...(darkMode ? { background:'#1e293b', borderColor:'#334155' } : {}) }}>
          <div style={{ fontWeight:700, fontSize:15, color: darkMode?'#f1f5f9':COLORS.text }}>
            {sidebarNav.find(n=>n.id===section)?.label}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={styles.badge(roleMeta.color)}>{roleMeta.label}</span>
            <span style={{ fontSize:13, color:COLORS.textMuted }}>{userData.full_name || userData.username}</span>
            <button onClick={() => setDarkMode(d=>!d)} style={{ ...styles.btnSm('#64748b'), padding:'5px 10px' }}>{darkMode?'☀️':'🌙'}</button>
            <button onClick={() => { localStorage.clear(); window.location.href='/'; }} style={styles.btnSm('#ef4444')}>Logout</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.content, ...(darkMode?{ background:'#0f172a' }:{}) }}>

          {/* ── Dashboard ── */}
          {section === 'dashboard' && (
            <>
              <div style={styles.grid4}>
                {[
                  { label:'Total Tenants', value: stats.totalTenants ?? '—', icon:'🏢', color: COLORS.primary },
                  { label:'Total Users',   value: stats.totalUsers   ?? '—', icon:'👥', color: COLORS.success },
                  { label:'SaaS Apps',     value: stats.totalSaasApps?? '—', icon:'▦',  color: COLORS.warning },
                  { label:'Emails Today',  value: stats.emailsToday  ?? '—', icon:'📧', color: COLORS.info },
                ].map(s => (
                  <div key={s.label} style={{ ...styles.statCard, ...dmCard }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                    <div style={{ fontSize:28, fontWeight:700, color: darkMode?'#f1f5f9':COLORS.text }}>{s.value}</div>
                    <div style={{ fontSize:12, color:COLORS.textMuted, marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.card, ...dmCard }}>
                <div style={styles.sectionTitle}>Recent Tenants</div>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>Company</th><th style={styles.th}>Domain</th>
                    <th style={styles.th}>Plan</th><th style={styles.th}>Status</th><th style={styles.th}>Created</th>
                  </tr></thead>
                  <tbody>{tenants.slice(0,5).map(t => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.company_name}</td>
                      <td style={styles.tdMuted}>{t.domain}</td>
                      <td style={styles.td}>{t.plan_type||'—'}</td>
                      <td style={styles.td}><span style={styles.badge(t.status==='active'?COLORS.success:COLORS.danger)}>{t.status}</span></td>
                      <td style={styles.tdMuted}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Tenants ── */}
          {section === 'tenants' && (
            <div style={{ ...styles.card, ...dmCard }}>
              <div style={styles.searchRow}>
                <div style={styles.sectionTitle}>Tenants <span style={styles.viewBadge}>View Only</span></div>
                <input placeholder="Search company..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...styles.input, width:220 }} />
              </div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Company</th><th style={styles.th}>SaaS App</th>
                  <th style={styles.th}>Domain</th><th style={styles.th}>Users</th><th style={styles.th}>Status</th>
                </tr></thead>
                <tbody>{tenants.filter(t=>!search||t.company_name?.toLowerCase().includes(search.toLowerCase())).map(t=>(
                  <tr key={t.id}>
                    <td style={styles.td}>{t.company_name}</td>
                    <td style={styles.td}>{t.saas_app_name||'—'}</td>
                    <td style={styles.tdMuted}>{t.domain}</td>
                    <td style={styles.td}>{t.user_count??0}</td>
                    <td style={styles.td}><span style={styles.badge(t.status==='active'?COLORS.success:COLORS.danger)}>{t.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* ── Users ── */}
          {section === 'users' && (
            <div style={{ ...styles.card, ...dmCard }}>
              <div style={styles.searchRow}>
                <div style={styles.sectionTitle}>Users <span style={styles.viewBadge}>View Only</span></div>
                <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...styles.input, width:220 }} />
              </div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Name</th><th style={styles.th}>Email</th><th style={styles.th}>Tenant</th>
                  <th style={styles.th}>Role</th><th style={styles.th}>Status</th><th style={styles.th}>Last Login</th>
                </tr></thead>
                <tbody>{users.filter(u=>!search||`${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())).map(u=>(
                  <tr key={u.id}>
                    <td style={styles.td}>{u.first_name} {u.last_name}</td>
                    <td style={styles.tdMuted}>{u.email}</td>
                    <td style={styles.tdMuted}>{u.tenant_name||'—'}</td>
                    <td style={styles.td}>{u.role}</td>
                    <td style={styles.td}><span style={styles.badge(u.status==='active'?COLORS.success:COLORS.danger)}>{u.status}</span></td>
                    <td style={styles.tdMuted}>{u.last_login?new Date(u.last_login).toLocaleDateString():'—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* ── Support Tickets ── */}
          {section === 'tickets' && canTickets && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={styles.filterRow}>
                  {['all','open','in_progress','resolved'].map(f=>(
                    <button key={f} onClick={()=>setTicketFilter(f)}
                      style={{ ...styles.btnSm(ticketFilter===f?COLORS.primary:'#e2e8f0'), color: ticketFilter===f?'#fff':COLORS.textMuted }}>
                      {f==='all'?'All':f==='in_progress'?'In Progress':f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setShowDialog(true)} style={styles.btn()}>+ New Ticket</button>
              </div>
              <div style={{ ...styles.card, ...dmCard }}>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>#</th><th style={styles.th}>Subject</th><th style={styles.th}>Tenant</th>
                    <th style={styles.th}>Priority</th><th style={styles.th}>Status</th><th style={styles.th}>Created</th><th style={styles.th}>Action</th>
                  </tr></thead>
                  <tbody>{filteredTickets.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.tdMuted}>#{t.id}</td>
                      <td style={styles.td}>{t.subject}</td>
                      <td style={styles.tdMuted}>{t.tenant_name||'—'}</td>
                      <td style={styles.td}><span style={styles.badge(PRIORITY_COLOR[t.priority]||'#64748b')}>{t.priority}</span></td>
                      <td style={styles.td}><span style={styles.badge(STATUS_COLOR[t.status]||'#64748b')}>{t.status}</span></td>
                      <td style={styles.tdMuted}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <button onClick={()=>updateTicketStatus(t.id, nextStatus[t.status])}
                          style={styles.btnSm(STATUS_COLOR[nextStatus[t.status]]||'#64748b')}>
                          {nextLabel[t.status]}
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SaaS Apps ── */}
          {section === 'saas-apps' && canSaas && (
            <div style={{ ...styles.card, ...dmCard }}>
              <div style={styles.sectionTitle}>SaaS Applications <span style={styles.viewBadge}>View Only</span></div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Name</th><th style={styles.th}>Slug</th>
                  <th style={styles.th}>Tenants</th><th style={styles.th}>Status</th><th style={styles.th}>Created</th>
                </tr></thead>
                <tbody>{saasApps.map(a=>(
                  <tr key={a.id}>
                    <td style={styles.td}>{a.name}</td>
                    <td style={styles.tdMuted}>{a.slug}</td>
                    <td style={styles.td}>{a.tenant_count??0}</td>
                    <td style={styles.td}><span style={styles.badge(a.status==='active'?COLORS.success:COLORS.danger)}>{a.status}</span></td>
                    <td style={styles.tdMuted}>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* ── Mailboxes ── */}
          {section === 'mailboxes' && canMailbox && (
            <div style={{ ...styles.card, ...dmCard }}>
              <div style={styles.sectionTitle}>Mailboxes <span style={styles.viewBadge}>View Only</span></div>
              <div style={{ color:COLORS.textMuted, fontSize:13 }}>Mailbox management coming soon.</div>
            </div>
          )}

          {/* ── My Profile ── */}
          {section === 'profile' && (
            <div style={{ maxWidth:480 }}>
              <div style={{ ...styles.card, ...dmCard }}>
                <div style={styles.sectionTitle}>My Profile</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                  {[
                    ['Full Name', userData.full_name || '—'],
                    ['Username',  userData.username  || '—'],
                    ['Email',     userData.email     || '—'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:13, color:COLORS.textMuted, width:90 }}>{k}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:12 }}>
                    <span style={{ fontSize:13, color:COLORS.textMuted, width:90 }}>Role</span>
                    <span style={styles.badge(roleMeta.color)}>{roleMeta.label}</span>
                  </div>
                </div>

                <div style={{ borderTop:`1px solid ${COLORS.border}`, paddingTop:20 }}>
                  <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Change Password</div>
                  {pwMsg && <div style={styles.msg(pwMsg.ok)}>{pwMsg.text}</div>}
                  <div style={styles.formRow}>
                    <div>
                      <div style={styles.label}>Current Password</div>
                      <input type="password" value={pwForm.current_password}
                        onChange={e=>setPwForm(f=>({...f,current_password:e.target.value}))} style={styles.input} />
                    </div>
                    <div>
                      <div style={styles.label}>New Password</div>
                      <input type="password" value={pwForm.new_password}
                        onChange={e=>setPwForm(f=>({...f,new_password:e.target.value}))} style={styles.input} />
                    </div>
                    <div>
                      <div style={styles.label}>Confirm New Password</div>
                      <input type="password" value={pwForm.confirm}
                        onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} style={styles.input} />
                    </div>
                    <button onClick={changePassword} style={{ ...styles.btn(), marginTop:4 }}>Change Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>{/* /content */}
      </div>{/* /main */}

      {/* New Ticket Dialog */}
      {showDialog && (
        <div style={styles.overlay} onClick={()=>setShowDialog(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>New Support Ticket</div>
            <div style={styles.formRow}>
              <div>
                <div style={styles.label}>Subject *</div>
                <input value={ticketForm.subject} onChange={e=>setTicketForm(f=>({...f,subject:e.target.value}))} style={styles.input} />
              </div>
              <div>
                <div style={styles.label}>Description</div>
                <textarea value={ticketForm.description} onChange={e=>setTicketForm(f=>({...f,description:e.target.value}))}
                  rows={4} style={{ ...styles.input, resize:'vertical' }} />
              </div>
              <div>
                <div style={styles.label}>Tenant (optional)</div>
                <select value={ticketForm.tenant_id} onChange={e=>setTicketForm(f=>({...f,tenant_id:e.target.value}))} style={styles.select}>
                  <option value="">— Select Tenant —</option>
                  {tenants.map(t=><option key={t.id} value={t.id}>{t.company_name}</option>)}
                </select>
              </div>
              <div>
                <div style={styles.label}>Priority</div>
                <select value={ticketForm.priority} onChange={e=>setTicketForm(f=>({...f,priority:e.target.value}))} style={styles.select}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={()=>setShowDialog(false)} style={{ ...styles.btnSm('#e2e8f0'), color:COLORS.textMuted }}>Cancel</button>
              <button onClick={createTicket} style={styles.btn()}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
