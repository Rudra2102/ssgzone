import React, { useState, useEffect } from 'react';

const API = 'https://api.ssgzone.in';

const c = {
  primary: '#6366f1', primaryLight: '#eff6ff',
  success: '#10b981', successLight: '#d1fae5',
  danger: '#ef4444', dangerLight: '#fee2e2',
  warning: '#f59e0b', warningLight: '#fef3c7',
  text: '#1f2937', textMuted: '#6b7280',
  border: '#e5e7eb', bg: '#f8fafc', card: '#ffffff'
};

const inp = { width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: c.text, background: c.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
const lbl = { fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 };
const mkBtn = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' });

function TenantAdminDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [twoFAStatus, setTwoFAStatus] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [userPermsPanel, setUserPermsPanel] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [userPermsLoading, setUserPermsLoading] = useState(false);
  const [userPermsSaving, setUserPermsSaving] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, emailsSent: 0, chatMessages: 0, whatsappMessages: 0 });
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [communicationSettings, setCommunicationSettings] = useState({ email_enabled: true, chat_enabled: true, whatsapp_enabled: false, notifications_enabled: true });
  const [oooList, setOooList] = useState([]);
  const [oooLoading, setOooLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openDeptModal, setOpenDeptModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', first_name: '', last_name: '', department_id: '', role: 'user', phone: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '', head_user_id: '' });
  const [modalError, setModalError] = useState('');

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('tenant_admin_token');
  const auth = { Authorization: `Bearer ${token}` };

  const getJwtPermissions = () => {
    try { return JSON.parse(atob(token.split('.')[1])).permissions || {}; } catch { return {}; }
  };
  const jwtPerms = getJwtPermissions();
  const canUse = (f) => jwtPerms[f] !== false;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sRes, uRes, dRes, cRes] = await Promise.all([
        fetch(`${API}/api/v1/tenant-admin/dashboard/stats`, { headers: auth }),
        fetch(`${API}/api/v1/tenant-admin/users`, { headers: auth }),
        fetch(`${API}/api/v1/tenant-admin/departments`, { headers: auth }),
        fetch(`${API}/api/v1/tenant-admin/communication/settings`, { headers: auth }),
      ]);
      const [s, u, d, cs] = await Promise.all([sRes.json(), uRes.json(), dRes.json(), cRes.json()]);
      if (s.success) setStats(s.data);
      if (u.success) setUsers(u.data);
      if (d.success) setDepartments(d.data);
      if (cs.success) setCommunicationSettings(cs.data);
    } catch (e) { console.error(e); }
  };

  const fetchOooList = async () => {
    setOooLoading(true);
    const res = await fetch(`${API}/api/v1/tenant-admin/team/ooo`, { headers: auth });
    const data = await res.json();
    if (data.success) setOooList(data.data);
    setOooLoading(false);
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const res = await fetch(`${API}/api/v1/tenant-admin/users/${user.id}/status`, {
      method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(`${user.first_name} ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } else showToast(data.error, 'error');
  };

  const resetUserPassword = async (userId) => {
    const res = await fetch(`${API}/api/v1/tenant-admin/users/${userId}/reset-password`, { method: 'POST', headers: auth });
    const data = await res.json();
    if (data.success) showToast(`New password: ${data.data.new_password}`);
    else showToast(data.error, 'error');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this employee?')) return;
    const res = await fetch(`${API}/api/v1/tenant-admin/users/${userId}`, { method: 'DELETE', headers: auth });
    const data = await res.json();
    if (data.success) { setUsers(prev => prev.filter(u => u.id !== userId)); showToast('Employee deleted'); }
    else showToast(data.error, 'error');
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name, department_id: user.department_id || '', role: user.role, phone: user.phone || '' });
    setModalError(''); setOpenUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.first_name || !userForm.last_name) { setModalError('Fill all required fields'); return; }
    const url = editingUser ? `${API}/api/v1/tenant-admin/users/${editingUser.id}` : `${API}/api/v1/tenant-admin/users`;
    const res = await fetch(url, { method: editingUser ? 'PUT' : 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) });
    const data = await res.json();
    if (data.success) {
      if (editingUser) setUsers(prev => prev.map(u => u.id === editingUser.id ? data.data : u));
      else setUsers(prev => [...prev, data.data]);
      setOpenUserModal(false); setEditingUser(null);
      setUserForm({ username: '', email: '', first_name: '', last_name: '', department_id: '', role: 'user', phone: '' });
      showToast(editingUser ? 'Employee updated' : 'Employee created');
    } else setModalError(data.error);
  };

  const openEditDept = (dept) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description || '', head_user_id: dept.head_user_id || '' });
    setModalError(''); setOpenDeptModal(true);
  };

  const saveDept = async () => {
    if (!deptForm.name) { setModalError('Department name required'); return; }
    const url = editingDept ? `${API}/api/v1/tenant-admin/departments/${editingDept.id}` : `${API}/api/v1/tenant-admin/departments`;
    const res = await fetch(url, { method: editingDept ? 'PUT' : 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) });
    const data = await res.json();
    if (data.success) {
      if (editingDept) setDepartments(prev => prev.map(d => d.id === editingDept.id ? data.data : d));
      else setDepartments(prev => [...prev, data.data]);
      setOpenDeptModal(false); setEditingDept(null);
      setDeptForm({ name: '', description: '', head_user_id: '' });
      showToast(editingDept ? 'Department updated' : 'Department created');
    } else setModalError(data.error);
  };

  const handleDeleteDept = async (deptId) => {
    if (!window.confirm('Delete this department?')) return;
    const res = await fetch(`${API}/api/v1/tenant-admin/departments/${deptId}`, { method: 'DELETE', headers: auth });
    const data = await res.json();
    if (data.success) { setDepartments(prev => prev.filter(d => d.id !== deptId)); showToast('Department deleted'); }
    else showToast(data.error, 'error');
  };

  const updateCommSetting = async (key, val) => {
    const updated = { ...communicationSettings, [key]: val };
    setCommunicationSettings(updated);
    await fetch(`${API}/api/v1/tenant-admin/communication/settings`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  };

  const logout = () => { localStorage.clear(); window.location.href = '/'; };

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'departments', label: 'Departments', icon: '🏢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    ...(canUse('analytics') ? [{ id: 'analytics', label: 'Analytics', icon: '📈' }] : []),
    ...(canUse('email') ? [{ id: 'ooo', label: 'Team OOO', icon: '🏖️' }] : []),
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  const filteredUsers = users.filter(u =>
    !userSearch || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const Sidebar = () => (
    <div style={{ width: 220, minHeight: '100vh', background: c.card, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{userData.company_name || 'Company Admin'}</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{userData.email || userData.username}</div>
      </div>
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {nav.map(item => (
          <div key={item.id}
            onClick={() => { setActiveNav(item.id); if (item.id === 'ooo') fetchOooList(); if (item.id === 'security') fetch('https://api.ssgzone.in/api/v1/tenant-admin/2fa/status',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).then(d=>d.success&&setTwoFAStatus(d.data.enabled)); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: activeNav === item.id ? c.primaryLight : 'transparent', color: activeNav === item.id ? c.primary : c.text, fontWeight: activeNav === item.id ? 600 : 400, fontSize: 13 }}>
            <span>{item.icon}</span>{item.label}
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${c.border}` }}>
        <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: c.danger, fontSize: 13 }}>
          <span>⎋</span> Sign Out
        </div>
      </div>
    </div>
  );

  const DashboardSection = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>Welcome, {userData.full_name || userData.username}</div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>{userData.company_name} · Company Dashboard</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Total Employees', stats.totalUsers, '👥'],
          ['Emails Sent', stats.emailsSent, '📧'],
          ['Chat Messages', stats.chatMessages, '💬'],
          ['WhatsApp Messages', stats.whatsappMessages, '📱'],
        ].map(([label, val, icon]) => (
          <div key={label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.text }}>{val || 0}</div>
            <div style={{ fontSize: 12, color: c.textMuted }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 12 }}>Quick Stats</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 13, color: c.textMuted }}>Active Users: </span><span style={{ fontWeight: 600, color: c.success }}>{stats.activeUsers || 0}</span></div>
          <div><span style={{ fontSize: 13, color: c.textMuted }}>Departments: </span><span style={{ fontWeight: 600, color: c.text }}>{departments.length}</span></div>
          <div><span style={{ fontSize: 13, color: c.textMuted }}>Storage: </span><span style={{ fontWeight: 600, color: c.text }}>{stats.storageUsed || '—'}</span></div>
        </div>
      </div>
    </div>
  );

  const EmployeesSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>Employees</div>
        <button onClick={() => { setEditingUser(null); setUserForm({ username: '', email: '', first_name: '', last_name: '', department_id: '', role: 'user', phone: '' }); setModalError(''); setOpenUserModal(true); }} style={mkBtn(c.primary, '#fff')}>+ Add Employee</button>
      </div>
      <div style={{ marginBottom: 14 }}>
        <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email…"
          style={{ ...inp, marginBottom: 0, maxWidth: 320 }} />
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
            {['Name', 'Email', 'Department', 'Role', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: c.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: c.text }}>{u.first_name} {u.last_name}</td>
                <td style={{ padding: '12px 16px', color: c.textMuted, fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '12px 16px', color: c.textMuted }}>{u.department_name || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: u.role === 'admin' ? c.primaryLight : c.bg, color: u.role === 'admin' ? c.primary : c.textMuted, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: u.status === 'active' ? c.successLight : c.dangerLight, color: u.status === 'active' ? c.success : c.danger, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{u.status || 'active'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditUser(u)} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: c.text }}>✏️</button>
                    <button onClick={() => toggleUserStatus(u)} style={{ background: 'none', border: `1px solid ${u.status === 'active' ? c.danger : c.success}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: u.status === 'active' ? c.danger : c.success, fontWeight: 600 }}>
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button onClick={() => resetUserPassword(u.id)} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: c.warning }}>🔑</button>
                    <button onClick={() => { setUserPermsPanel(u.id); fetchUserPerms(u.id); }} style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: '#6366f1' }}>🔐 Perms</button>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: `1px solid ${c.danger}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: c.danger }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredUsers.length && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: c.textMuted }}>No employees found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DepartmentsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>Departments</div>
        <button onClick={() => { setEditingDept(null); setDeptForm({ name: '', description: '', head_user_id: '' }); setModalError(''); setOpenDeptModal(true); }} style={mkBtn(c.primary, '#fff')}>+ Add Department</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {departments.map(d => (
          <div key={d.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: c.text, marginBottom: 6 }}>{d.name}</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 12, minHeight: 36 }}>{d.description || '—'}</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 14 }}>Head: {d.head_name || 'Not assigned'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEditDept(d)} style={{ ...mkBtn('none', c.text), border: `1px solid ${c.border}`, fontSize: 12, padding: '5px 12px' }}>✏️ Edit</button>
              <button onClick={() => handleDeleteDept(d.id)} style={{ ...mkBtn('none', c.danger), border: `1px solid ${c.danger}`, fontSize: 12, padding: '5px 12px' }}>🗑 Delete</button>
            </div>
          </div>
        ))}
        {!departments.length && <div style={{ color: c.textMuted, padding: 20 }}>No departments yet</div>}
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? c.success : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s' }} />
    </div>
  );

  const SettingsSection = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 20 }}>Communication Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[
          { key: 'email_enabled', label: 'Email System', desc: 'Professional email accounts for all employees', icon: '📧' },
          { key: 'chat_enabled', label: 'Internal Chat', desc: 'Real-time messaging between employees', icon: '💬' },
          { key: 'whatsapp_enabled', label: 'WhatsApp Business', desc: 'Business messaging via WhatsApp', icon: '📱' },
          { key: 'notifications_enabled', label: 'Push Notifications', desc: 'Real-time notifications for important updates', icon: '🔔' },
        ].map(({ key, label, desc, icon }) => (
          <div key={key} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: c.textMuted }}>{desc}</div>
              </div>
              <Toggle checked={communicationSettings[key]} onChange={() => updateCommSetting(key, !communicationSettings[key])} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AnalyticsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>Analytics</div>
        <button onClick={fetchDashboardData} style={{ ...mkBtn('none', c.text), border: `1px solid ${c.border}`, fontSize: 12 }}>↻ Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 14 }}>📧 Email Statistics</div>
          {[['Emails Sent Today', stats.emailsSent], ['Total Employees', stats.totalUsers], ['Active Users', stats.activeUsers]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.border}`, fontSize: 13 }}>
              <span style={{ color: c.textMuted }}>{label}</span>
              <span style={{ fontWeight: 600, color: c.text }}>{val || 0}</span>
            </div>
          ))}
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 14 }}>💬 Chat Activity</div>
          {[['Messages Today', stats.chatMessages], ['Departments', departments.length], ['Active Conversations', stats.activeChats || 0]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.border}`, fontSize: 13 }}>
              <span style={{ color: c.textMuted }}>{label}</span>
              <span style={{ fontWeight: 600, color: c.text }}>{val || 0}</span>
            </div>
          ))}
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 14 }}>📱 WhatsApp Business</div>
          {[['Messages Sent', stats.whatsappMessages], ['Storage Used', stats.storageUsed || '—'], ['Storage Quota', stats.storageQuota || '—']].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.border}`, fontSize: 13 }}>
              <span style={{ color: c.textMuted }}>{label}</span>
              <span style={{ fontWeight: 600, color: c.text }}>{val || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const OooSection = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 20 }}>Team Out-of-Office</div>
      {oooLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading…</div>
      ) : (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
              {['Employee', 'Email', 'Subject', 'Active Until', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: c.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {oooList.map(ar => (
                <tr key={ar.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: c.text }}>{ar.first_name} {ar.last_name}</td>
                  <td style={{ padding: '12px 16px', color: c.textMuted, fontSize: 12 }}>{ar.user_email}</td>
                  <td style={{ padding: '12px 16px', color: c.text }}>{ar.subject}</td>
                  <td style={{ padding: '12px 16px', color: c.textMuted }}>{ar.end_date ? new Date(ar.end_date).toLocaleDateString() : 'Indefinite'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: c.successLight, color: c.success, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>Active</span>
                  </td>
                </tr>
              ))}
              {!oooList.length && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: c.textMuted }}>No active out-of-office in your team</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  const fetchUserPerms = async (userId) => {
    setUserPermsLoading(true);
    try {
      const res = await fetch(`https://api.ssgzone.in/api/v1/tenant-admin/users/${userId}/permissions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUserPerms(data.data);
    } catch {}
    setUserPermsLoading(false);
  };

  const saveUserPerms = async (userId) => {
    setUserPermsSaving(true);
    const permsObj = {};
    userPerms.forEach(p => { permsObj[p.feature_key] = p.is_enabled; });
    try {
      const res = await fetch(`https://api.ssgzone.in/api/v1/tenant-admin/users/${userId}/permissions`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permsObj })
      });
      const data = await res.json();
      if (data.success) { setUserPermsPanel(null); showToast('Permissions saved'); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setUserPermsSaving(false);
  };

  const SecuritySection = () => {
    const [localCode, setLocalCode] = React.useState('');
    const setup2FA = async () => {
      setTwoFASaving(true);
      const res = await fetch('https://api.ssgzone.in/api/v1/tenant-admin/2fa/setup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) setTwoFASetup(d.data);
      setTwoFASaving(false);
    };
    const enable2FA = async () => {
      setTwoFASaving(true);
      const res = await fetch('https://api.ssgzone.in/api/v1/tenant-admin/2fa/enable', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: localCode })
      });
      const d = await res.json();
      if (d.success) { setTwoFAStatus(true); setTwoFASetup(null); setLocalCode(''); showToast('2FA enabled!'); }
      else alert(d.error);
      setTwoFASaving(false);
    };
    const disable2FA = async () => {
      if (!window.confirm('Disable 2FA?')) return;
      const res = await fetch('https://api.ssgzone.in/api/v1/tenant-admin/2fa/disable', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) { setTwoFAStatus(false); showToast('2FA disabled'); }
    };
    return (
      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 20 }}>Security — Two-Factor Authentication</div>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>{twoFAStatus ? '🔒' : '🔓'}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>2FA is {twoFAStatus ? 'Enabled' : 'Disabled'}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{twoFAStatus ? 'Your account is protected with TOTP' : 'Enable 2FA for extra security'}</div>
            </div>
          </div>
          {!twoFAStatus && !twoFASetup && (
            <button onClick={setup2FA} disabled={twoFASaving} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {twoFASaving ? 'Loading...' : 'Setup 2FA'}
            </button>
          )}
          {twoFASetup && (
            <div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 12 }}>Scan this QR code with Google Authenticator or Authy:</div>
              <img src={twoFASetup.qr_code} alt="QR" style={{ width: 180, height: 180, border: `1px solid ${c.border}`, borderRadius: 8, marginBottom: 12 }} />
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 12, fontFamily: 'monospace', background: c.bg, padding: '6px 10px', borderRadius: 6 }}>Secret: {twoFASetup.secret}</div>
              <input value={localCode} onChange={e => setLocalCode(e.target.value)} maxLength={6} placeholder="Enter 6-digit code"
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 16, textAlign: 'center', letterSpacing: 6, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              <button onClick={enable2FA} disabled={twoFASaving || localCode.length !== 6}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: localCode.length !== 6 ? 0.6 : 1 }}>
                {twoFASaving ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          )}
          {twoFAStatus && (
            <button onClick={disable2FA} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Disable 2FA</button>
          )}
        </div>
      </div>
    );
  };


  const renderSection = () => {
    switch (activeNav) {
      case 'dashboard': return <DashboardSection />;
      case 'employees': return <EmployeesSection />;
      case 'departments': return <DepartmentsSection />;
      case 'settings': return <SettingsSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'ooo': return <OooSection />;
      case 'security': return <SecuritySection />;
      default: return <DashboardSection />;
    }
  };

  const ModalOverlay = ({ children }) => (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: c.card, borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px #0003' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, padding: 28 }}>
        {renderSection()}
      </div>


      {userPermsPanel && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px #0003' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>🔐 User Permissions</div>
              <button onClick={() => setUserPermsPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>×</button>
            </div>
            {userPermsLoading && <div style={{ color: '#6b7280', fontSize: 13 }}>Loading...</div>}
            {!userPermsLoading && userPerms.length === 0 && <div style={{ color: '#6b7280', fontSize: 13 }}>No feature definitions found.</div>}
            {!userPermsLoading && userPerms.length > 0 && (
              <div>
                {Object.entries(userPerms.reduce((acc, p) => { (acc[p.category||'general'] = acc[p.category||'general']||[]).push(p); return acc; }, {})).map(([cat, perms]) => (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{cat}</div>
                    {perms.map(p => (
                      <div key={p.feature_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{p.feature_name || p.feature_key}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{p.feature_key}</div>
                        </div>
                        <div onClick={() => setUserPerms(prev => prev.map(x => x.feature_key === p.feature_key ? { ...x, is_enabled: !x.is_enabled } : x))}
                          style={{ width: 44, height: 24, borderRadius: 12, background: p.is_enabled ? '#10b981' : '#e5e7eb', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: p.is_enabled ? 23 : 3, transition: 'left 0.2s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 14 }}>⚠️ Cannot grant features not enabled at tenant level</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setUserPermsPanel(null)} style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>Cancel</button>
                  <button onClick={() => saveUserPerms(userPermsPanel)} disabled={userPermsSaving}
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: userPermsSaving ? 0.7 : 1 }}>
                    {userPermsSaving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {openUserModal && (
        <ModalOverlay>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: c.text }}>{editingUser ? 'Edit Employee' : 'Add Employee'}</div>
            <button onClick={() => setOpenUserModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: c.textMuted }}>✕</button>
          </div>
          {modalError && <div style={{ background: c.dangerLight, color: c.danger, borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{modalError}</div>}
          {[['Username *', 'username', 'text'], ['Email *', 'email', 'email'], ['First Name *', 'first_name', 'text'], ['Last Name *', 'last_name', 'text'], ['Phone', 'phone', 'text']].map(([label, key, type]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type={type} value={userForm[key]} onChange={e => setUserForm(p => ({ ...p, [key]: e.target.value }))} style={inp} />
            </div>
          ))}
          <label style={lbl}>Department</label>
          <select value={userForm.department_id} onChange={e => setUserForm(p => ({ ...p, department_id: e.target.value }))} style={inp}>
            <option value="">— Select Department —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label style={lbl}>Role</label>
          <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))} style={{ ...inp, marginBottom: 20 }}>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={saveUser} style={{ ...mkBtn(c.primary, '#fff'), flex: 1 }}>{editingUser ? 'Update' : 'Create'} Employee</button>
            <button onClick={() => setOpenUserModal(false)} style={{ ...mkBtn('none', c.text), flex: 1, border: `1px solid ${c.border}` }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {openDeptModal && (
        <ModalOverlay>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: c.text }}>{editingDept ? 'Edit Department' : 'Add Department'}</div>
            <button onClick={() => setOpenDeptModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: c.textMuted }}>✕</button>
          </div>
          {modalError && <div style={{ background: c.dangerLight, color: c.danger, borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{modalError}</div>}
          <label style={lbl}>Department Name *</label>
          <input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="e.g. Human Resources" />
          <label style={lbl}>Description</label>
          <textarea value={deptForm.description} onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))}
            style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Optional description" />
          <label style={lbl}>Department Head</label>
          <select value={deptForm.head_user_id} onChange={e => setDeptForm(p => ({ ...p, head_user_id: e.target.value }))} style={{ ...inp, marginBottom: 20 }}>
            <option value="">— Select Head —</option>
            {users.filter(u => ['manager', 'admin'].includes(u.role)).map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={saveDept} style={{ ...mkBtn(c.primary, '#fff'), flex: 1 }}>{editingDept ? 'Update' : 'Create'} Department</button>
            <button onClick={() => setOpenDeptModal(false)} style={{ ...mkBtn('none', c.text), flex: 1, border: `1px solid ${c.border}` }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? c.danger : c.success, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px #0003', maxWidth: 360 }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

export default TenantAdminDashboard;
