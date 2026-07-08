import React, { useState, useEffect } from 'react';
import EnhancedMetricCard from './components/EnhancedMetricCard';
import EmailOverview from './components/EmailOverview';
import SystemActivity from './components/SystemActivity';
import EmailHealthMetrics from './components/EmailHealthMetrics';
import StorageUsage from './components/StorageUsage';

function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [branding, setBranding] = useState({ platform_name: 'SSGzone', primary_color: '#4f46e5', secondary_color: '#06b6d4', sidebar_color: '', header_color: '', sidebar_text_color: '', header_text_color: '', font_family: '', font_size: '', logo_url: null });
  const [stats, setStats] = useState({});
  const [saasApps, setSaasApps] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [openSaasDialog, setOpenSaasDialog] = useState(false);
  const [openTenantDialog, setOpenTenantDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openApiKeysDialog, setOpenApiKeysDialog] = useState(false);
  const [openBulkImportDialog, setOpenBulkImportDialog] = useState(false);
  const [editingSaasApp, setEditingSaasApp] = useState(null);
  const [deletingSaasApp, setDeletingSaasApp] = useState(null);
  const [viewingApiKeys, setViewingApiKeys] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [newSaasApp, setNewSaasApp] = useState({ name: '', slug: '', description: '', webhook_url: '' });
  const [newTenant, setNewTenant] = useState({ company_name: '', slug: '', saas_app_id: '', admin_name: '', admin_email: '', max_users: 100 });
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSearchSuggestions, setUsersSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [usersTenantFilter, setUsersTenantFilter] = useState('');
  const [usersSaasFilter, setUsersSaasFilter] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [openDeleteUserDialog, setOpenDeleteUserDialog] = useState(false);
  const [viewingFeatures, setViewingFeatures] = useState(null);
  const [openFeaturesDialog, setOpenFeaturesDialog] = useState(false);
  const [featuresForm, setFeaturesForm] = useState({});

  const token = localStorage.getItem('super_admin_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const API = 'https://api.ssgzone.in/api/v1/super-admin';

  const authHeaders = { 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchAll(); fetchBranding(); }, []);

  const fetchBranding = async () => {
    try {
      const res = await fetch(`${API}/branding`);
      const data = await res.json();
      if (data.success) setBranding(data.data);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (activeSection === 'users') fetchUsers(); }, [activeSection, usersPage, usersSearch, usersTenantFilter, usersSaasFilter, usersStatusFilter]);

  const fetchAll = async () => {
    try {
      const [statsRes, appsRes, tenantsRes, usersRes] = await Promise.all([
        fetch(`${API}/dashboard/stats`, { headers: authHeaders }),
        fetch(`${API}/saas-apps`, { headers: authHeaders }),
        fetch(`${API}/tenants`, { headers: authHeaders }),
        fetch(`${API}/users?limit=5`, { headers: authHeaders })
      ]);
      const [statsData, appsData, tenantsData, usersData] = await Promise.all([
        statsRes.json(), appsRes.json(), tenantsRes.json(), usersRes.json()
      ]);
      if (statsData.success) setStats(statsData.data);
      if (appsData.success) setSaasApps(appsData.data);
      if (tenantsData.success) setTenants(tenantsData.data);
      if (usersData.success) { setUsers(usersData.data); setUsersTotal(usersData.total); }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ page: usersPage, limit: 50 });
      if (usersSearch) params.append('search', usersSearch);
      if (usersTenantFilter) params.append('tenant_id', usersTenantFilter);
      if (usersSaasFilter) params.append('saas_app_id', usersSaasFilter);
      if (usersStatusFilter) params.append('status', usersStatusFilter);
      const res = await fetch(`${API}/users?${params}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setUsers(data.data); setUsersTotal(data.total); }
    } catch (err) { console.error('Fetch users error:', err); }
  };

  const fetchUserSuggestions = async (q) => {
    if (!q || q.length < 2) { setUsersSearchSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`${API}/users?search=${encodeURIComponent(q)}&limit=5`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setUsersSearchSuggestions(data.data); setShowSuggestions(true); }
    } catch (err) { console.error(err); }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`${API}/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`${API}/users/${deletingUser.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setOpenDeleteUserDialog(false); setDeletingUser(null); fetchUsers(); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  const handleCreateSaasApp = async () => {
    if (!newSaasApp.name || !newSaasApp.slug) return alert('Name and Slug required');
    try {
      if (editingSaasApp) {
        const res = await fetch(`${API}/saas-apps/${editingSaasApp.id}`, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSaasApp.name })
        });
        const data = await res.json();
        if (data.success) { setOpenSaasDialog(false); setEditingSaasApp(null); setNewSaasApp({ name: '', slug: '' }); fetchAll(); }
        else alert(data.error);
      } else {
        const res = await fetch(`${API}/saas-apps`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ saas_name: newSaasApp.name, saas_slug: newSaasApp.slug })
        });
        const data = await res.json();
        if (data.success) { setOpenSaasDialog(false); setNewSaasApp({ name: '', slug: '', description: '', webhook_url: '' }); fetchAll(); }
        else alert(data.error);
      }
    } catch (err) { alert(err.message); }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.company_name || !newTenant.slug || !newTenant.saas_app_id || !newTenant.admin_name) return alert('Fill all required fields');
    try {
      const res = await fetch(`${API}/tenants`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      });
      const data = await res.json();
      if (data.success) {
        setOpenTenantDialog(false);
        setNewTenant({ company_name: '', slug: '', saas_app_id: '', admin_name: '', admin_email: '', max_users: 100 });
        fetchAll();
        alert(`Tenant created!\nAdmin Password: ${data.data?.admin_credentials?.password}`);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const handleViewApiKeys = async (app) => {
    try {
      const res = await fetch(`${API}/saas-apps/${app.id}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setViewingApiKeys(data.data); setOpenApiKeysDialog(true); }
    } catch (err) { alert(err.message); }
  };

  const handleViewFeatures = async (app) => {
    try {
      const res = await fetch(`${API}/saas-apps/${app.id}/features`, { headers: authHeaders });
      const data = await res.json();
      setFeaturesForm(data.success ? data.data : {});
      setViewingFeatures(app);
    } catch (err) {
      setFeaturesForm({});
      setViewingFeatures(app);
    }
  };

  const handleDeleteSaasApp = async () => {
    try {
      const res = await fetch(`${API}/saas-apps/${deletingSaasApp.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setOpenDeleteDialog(false); setDeletingSaasApp(null); fetchAll(); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
      });
      setCsvData(data);
      setImportPreview(data.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvData.length) return alert('Upload CSV first');
    setImporting(true);
    try {
      const res = await fetch(`${API}/tenants/import-csv`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_data: csvData })
      });
      const data = await res.json();
      if (data.success) { setImportResults(data.data); fetchAll(); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    finally { setImporting(false); }
  };

  const colors = {
    primary: branding.primary_color || '#4f46e5',
    primaryLight: (branding.primary_color || '#4f46e5') + '22',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    cyan: branding.secondary_color || '#06b6d4',
    cyanLight: (branding.secondary_color || '#06b6d4') + '33',
    purple: '#8b5cf6',
    purpleLight: '#ede9fe',
    bg: darkMode ? '#0f172a' : '#f8fafc',
    sidebar: branding.sidebar_color || (darkMode ? '#1e293b' : '#ffffff'),
    card: branding.header_color || (darkMode ? '#1e293b' : '#ffffff'),
    sidebarText: branding.sidebar_text_color || (darkMode ? '#f1f5f9' : '#1e293b'),
    headerText: branding.header_text_color || (darkMode ? '#f1f5f9' : '#1e293b'),
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
  };

  const sidebarNav = [
    { section: 'APPLICATIONS', items: [{ id: 'applications', label: 'Applications', icon: '▦' }] },
    { section: 'COMMUNICATION', items: [
      { id: 'compose', label: 'Compose', icon: '✏' },
      { id: 'email', label: 'Sent Emails', icon: '📤' },
      { id: 'templates', label: 'Templates', icon: '📄' },
    ]},
    { section: 'USER MANAGEMENT', items: [
      { id: 'users', label: 'Users', icon: '👥' },
      { id: 'admins', label: 'Platform Admins', icon: '🛡' },
      { id: 'tenants', label: 'Tenants', icon: '🏢' },
      { id: 'mailboxes', label: 'Mailboxes', icon: '📬' },
    ]},
    { section: 'SYSTEM', items: [
      { id: 'settings', label: 'Settings & Branding', icon: '⚙' },
    ]},
  ];

  const Sidebar = () => (
    <div style={{ width: 220, minHeight: '100vh', background: colors.sidebar, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100, overflowY: 'auto' }}>
      {/* Logo */}
      <div onClick={() => setActiveSection('dashboard')} style={{ padding: '20px 16px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {branding.logo_url
            ? <img src={branding.logo_url} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} />
            : <div style={{ width: 36, height: 36, background: branding.primary_color || colors.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>✉</div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.sidebarText }}>{branding.platform_name || 'SSGzone'}</div>
            <div style={{ fontSize: 11, color: colors.sidebarText, opacity: 0.6 }}>{branding.tagline || 'Mail Platform'}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {sidebarNav.map(group => (
          <div key={group.section} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.sidebarText, opacity: 0.5, padding: '8px 8px 4px', letterSpacing: '0.08em' }}>{group.section}</div>
            {group.items.map(item => (
              <div key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: activeSection === item.id ? colors.primaryLight : 'transparent', color: activeSection === item.id ? colors.primary : colors.sidebarText, fontWeight: activeSection === item.id ? 600 : 400, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </div>
                <span style={{ fontSize: 10, color: colors.sidebarText, opacity: 0.5 }}>›</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Help */}
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ background: colors.primaryLight, borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 4 }}>Need Help?</div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>Check our docs or contact support.</div>
          <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer', width: '100%' }}>View Documentation</button>
        </div>
        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: colors.danger, fontSize: 13 }}>
          <span>⎋</span> Sign Out
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div style={{ position: 'fixed', top: 0, left: 220, right: 0, height: 60, background: colors.card, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 99 }}>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 14px', width: 340 }}>
        <span style={{ color: colors.headerText, opacity: 0.5, fontSize: 14 }}>🔍</span>
        <input placeholder="Search users, tenants, emails, applications..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: colors.headerText, width: '100%' }} />
        <span style={{ fontSize: 11, color: colors.headerText, opacity: 0.5, background: colors.border, padding: '2px 6px', borderRadius: 4 }}>Ctrl+K</span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notifications */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ position: 'absolute', top: -4, right: -4, background: colors.danger, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
        </div>
        {/* Help */}
        <span style={{ fontSize: 18, cursor: 'pointer', color: colors.headerText, opacity: 0.6 }}>❓</span>
        <span onClick={() => setDarkMode(!darkMode)} style={{ fontSize: 18, cursor: 'pointer', color: colors.headerText, opacity: 0.6 }}>{darkMode ? '☀' : '🌙'}</span>
        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {(userData.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.headerText }}>Super Administrator</div>
            <div style={{ fontSize: 11, color: colors.headerText, opacity: 0.6 }}>Super Admin</div>
          </div>
          <span style={{ color: colors.headerText, opacity: 0.5, fontSize: 12 }}>▾</span>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ label, value, trend, trendLabel, icon, iconBg }) => (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 2 }}>{value ?? '—'}</div>
        {trend && <div style={{ fontSize: 11, color: colors.success }}>↑ {trend} <span style={{ color: colors.textMuted }}>{trendLabel}</span></div>}
      </div>
    </div>
  );

  const StatsRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
      <EnhancedMetricCard 
        title="SaaS Apps" 
        value={stats.totalSaasApps || 0} 
        icon="▦" 
        trend="Active"
        trendPercent={5}
      />
      <EnhancedMetricCard 
        title="Active Tenants" 
        value={stats.totalTenants || 0} 
        icon="🏢" 
        trend="Real-time"
        trendPercent={8}
      />
      <EnhancedMetricCard 
        title="Total Users" 
        value={stats.totalUsers || 0} 
        icon="👥" 
        trend="Real-time"
        trendPercent={12}
      />
      <EnhancedMetricCard 
        title="Emails Today" 
        value={stats.emailsToday || 0} 
        icon="📬" 
        trend="vs yesterday"
        trendPercent={-3}
      />
      <EnhancedMetricCard 
        title="Platform Admins" 
        value={stats.totalAdmins || 0} 
        icon="🛡" 
        trend="Active"
        trendPercent={0}
      />
    </div>
  );

  const QuickActions = () => (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Compose Email', icon: '✏', section: 'compose' },
          { label: 'Create Campaign', icon: '📢', section: 'campaigns' },
          { label: 'Add Tenant', icon: '🏢', action: () => setOpenTenantDialog(true) },
          { label: 'Add User', icon: '👤', section: 'users' },
          { label: 'Create Template', icon: '📄', section: 'templates' },
          { label: 'View Reports', icon: '📊', section: 'reports' },
          { label: 'System Settings', icon: '⚙', section: 'system-config' },
          { label: 'Security & Logs', icon: '🛡', section: 'security' },
          { label: 'Audit Logs', icon: '📋', section: 'audit' },
        ].map((a, i) => (
          <div key={i} onClick={a.action || (() => setActiveSection(a.section))}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: 12, color: colors.text, fontWeight: 500, background: colors.bg }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>{a.label}
          </div>
        ))}
      </div>
    </div>
  );

  const TopTenants = () => (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Top Tenants</div>
        <span onClick={() => setActiveSection('tenants')} style={{ fontSize: 12, color: colors.primary, cursor: 'pointer' }}>View All</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Tenant Name', 'Users', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tenants.slice(0, 5).map((t, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={{ padding: '10px', color: colors.text, fontWeight: 500 }}>{t.company_name}</td>
              <td style={{ padding: '10px', color: colors.text }}>{t.user_count || 0}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ background: colors.successLight, color: colors.success, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.status || 'Active'}</span>
              </td>
            </tr>
          ))}
          {tenants.length === 0 && <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No tenants found</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const RecentUsers = () => (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Recent Users</div>
        <span onClick={() => setActiveSection('users')} style={{ fontSize: 12, color: colors.primary, cursor: 'pointer' }}>View All</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Name', 'Email', 'Tenant', 'Role', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 5).map((u, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={{ padding: '10px', color: colors.text, fontWeight: 500 }}>{u.first_name} {u.last_name}</td>
              <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{u.email}</td>
              <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{u.tenant_name || '—'}</td>
              <td style={{ padding: '10px', color: colors.text }}>{u.role}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ background: u.status === 'active' ? colors.successLight : colors.dangerLight, color: u.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{u.status}</span>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No users found</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const UsersSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Users</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Total {usersTotal} users across all tenants</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input value={usersSearch}
            onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); fetchUserSuggestions(e.target.value); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => usersSearch.length >= 2 && setShowSuggestions(true)}
            placeholder="Search name, email, username..."
            style={{ width: '100%', padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', boxSizing: 'border-box' }} />
          {showSuggestions && usersSearchSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginTop: 4 }}>
              {usersSearchSuggestions.map((u, i) => (
                <div key={i} onMouseDown={() => { setUsersSearch(u.first_name + ' ' + u.last_name); setShowSuggestions(false); setUsersPage(1); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < usersSearchSuggestions.length - 1 ? `1px solid ${colors.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{u.tenant_name || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <select value={usersSaasFilter} onChange={e => { setUsersSaasFilter(e.target.value); setUsersTenantFilter(''); setUsersPage(1); }}
          style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none' }}>
          <option value="">All SaaS Apps</option>
          {saasApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={usersTenantFilter} onChange={e => { setUsersTenantFilter(e.target.value); setUsersPage(1); }}
          style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none' }}>
          <option value="">All Companies</option>
          {(usersSaasFilter ? tenants.filter(t => String(t.saas_app_id) === String(usersSaasFilter)) : tenants).map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
        </select>
        <select value={usersStatusFilter} onChange={e => { setUsersStatusFilter(e.target.value); setUsersPage(1); }}
          style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Name', 'Username', 'Email', 'SaaS', 'Company', 'Role', 'Registered', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>{u.first_name} {u.last_name}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{u.username}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '12px 16px', color: colors.text, fontSize: 12 }}>{u.saas_name || '—'}</td>
                <td style={{ padding: '12px 16px', color: colors.text, fontSize: 12 }}>{u.tenant_name || '—'}</td>
                <td style={{ padding: '12px 16px', color: colors.text }}>{u.role}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: u.status === 'active' ? colors.successLight : colors.dangerLight, color: u.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{u.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleToggleUserStatus(u)}
                      style={{ background: u.status === 'active' ? colors.warningLight : colors.successLight, color: u.status === 'active' ? colors.warning : colors.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                      {u.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                    </button>
                    <button onClick={() => { setDeletingUser(u); setOpenDeleteUserDialog(true); }}
                      title="Delete User"
                      style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', position: 'relative' }}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={10} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No users found</td></tr>}
          </tbody>
        </table>
      </div>
      {usersTotal > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)}
            style={{ padding: '6px 14px', border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.card, color: colors.text, cursor: usersPage === 1 ? 'not-allowed' : 'pointer', opacity: usersPage === 1 ? 0.5 : 1 }}>← Prev</button>
          <span style={{ padding: '6px 14px', color: colors.textMuted, fontSize: 13 }}>Page {usersPage} of {Math.ceil(usersTotal / 50)}</span>
          <button disabled={usersPage >= Math.ceil(usersTotal / 50)} onClick={() => setUsersPage(p => p + 1)}
            style={{ padding: '6px 14px', border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.card, color: colors.text, cursor: 'pointer' }}>Next →</button>
        </div>
      )}
    </div>
  );

  const ApplicationsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Applications</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Manage your SaaS applications</div>
        </div>
        <button onClick={() => { setEditingSaasApp(null); setNewSaasApp({ name: '', slug: '' }); setOpenSaasDialog(true); }}
          style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Application</button>
      </div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Name', 'Slug', 'Tenants', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {saasApps.map((app, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>{app.name}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontFamily: 'monospace' }}>{app.slug}</td>
                <td style={{ padding: '12px 16px', color: colors.text }}>{app.tenant_count || 0}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: colors.successLight, color: colors.success, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{app.status || 'Active'}</span>
                </td>
                <td style={{ padding: '12px 16px', color: colors.textMuted }}>{new Date(app.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleViewApiKeys(app)} style={{ background: colors.primaryLight, color: colors.primary, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🔑 Keys</button>
                    <button onClick={() => handleViewFeatures(app)} style={{ background: colors.cyanLight, color: colors.cyan, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>⚙ Features</button>
                    <button onClick={() => { setEditingSaasApp(app); setNewSaasApp({ name: app.name, slug: app.slug }); setOpenSaasDialog(true); }}
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                    <button onClick={() => { setDeletingSaasApp(app); setOpenDeleteDialog(true); }}
                      style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {saasApps.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No applications found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TenantsSection = () => {
    const [deletingTenant, setDeletingTenant] = useState(null);
    const [domainTenant, setDomainTenant] = useState(null);
    const [domainInput, setDomainInput] = useState('');
    const [domainStatus, setDomainStatus] = useState(null); // null | 'pending' | 'verified'
    const [domainInfo, setDomainInfo] = useState(null);
    const [domainLoading, setDomainLoading] = useState(false);

    const openDomainDialog = async (t) => {
      setDomainTenant(t);
      setDomainInput('');
      setDomainInfo(null);
      setDomainStatus(null);
      try {
        const res = await fetch(`${API}/tenants/${t.id}/domain/status`, { headers: authHeaders });
        const data = await res.json();
        if (data.success && data.data.custom_domain) {
          setDomainInput(data.data.custom_domain);
          setDomainStatus(data.data.domain_status);
        }
      } catch (e) {}
    };

    const setupDomain = async () => {
      if (!domainInput.trim()) return alert('Domain required');
      setDomainLoading(true);
      try {
        const res = await fetch(`${API}/tenants/${domainTenant.id}/domain/setup`, {
          method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_domain: domainInput.trim() })
        });
        const data = await res.json();
        if (data.success) { setDomainInfo(data.data); setDomainStatus('pending'); }
        else alert(data.error);
      } catch (e) { alert(e.message); }
      setDomainLoading(false);
    };

    const verifyDomain = async () => {
      setDomainLoading(true);
      try {
        const res = await fetch(`${API}/tenants/${domainTenant.id}/domain/verify`, {
          method: 'POST', headers: authHeaders
        });
        const data = await res.json();
        if (data.success) { setDomainStatus('verified'); setDomainInfo(null); alert('✅ Domain verified! Mailboxes can now be created.'); }
        else alert(data.error);
      } catch (e) { alert(e.message); }
      setDomainLoading(false);
    };

    const removeDomain = async () => {
      if (!window.confirm('Remove custom domain?')) return;
      const res = await fetch(`${API}/tenants/${domainTenant.id}/domain`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDomainTenant(null); fetchAll(); }
      else alert(data.error);
    };

    const toggleTenantStatus = async (t) => {
      const newStatus = t.status === 'active' ? 'suspended' : 'active';
      try {
        const res = await fetch(`${API}/tenants/${t.id}/status`, {
          method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) fetchAll();
        else alert(data.error);
      } catch (err) { alert(err.message); }
    };

    const deleteTenant = async () => {
      try {
        const res = await fetch(`${API}/tenants/${deletingTenant.id}`, { method: 'DELETE', headers: authHeaders });
        const data = await res.json();
        if (data.success) { setDeletingTenant(null); fetchAll(); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
    };

    return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Tenants</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Manage tenant companies</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setOpenBulkImportDialog(true)}
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬆ Bulk Import</button>
          <button onClick={() => { setNewTenant({ company_name: '', slug: '', saas_app_id: '', admin_name: '', admin_email: '', max_users: 100 }); setOpenTenantDialog(true); }}
            style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Create Tenant</button>
        </div>
      </div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Company Name', 'SaaS', 'Domain', 'Admin', 'Users', 'Max Users', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>{t.company_name}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{t.saas_app_name || '—'}</td>
                <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 11, fontFamily: 'monospace' }}>{t.domain || '—'}</td>
                <td style={{ padding: '12px 16px', color: colors.text, fontSize: 12 }}>{t.admin_name}</td>
                <td style={{ padding: '12px 16px', color: colors.text }}>{t.user_count || 0}</td>
                <td style={{ padding: '12px 16px', color: colors.text }}>{t.max_users}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: t.status === 'active' ? colors.successLight : colors.warningLight, color: t.status === 'active' ? colors.success : colors.warning, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.status || 'active'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleTenantStatus(t)}
                      style={{ background: t.status === 'active' ? colors.warningLight : colors.successLight, color: t.status === 'active' ? colors.warning : colors.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                      {t.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                    </button>
                    <button onClick={() => openDomainDialog(t)}
                      style={{ background: colors.cyanLight, color: colors.cyan, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🌐 Domain</button>
                    <button onClick={() => setDeletingTenant(t)}
                      style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No tenants found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm */}
      {deletingTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeletingTenant(null)}>
          <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete Tenant</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Are you sure you want to delete <strong>{deletingTenant.company_name}</strong>? This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeletingTenant(null)}>Cancel</button>
              <button style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={deleteTenant}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Dialog */}
      {domainTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDomainTenant(null)}>
          <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>🌐 Custom Domain — {domainTenant.company_name}</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Add a custom domain to create mailboxes on it</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Domain Name</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="e.g. allthetruth.in" disabled={domainStatus === 'verified'}
                style={{ flex: 1, padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none' }} />
              {domainStatus !== 'verified' && (
                <button onClick={setupDomain} disabled={domainLoading}
                  style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: domainLoading ? 0.7 : 1 }}>
                  {domainLoading ? '...' : domainStatus ? 'Update' : 'Setup'}
                </button>
              )}
            </div>
            {domainStatus && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ background: domainStatus === 'verified' ? colors.successLight : colors.warningLight, color: domainStatus === 'verified' ? colors.success : colors.warning, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  {domainStatus === 'verified' ? '✅ Verified — Mailboxes can be created' : '⏳ Pending DNS Verification'}
                </span>
              </div>
            )}
            {domainInfo?.verification && (
              <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Add these DNS records at your domain provider:</div>
                {[['1. TXT — Verification', `Name: _ssgzone-verify`, `Value: ${domainInfo.verification.value}`],
                  ['2. MX — Email Routing', `Name: @`, `Value: mail.ssgzone.in  Priority: 10`],
                  ['3. TXT — SPF Record', `Name: @`, `Value: v=spf1 include:ssgzone.in ~all`]
                ].map(([title, line1, line2]) => (
                  <div key={title} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{title}</div>
                    <div style={{ background: colors.card, borderRadius: 6, padding: 10, fontSize: 11, fontFamily: 'monospace', color: colors.text }}>
                      <div>{line1}</div><div>{line2}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: colors.warning, marginTop: 8 }}>⚠ DNS propagation: 5–30 minutes. Add records then click Verify.</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {domainStatus === 'pending' && (
                  <button onClick={verifyDomain} disabled={domainLoading}
                    style={{ background: colors.success, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: domainLoading ? 0.7 : 1 }}>
                    {domainLoading ? 'Verifying...' : '✅ Verify DNS'}
                  </button>
                )}
                {domainStatus && (
                  <button onClick={removeDomain} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>🗑 Remove</button>
                )}
              </div>
              <button onClick={() => setDomainTenant(null)} style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const TenantDialog = React.memo(() => {
    const [form, setForm] = React.useState({ company_name: '', slug: '', saas_app_id: '', admin_name: '', admin_email: '', max_users: 100 });
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    const submit = async () => {
      if (!form.company_name || !form.slug || !form.saas_app_id || !form.admin_name) return alert('Fill all required fields');
      try {
        const res = await fetch(`${API}/tenants`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (data.success) {
          setOpenTenantDialog(false);
          fetchAll();
          alert(`Tenant created!\nAdmin Password: ${data.data?.admin_credentials?.password}`);
        } else alert(data.error);
      } catch (err) { alert(err.message); }
    };
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenTenantDialog(false)}>
        <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Create New Tenant</div>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Company Name *</label>
          <input style={inputS} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. NABC Institute" />
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Slug *</label>
          <input style={inputS} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. nabc" />
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>SaaS Application *</label>
          <select style={inputS} value={form.saas_app_id} onChange={e => setForm(f => ({ ...f, saas_app_id: e.target.value }))}>
            <option value="">Select Application</option>
            {saasApps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
          </select>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Admin Name *</label>
          <input style={inputS} value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))} placeholder="Full name" />
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Admin Email</label>
          <input style={inputS} value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} placeholder="admin@company.com" />
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Max Users</label>
          <input style={inputS} type="number" value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: parseInt(e.target.value) }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenTenantDialog(false)}>Cancel</button>
            <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={submit}>Create Tenant</button>
          </div>
        </div>
      </div>
    );
  });

  const modalStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const boxStyle = { background: colors.card, borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' };
  const btnPrimary = { background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const btnSecondary = { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' };

  const Dialogs = () => (<>
    {/* SaaS App Dialog */}
    {openSaasDialog && (
      <div style={modalStyle} onClick={() => setOpenSaasDialog(false)}>
        <div style={boxStyle} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>{editingSaasApp ? 'Edit Application' : 'Add SaaS Application'}</div>
          <label style={labelStyle}>Application Name *</label>
          <input style={inputStyle} value={newSaasApp.name} onChange={e => setNewSaasApp({ ...newSaasApp, name: e.target.value })} placeholder="e.g. PEMS" />
          <label style={labelStyle}>Slug *</label>
          <input style={inputStyle} value={newSaasApp.slug} onChange={e => setNewSaasApp({ ...newSaasApp, slug: e.target.value })} placeholder="e.g. pems" disabled={!!editingSaasApp} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnSecondary} onClick={() => setOpenSaasDialog(false)}>Cancel</button>
            <button style={btnPrimary} onClick={handleCreateSaasApp}>{editingSaasApp ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </div>
    )}

    {/* Create Tenant Dialog */}
    {openTenantDialog && <TenantDialog />}

    {/* Delete Confirm Dialog */}
    {openDeleteDialog && (
      <div style={modalStyle} onClick={() => setOpenDeleteDialog(false)}>
        <div style={{ ...boxStyle, width: 380 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete Application</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Are you sure you want to delete <strong>{deletingSaasApp?.name}</strong>? This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={btnSecondary} onClick={() => setOpenDeleteDialog(false)}>Cancel</button>
            <button style={{ ...btnPrimary, background: colors.danger }} onClick={handleDeleteSaasApp}>Delete</button>
          </div>
        </div>
      </div>
    )}

    {/* API Keys Dialog */}
    {openApiKeysDialog && viewingApiKeys && (
      <div style={modalStyle} onClick={() => setOpenApiKeysDialog(false)}>
        <div style={{ ...boxStyle, width: 520 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>🔑 API Credentials</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{viewingApiKeys.name}</div>
          <div style={{ background: colors.warningLight, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: colors.warning }}>⚠ Keep these credentials secure. Never expose in client-side code.</div>
          {[['API Key', viewingApiKeys.api_key], ['API Secret', viewingApiKeys.api_secret]].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ ...inputStyle, marginBottom: 0, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', flex: 1 }}>{val || 'Not available'}</div>
                <button onClick={() => navigator.clipboard.writeText(val || '')} style={{ ...btnSecondary, padding: '10px 12px', fontSize: 12 }}>📋</button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnPrimary} onClick={() => setOpenApiKeysDialog(false)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Bulk Import Dialog */}
    {openBulkImportDialog && (
      <div style={modalStyle} onClick={() => { setOpenBulkImportDialog(false); setCsvFile(null); setCsvData([]); setImportPreview([]); setImportResults(null); }}>
        <div style={{ ...boxStyle, width: 560 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Bulk Import Tenants</div>
          {!importResults ? (<>
            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>CSV columns: <strong>company_name, slug, saas_app_id, admin_name, max_users</strong></div>
            <div onClick={() => document.getElementById('csv-upload').click()}
              style={{ border: `2px dashed ${colors.border}`, borderRadius: 8, padding: 30, textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}>
              <input id="csv-upload" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁</div>
              <div style={{ fontSize: 13, color: colors.text }}>{csvFile ? csvFile.name : 'Click to upload CSV'}</div>
            </div>
            {importPreview.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Preview ({csvData.length} rows)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['company_name','slug','saas_app_id','admin_name'].map(h => <th key={h} style={{ padding: '6px 8px', background: colors.bg, color: colors.textMuted, textAlign: 'left', border: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{importPreview.map((r, i) => <tr key={i}>{['company_name','slug','saas_app_id','admin_name'].map(k => <td key={k} style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, color: colors.text }}>{r[k]}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => { setOpenBulkImportDialog(false); setCsvFile(null); setCsvData([]); setImportPreview([]); }}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: csvData.length === 0 || importing ? 0.6 : 1 }} disabled={csvData.length === 0 || importing} onClick={handleBulkImport}>{importing ? 'Importing...' : `Import ${csvData.length} Tenants`}</button>
            </div>
          </>) : (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[['Total', importResults.total, colors.primary], ['Success', importResults.success?.length, colors.success], ['Failed', importResults.failed?.length, colors.danger]].map(([l, v, c]) => (
                  <div key={l} style={{ flex: 1, background: colors.bg, borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btnPrimary} onClick={() => { setOpenBulkImportDialog(false); setCsvFile(null); setCsvData([]); setImportPreview([]); setImportResults(null); }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    {/* Delete User Dialog */}
    {openDeleteUserDialog && (
      <div style={modalStyle} onClick={() => setOpenDeleteUserDialog(false)}>
        <div style={{ ...boxStyle, width: 380 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete User</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Are you sure you want to delete <strong>{deletingUser?.first_name} {deletingUser?.last_name}</strong> ({deletingUser?.email})? This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={btnSecondary} onClick={() => setOpenDeleteUserDialog(false)}>Cancel</button>
            <button style={{ ...btnPrimary, background: colors.danger }} onClick={handleDeleteUser}>Delete</button>
          </div>
        </div>
      </div>
    )}

    {/* SaaS Features Dialog */}
    {viewingFeatures && (
      <div style={modalStyle} onClick={() => setViewingFeatures(null)}>
        <div style={{ ...boxStyle, width: 480 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>⚙ Features - {viewingFeatures.name}</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Control what features this SaaS app can use</div>
          {[['email','Email'],['chat','Team Chat'],['drive','Drive Storage'],['video','Video Conferencing'],['notifications','Notifications'],['whatsapp','WhatsApp'],['custom_domain','Custom Domain']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
              <div onClick={async () => {
                const current = featuresForm[key] ?? false;
                const newVal = !current;
                setFeaturesForm(f => ({ ...f, [key]: newVal }));
                await fetch(`${API}/saas-apps/${viewingFeatures.id}/features`, {
                  method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...featuresForm, [key]: newVal })
                });
              }} style={{ width: 44, height: 24, borderRadius: 12, background: featuresForm[key] ? colors.success : colors.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: featuresForm[key] ? 23 : 3, transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={btnPrimary} onClick={() => setViewingFeatures(null)}>Done</button>
          </div>
        </div>
      </div>
    )}
  </>);

  const TemplatesSection = () => {
    const [templates, setTemplates] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [form, setForm] = useState({ name: '', subject: '', body: '', category: 'general' });

    const fetchTemplates = () => fetch(`${API}/email/templates`, { headers: authHeaders })
      .then(r => r.json()).then(d => { if (d.success) setTemplates(d.data); });
    useEffect(() => { fetchTemplates(); }, []);

    const categories = ['general', 'onboarding', 'notification', 'marketing', 'security', 'meetings'];
    const catColors = { general: colors.primaryLight, onboarding: colors.successLight, notification: colors.cyanLight, marketing: colors.warningLight, security: colors.dangerLight, meetings: colors.purpleLight };
    const catTextColors = { general: colors.primary, onboarding: colors.success, notification: colors.cyan, marketing: colors.warning, security: colors.danger, meetings: colors.purple };

    const save = async () => {
      if (!form.name || !form.subject || !form.body) return alert('All fields required');
      const url = editingTemplate ? `${API}/email/templates/${editingTemplate.id}` : `${API}/email/templates`;
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setForm({ name: '', subject: '', body: '', category: 'general' }); setEditingTemplate(null); setShowPreview(false); fetchTemplates(); }
      else alert(data.error);
    };

    const del = async () => {
      const res = await fetch(`${API}/email/templates/${deletingTemplate.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDeletingTemplate(null); fetchTemplates(); }
    };

    const filtered = categoryFilter ? templates.filter(t => t.category === categoryFilter) : templates;
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Email Templates</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{templates.length} templates</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { setEditingTemplate(null); setForm({ name: '', subject: '', body: '', category: 'general' }); setShowPreview(false); setOpenDialog(true); }}
              style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ New Template</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((t, i) => (
            <div key={t.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{t.name}</div>
                  {t.is_system && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>SYSTEM</span>}
                </div>
                <span style={{ background: catColors[t.category] || colors.primaryLight, color: catTextColors[t.category] || colors.primary, borderRadius: 20, padding: '2px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>{t.category}</span>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>{t.subject}</div>
              {t.is_system && t.variables && (
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 6, fontFamily: 'monospace' }}>Variables: {t.variables}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditingTemplate(t); setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category }); setShowPreview(false); setOpenDialog(true); }}
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                <button onClick={() => { setActiveSection('compose'); }}
                  style={{ background: colors.primaryLight, color: colors.primary, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>📤 Use</button>
                <button onClick={() => del(t.id)} disabled={t.is_system}
                  style={{ background: t.is_system ? colors.bg : colors.dangerLight, color: t.is_system ? colors.textMuted : colors.danger, border: t.is_system ? `1px solid ${colors.border}` : 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: t.is_system ? 'not-allowed' : 'pointer', opacity: t.is_system ? 0.5 : 1 }} title={t.is_system ? 'System templates cannot be deleted' : 'Delete'}>🗑</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: colors.textMuted, fontSize: 13 }}>No templates found</div>}
        </div>

        {/* Edit/Create Dialog */}
        {openDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 900, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>{editingTemplate ? 'Edit Template' : 'New Template'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left: Form */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Name *</label>
                  <input style={inputS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Email" />
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Subject *</label>
                  <input style={inputS} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" />
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Category</label>
                  <select style={inputS} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Body (HTML) *</label>
                  <textarea style={{ ...inputS, height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="<h2>Hello {{name}}!</h2><p>Your message here...</p>" />
                </div>
                {/* Right: Preview */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Preview</label>
                    <button onClick={() => setShowPreview(!showPreview)}
                      style={{ background: showPreview ? colors.primaryLight : colors.bg, color: showPreview ? colors.primary : colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                      {showPreview ? '👁 HTML' : '👁 Rendered'}
                    </button>
                  </div>
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, minHeight: 320, background: colors.bg, overflowY: 'auto' }}>
                    {form.body ? (
                      showPreview
                        ? <pre style={{ fontSize: 11, fontFamily: 'monospace', color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{form.body}</pre>
                        : <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: form.body }} />
                    ) : (
                      <div style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 60 }}>Start typing body to see preview</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={save}>Save Template</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deletingTemplate && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeletingTemplate(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 380 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete Template</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Are you sure you want to delete <strong>{deletingTemplate.name}</strong>? This cannot be undone.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeletingTemplate(null)}>Cancel</button>
                <button style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={del}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdminsSection = () => {
    const [admins, setAdmins] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [deletingAdmin, setDeletingAdmin] = useState(null);
    const [resetingAdmin, setResetingAdmin] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', role: 'admin' });
    const fetchAdmins = () => fetch(`${API}/admins`, { headers: authHeaders }).then(r => r.json()).then(d => { if (d.success) setAdmins(d.data); });
    useEffect(() => { fetchAdmins(); }, []);

    const create = async () => {
      if (!form.username || !form.email || !form.full_name || !form.password) return alert('All fields required');
      const res = await fetch(`${API}/admins`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setForm({ username: '', email: '', full_name: '', password: '', role: 'admin' }); fetchAdmins(); }
      else alert(data.error);
    };

    const update = async () => {
      const res = await fetch(`${API}/admins/${editingAdmin.id}`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: form.full_name, role: form.role, permissions: editingAdmin.permissions, assigned_tenants: editingAdmin.assigned_tenants, status: editingAdmin.status }) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setEditingAdmin(null); setForm({ username: '', email: '', full_name: '', password: '', role: 'admin' }); fetchAdmins(); }
      else alert(data.error);
    };

    const toggleStatus = async (admin) => {
      const newStatus = admin.status === 'active' ? 'suspended' : 'active';
      const res = await fetch(`${API}/admins/${admin.id}`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...admin, status: newStatus }) });
      const data = await res.json();
      if (data.success) fetchAdmins();
    };

    const deleteAdmin = async () => {
      const res = await fetch(`${API}/admins/${deletingAdmin.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDeletingAdmin(null); fetchAdmins(); }
      else alert(data.error);
    };

    const resetPassword = async () => {
      if (!newPassword) return alert('New password required');
      const res = await fetch(`${API}/admins/${resetingAdmin.id}/reset-password`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: newPassword }) });
      const data = await res.json();
      if (data.success) { setResetingAdmin(null); setNewPassword(''); alert('Password reset successfully!'); }
      else alert(data.error);
    };

    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Platform Admins</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>SSGzone employee accounts</div>
          </div>
          <button onClick={() => { setEditingAdmin(null); setForm({ username: '', email: '', full_name: '', password: '', role: 'admin' }); setOpenDialog(true); }} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Admin</button>
        </div>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Name', 'Username', 'Email', 'Role', 'Last Login', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>{a.full_name}</td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{a.username}</td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{a.email}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: colors.primaryLight, color: colors.primary, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{a.role}</span></td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{a.last_login ? new Date(a.last_login).toLocaleDateString() : 'Never'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: a.status === 'active' ? colors.successLight : colors.dangerLight, color: a.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{a.status}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingAdmin(a); setForm({ username: a.username, email: a.email, full_name: a.full_name, password: '', role: a.role }); setOpenDialog(true); }}
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                      <button onClick={() => toggleStatus(a)}
                        style={{ background: a.status === 'active' ? colors.warningLight : colors.successLight, color: a.status === 'active' ? colors.warning : colors.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                        {a.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                      </button>
                      <button onClick={() => { setResetingAdmin(a); setNewPassword(''); }}
                        style={{ background: colors.cyanLight, color: colors.cyan, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🔑 Reset</button>
                      <button onClick={() => setDeletingAdmin(a)}
                        style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No admins found</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Dialog */}
        {openDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>{editingAdmin ? 'Edit Admin' : 'Add Platform Admin'}</div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Full Name *</label>
              <input style={inputS} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
              {!editingAdmin && (<>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Username *</label>
                <input style={inputS} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="john" />
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Email *</label>
                <input type="email" style={inputS} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@ssgzone.in" />
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Password *</label>
                <input type="password" style={inputS} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </>)}
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Role</label>
              <select style={inputS} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="saas_admin">SaaS Admin</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={editingAdmin ? update : create}>{editingAdmin ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Dialog */}
        {resetingAdmin && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setResetingAdmin(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Reset Password</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{resetingAdmin.full_name} ({resetingAdmin.username})</div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>New Password *</label>
              <input type="password" style={inputS} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setResetingAdmin(null)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={resetPassword}>Reset Password</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deletingAdmin && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeletingAdmin(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 380 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete Admin</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Are you sure you want to delete <strong>{deletingAdmin.full_name}</strong>? This cannot be undone.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeletingAdmin(null)}>Cancel</button>
                <button style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={deleteAdmin}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MailboxSection = () => {
    const [mailboxTab, setMailboxTab] = useState('mailboxes');
    const [mailboxes, setMailboxes] = useState([]);
    const [total, setTotal] = useState(0);
    const [domain, setDomain] = useState('');
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingMailbox, setEditingMailbox] = useState(null);
    const [validDomains, setValidDomains] = useState([]);
    const [resetingMailbox, setResetingMailbox] = useState(null);
    const [newMailboxPassword, setNewMailboxPassword] = useState('');
    const [form, setForm] = useState({ username: '', domain: 'ssgzone.in', password: '', first_name: '', last_name: '', quota: 1024 });
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', quota: 1024 });

    // Alias state
    const [aliases, setAliases] = useState([]);
    const [aliasForm, setAliasForm] = useState({ address: '', forwarding: '', domain: '' });
    const [openAliasDialog, setOpenAliasDialog] = useState(false);

    const fetchAliases = (d) => {
      const params = new URLSearchParams();
      if (d || domain) params.append('domain', d || domain);
      fetch(`${API}/mailbox/aliases?${params}`, { headers: authHeaders })
        .then(r => r.json()).then(d => { if (d.success) setAliases(d.data); });
    };

    const createAlias = async () => {
      if (!aliasForm.address || !aliasForm.forwarding || !aliasForm.domain) return alert('All fields required');
      const fullAddress = `${aliasForm.address}@${aliasForm.domain}`;
      const res = await fetch(`${API}/mailbox/aliases`, {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress, forwarding: aliasForm.forwarding, domain: aliasForm.domain })
      });
      const data = await res.json();
      if (data.success) { setOpenAliasDialog(false); setAliasForm({ address: '', forwarding: '', domain: '' }); fetchAliases(); }
      else alert(data.error);
    };

    const deleteAlias = async (id) => {
      if (!window.confirm('Delete this alias?')) return;
      const res = await fetch(`${API}/mailbox/aliases/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) fetchAliases();
      else alert(data.error);
    };

    useEffect(() => {
      fetch(`${API}/mailbox/domains`, { headers: authHeaders })
        .then(r => r.json()).then(d => { if (d.success) setValidDomains(d.data); });
    }, []);

    const fetchMailboxes = () => {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      fetch(`${API}/mailbox/list?${params}`, { headers: authHeaders })
        .then(r => r.json()).then(d => { if (d.success) { setMailboxes(d.data); setTotal(d.total); } });
    };
    useEffect(() => { fetchMailboxes(); fetchAliases(); }, [domain]);

    const filteredMailboxes = search
      ? mailboxes.filter(m => m.username.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()))
      : mailboxes;

    const deleteMailboxPermanent = async (m) => {
      if (!window.confirm(`Permanently delete ${m.username}? This cannot be undone.`)) return;
      const res = await fetch(`${API}/mailbox/permanent/${encodeURIComponent(m.username)}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setEditingMailbox(null); fetchMailboxes(); }
      else alert(data.error);
    };

    const updateMailbox = async () => {
      const res = await fetch(`${API}/mailbox/${encodeURIComponent(editingMailbox.username)}`, {
        method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) { setEditingMailbox(null); fetchMailboxes(); }
      else alert(data.error);
    };

    const create = async () => {
      if (!form.username || !form.password) return alert('Username and password required');
      try {
        const res = await fetch(`${API}/mailbox/create`, {
          method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (data.success) { setOpenDialog(false); setForm({ username: '', domain: 'ssgzone.in', password: '', first_name: '', last_name: '', quota: 1024 }); fetchMailboxes(); alert(`Mailbox created: ${data.data.email}`); }
        else alert(data.error);
      } catch (e) { alert(e.message); }
    };

    const toggleActive = async (m) => {
      const newActive = m.active === 1 ? 0 : 1;
      const endpoint = newActive === 0 ? `${API}/mailbox/${encodeURIComponent(m.username)}` : null;
      if (newActive === 0) {
        if (!window.confirm(`Deactivate ${m.username}?`)) return;
        const res = await fetch(endpoint, { method: 'DELETE', headers: authHeaders });
        const data = await res.json();
        if (data.success) fetchMailboxes();
      } else {
        // Reactivate via reset password endpoint workaround — direct DB update via dedicated endpoint
        const res = await fetch(`${API}/mailbox/reactivate`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: m.username }) });
        const data = await res.json();
        if (data.success) fetchMailboxes();
        else alert(data.error || 'Reactivate failed');
      }
    };

    const resetMailboxPassword = async () => {
      if (!newMailboxPassword) return alert('New password required');
      const res = await fetch(`${API}/mailbox/reset-password`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetingMailbox.username, new_password: newMailboxPassword }) });
      const data = await res.json();
      if (data.success) { setResetingMailbox(null); setNewMailboxPassword(''); alert('Password updated!'); }
      else alert(data.error);
    };

    const formatQuota = (bytes) => {
      if (!bytes) return '0 MB';
      const mb = Math.round(bytes / 1048576);
      return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
    };

    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Mailboxes</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Total {total} mailboxes</div>
          </div>
          <button onClick={() => mailboxTab === 'mailboxes' ? setOpenDialog(true) : setOpenAliasDialog(true)} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{mailboxTab === 'mailboxes' ? '+ Create Mailbox' : '+ Create Alias'}</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          {[['mailboxes', '📬 Mailboxes'], ['aliases', '↪ Aliases']].map(([key, label]) => (
            <button key={key} onClick={() => setMailboxTab(key)}
              style={{ padding: '8px 16px', border: 'none', borderBottom: mailboxTab === key ? `2px solid ${colors.primary}` : '2px solid transparent', background: 'transparent', color: mailboxTab === key ? colors.primary : colors.textMuted, fontWeight: mailboxTab === key ? 600 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name..."
            style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', boxSizing: 'border-box' }} />
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Filter by domain (e.g. ssgzone.in)"
            style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {mailboxTab === 'mailboxes' && (<>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Email', 'Name', 'Domain', 'Quota', 'Status', 'Created', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredMailboxes.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>{m.username}</td>
                  <td style={{ padding: '12px 16px', color: colors.text }}>{m.name}</td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{m.domain}</td>
                  <td style={{ padding: '12px 16px', color: colors.text }}>{formatQuota(m.quota)}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: m.active === 1 ? colors.successLight : colors.dangerLight, color: m.active === 1 ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{m.active === 1 ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{new Date(m.created).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingMailbox(m); setEditForm({ first_name: m.first_name || '', last_name: m.last_name || '', quota: Math.round(m.quota / 1048576) }); }}
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                      <button onClick={() => { setResetingMailbox(m); setNewMailboxPassword(''); }}
                        style={{ background: colors.cyanLight, color: colors.cyan, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🔑 Reset</button>
                      <button onClick={() => toggleActive(m)}
                        style={{ background: m.active === 1 ? colors.dangerLight : colors.successLight, color: m.active === 1 ? colors.danger : colors.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                        {m.active === 1 ? '🗑 Deactivate' : '▶ Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMailboxes.length === 0 && <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No mailboxes found</td></tr>}
            </tbody>
          </table>
        </div>
        </>)}

        {mailboxTab === 'aliases' && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                {['Alias Address', 'Forwards To', 'Domain', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {aliases.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>{a.address}</td>
                    <td style={{ padding: '12px 16px', color: colors.cyan, fontFamily: 'monospace', fontSize: 12 }}>→ {a.forwarding}</td>
                    <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{a.domain}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: a.active === 1 ? colors.successLight : colors.dangerLight, color: a.active === 1 ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{a.active === 1 ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => deleteAlias(a.id)} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
                {aliases.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No aliases found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Dialog */}
        {openDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Create Mailbox</div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Username *</label>
              <input style={inputS} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="pradeep" />
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Domain *</label>
              <select style={inputS} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}>
                {validDomains.map(d => <option key={d} value={d}>{d}</option>)}
                {validDomains.length === 0 && <option value="ssgzone.in">ssgzone.in</option>}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>First Name</label>
                  <input style={inputS} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Pradeep" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Last Name</label>
                  <input style={inputS} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Singh" />
                </div>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Password *</label>
              <input type="password" style={inputS} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Quota</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <select style={{ ...inputS, marginBottom: 0, flex: 1 }} value={form.quota} onChange={e => setForm({ ...form, quota: parseInt(e.target.value) })}>
                  <option value={512}>512 MB</option>
                  <option value={1024}>1 GB</option>
                  <option value={2048}>2 GB</option>
                  <option value={5120}>5 GB</option>
                  <option value={10240}>10 GB</option>
                  <option value={20480}>20 GB</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={create}>Create</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Alias Dialog */}
        {openAliasDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenAliasDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>↪ Create Alias</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Alias forwards all mail to another mailbox</div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Domain *</label>
              <select style={inputS} value={aliasForm.domain} onChange={e => setAliasForm({ ...aliasForm, domain: e.target.value })}>
                <option value="">Select Domain</option>
                {validDomains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Alias Username *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input style={{ ...inputS, marginBottom: 0, flex: 1 }} value={aliasForm.address} onChange={e => setAliasForm({ ...aliasForm, address: e.target.value })} placeholder="e.g. contact" />
                <span style={{ color: colors.textMuted, fontSize: 13 }}>@{aliasForm.domain || 'domain'}</span>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Forwards To (full email) *</label>
              <input style={inputS} value={aliasForm.forwarding} onChange={e => setAliasForm({ ...aliasForm, forwarding: e.target.value })} placeholder="e.g. info@allthetruth.in" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenAliasDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={createAlias}>Create Alias</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Dialog - Mailbox */}
        {resetingMailbox && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setResetingMailbox(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Reset Mailbox Password</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{resetingMailbox.username}</div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>New Password *</label>
              <input type="password" style={inputS} value={newMailboxPassword} onChange={e => setNewMailboxPassword(e.target.value)} placeholder="Enter new password" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setResetingMailbox(null)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={resetMailboxPassword}>Reset Password</button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Mailbox Dialog */}
        {editingMailbox && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingMailbox(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 420 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Edit Mailbox</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{editingMailbox.username}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>First Name</label><input style={inputS} value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Last Name</label><input style={inputS} value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Quota</label>
              <select style={inputS} value={editForm.quota} onChange={e => setEditForm({ ...editForm, quota: parseInt(e.target.value) })}>
                {[512, 1024, 2048, 5120, 10240, 20480].map(q => <option key={q} value={q}>{q >= 1024 ? `${q/1024} GB` : `${q} MB`}</option>)}
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => deleteMailboxPermanent(editingMailbox)}>🗑 Delete Permanently</button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setEditingMailbox(null)}>Cancel</button>
                  <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={updateMailbox}>Update</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const EmailSection = () => {
    const [emails, setEmails] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
      { key: 'all', label: 'All' },
      { key: 'manual', label: 'Manual' },
      { key: 'auto', label: 'Transactional' },
      { key: 'broadcast', label: 'Broadcast' },
      { key: 'failed', label: 'Failed' },
    ];

    useEffect(() => {
      const q = new URLSearchParams({ limit: 50 });
      if (search) q.append('search', search);
      if (activeTab === 'failed') q.append('status', 'failed');
      else if (activeTab !== 'all') q.append('email_type', activeTab);
      fetch(`${API}/email/sent?${q}`, { headers: authHeaders })
        .then(r => r.json()).then(d => { if (d.success) { setEmails(d.data); setTotal(d.total); } });
    }, [search, activeTab]);

    const typeColors = {
      manual: { bg: colors.primaryLight, color: colors.primary },
      auto: { bg: colors.purpleLight, color: colors.purple },
      broadcast: { bg: colors.warningLight, color: colors.warning },
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Sent Emails</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Total {total} emails</div>
          </div>
          <button onClick={() => setActiveSection('compose')} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Compose</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${colors.border}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); }}
              style={{ padding: '8px 16px', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${colors.primary}` : '2px solid transparent', background: 'transparent', color: activeTab === t.key ? colors.primary : colors.textMuted, fontWeight: activeTab === t.key ? 600 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or subject..." style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['To', 'Subject', 'Tenant', 'Type', 'Status', 'Sent At'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px', color: colors.text }}>{e.recipient_name ? `${e.recipient_name} <${e.recipient_email}>` : e.recipient_email}</td>
                  <td style={{ padding: '12px 16px', color: colors.text }}>{e.subject}</td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{e.tenant_name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: typeColors[e.email_type]?.bg || colors.primaryLight, color: typeColors[e.email_type]?.color || colors.primary, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.email_type || 'manual'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: e.status === 'sent' ? colors.successLight : colors.dangerLight, color: e.status === 'sent' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.status}</span></td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{new Date(e.sent_at).toLocaleString()}</td>
                </tr>
              ))}
              {emails.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No emails found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  const ComposeSection = () => {
    const [mode, setMode] = useState('single'); // 'single' | 'broadcast'
    const [form, setForm] = useState({ to_email: '', to_name: '', subject: '', body: '', tenant_id: '' });
    const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '', target: 'tenants' });
    const [sending, setSending] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
      fetch(`${API}/email/templates`, { headers: authHeaders }).then(r => r.json()).then(d => { if (d.success) setTemplates(d.data); });
    }, []);

    const handleTemplateSelect = (templateId) => {
      setSelectedTemplate(templateId);
      const t = templates.find(t => t.id === templateId);
      if (t) {
        if (mode === 'single') setForm(f => ({ ...f, subject: t.subject, body: t.body }));
        else setBroadcastForm(f => ({ ...f, subject: t.subject, body: t.body }));
      }
    };

    const send = async () => {
      if (!form.to_email || !form.subject || !form.body) return alert('To Email, Subject and Body required');
      setSending(true);
      try {
        const res = await fetch(`${API}/email/send`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (data.success) { alert('✅ Email sent successfully!'); setForm({ to_email: '', to_name: '', subject: '', body: '', tenant_id: '' }); setSelectedTemplate(''); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSending(false);
    };

    const sendBroadcast = async () => {
      if (!broadcastForm.subject || !broadcastForm.body) return alert('Subject and Body required');
      if (!window.confirm(`Send broadcast to all ${broadcastForm.target}? This cannot be undone.`)) return;
      setSending(true);
      try {
        const res = await fetch(`${API}/email/broadcast`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(broadcastForm) });
        const data = await res.json();
        if (data.success) { alert(`✅ Broadcast complete!\nSent: ${data.sent}\nFailed: ${data.failed}\nTotal: ${data.total}`); setBroadcastForm({ subject: '', body: '', target: 'tenants' }); setSelectedTemplate(''); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSending(false);
    };

    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    const currentBody = mode === 'single' ? form.body : broadcastForm.body;

    return (
      <div style={{ maxWidth: 800 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Compose Email</div>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Send email via Amazon SES</div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['single', '✉ Single Email'], ['broadcast', '📢 Broadcast']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setSelectedTemplate(''); }}
              style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${mode === m ? colors.primary : colors.border}`, background: mode === m ? colors.primary : colors.card, color: mode === m ? '#fff' : colors.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Form */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
            {/* Template selector - common for both modes */}
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Use Template</label>
            <select style={inputS} value={selectedTemplate} onChange={e => handleTemplateSelect(e.target.value)}>
              <option value="">— Select Template —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {mode === 'single' ? (<>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>To Email *</label><input style={inputS} value={form.to_email} onChange={e => setForm({ ...form, to_email: e.target.value })} placeholder="recipient@example.com" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>To Name</label><input style={inputS} value={form.to_name} onChange={e => setForm({ ...form, to_name: e.target.value })} placeholder="Recipient Name" /></div>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Tenant (optional)</label>
              <select style={inputS} value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                <option value="">Select Tenant</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
              </select>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Subject *</label>
              <input style={inputS} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" />
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Body (HTML) *</label>
              <textarea style={{ ...inputS, height: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="<h2>Hello!</h2><p>Your message here...</p>" />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={send} disabled={sending} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending...' : '📤 Send Email'}</button>
                <button onClick={() => setActiveSection('email')} style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>View Sent</button>
              </div>
            </>) : (<>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Send To *</label>
              <select style={inputS} value={broadcastForm.target} onChange={e => setBroadcastForm({ ...broadcastForm, target: e.target.value })}>
                <option value="tenants">All Tenant Admins</option>
                <option value="users">All Users</option>
              </select>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Subject *</label>
              <input style={inputS} value={broadcastForm.subject} onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })} placeholder="Broadcast subject" />
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Body (HTML) *</label>
              <textarea style={{ ...inputS, height: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} value={broadcastForm.body} onChange={e => setBroadcastForm({ ...broadcastForm, body: e.target.value })} placeholder="<h2>Hello!</h2><p>Your message here...</p>" />
              <div style={{ background: colors.warningLight, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: colors.warning }}>⚠ This will send email to ALL {broadcastForm.target === 'tenants' ? 'tenant admins' : 'users'}. Cannot be undone.</div>
              <button onClick={sendBroadcast} disabled={sending} style={{ background: colors.warning, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending...' : '📢 Send Broadcast'}</button>
            </>)}
          </div>

          {/* Right: Preview */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Preview</div>
              <button onClick={() => setShowPreview(!showPreview)}
                style={{ background: showPreview ? colors.primaryLight : colors.bg, color: showPreview ? colors.primary : colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>
                {showPreview ? '👁 HTML' : '👁 Rendered'}
              </button>
            </div>
            {currentBody ? (
              showPreview
                ? <div style={{ fontSize: 12, fontFamily: 'monospace', color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 400, overflowY: 'auto' }}>{currentBody}</div>
                : <div style={{ maxHeight: 400, overflowY: 'auto', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: currentBody }} />
            ) : (
              <div style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 60 }}>Start typing body to see preview</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SettingsSection = () => {
    const [settingsTab, setSettingsTab] = useState('branding');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
      platform_name: branding.platform_name || 'SSGzone',
      tagline: branding.tagline || 'Mail Platform',
      primary_color: branding.primary_color || '#4f46e5',
      secondary_color: branding.secondary_color || '#06b6d4',
      sidebar_color: branding.sidebar_color || '',
      header_color: branding.header_color || '',
      sidebar_text_color: branding.sidebar_text_color || '',
      header_text_color: branding.header_text_color || '',
      font_family: branding.font_family || '',
      font_size: branding.font_size || 'medium',
      from_name: branding.from_name || 'SSGzone',
      from_email: branding.from_email || 'noreply@ssgzone.in',
      email_footer: branding.email_footer || 'Powered by SSGzone',
      admin_alert_email: branding.admin_alert_email || '',
      default_max_users: branding.default_max_users || 100,
      default_mailbox_quota: branding.default_mailbox_quota || 1024,
      session_timeout: branding.session_timeout || 480,
      password_min_length: branding.password_min_length || 8,
    });
    const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

    useEffect(() => {
      setForm({
        platform_name: branding.platform_name || 'SSGzone',
        tagline: branding.tagline || 'Mail Platform',
        primary_color: branding.primary_color || '#4f46e5',
        secondary_color: branding.secondary_color || '#06b6d4',
        sidebar_color: branding.sidebar_color || '',
        header_color: branding.header_color || '',
        sidebar_text_color: branding.sidebar_text_color || '',
        header_text_color: branding.header_text_color || '',
        font_family: branding.font_family || '',
        font_size: branding.font_size || 'medium',
        from_name: branding.from_name || 'SSGzone',
        from_email: branding.from_email || 'noreply@ssgzone.in',
        email_footer: branding.email_footer || 'Powered by SSGzone',
        admin_alert_email: branding.admin_alert_email || '',
        default_max_users: branding.default_max_users || 100,
        default_mailbox_quota: branding.default_mailbox_quota || 1024,
        session_timeout: branding.session_timeout || 480,
        password_min_length: branding.password_min_length || 8,
      });
    }, [branding]);

    const saveSettings = async () => {
      setSaving(true);
      try {
        const res = await fetch(`${API}/branding`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (data.success) { setBranding({ ...branding, ...form }); alert('✅ Settings saved!'); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSaving(false);
    };

    const uploadLogo = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const formData = new FormData(); formData.append('logo', file);
      const res = await fetch(`${API}/branding/logo`, { method: 'POST', headers: authHeaders, body: formData });
      const data = await res.json();
      if (data.success) { setBranding({ ...branding, logo_url: data.data.logo_url }); alert('Logo uploaded!'); }
      else alert(data.error);
    };

    const uploadFavicon = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const formData = new FormData(); formData.append('favicon', file);
      const res = await fetch(`${API}/branding/favicon`, { method: 'POST', headers: authHeaders, body: formData });
      const data = await res.json();
      if (data.success) { setBranding({ ...branding, favicon_url: data.data.favicon_url }); alert('Favicon uploaded!'); }
      else alert(data.error);
    };

    const changePassword = async () => {
      if (!pwdForm.current_password || !pwdForm.new_password) return alert('All fields required');
      if (pwdForm.new_password !== pwdForm.confirm_password) return alert('New passwords do not match');
      if (pwdForm.new_password.length < 8) return alert('Password must be at least 8 characters');
      const res = await fetch(`${API}/profile/change-password`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }) });
      const data = await res.json();
      if (data.success) { alert('✅ Password changed!'); setPwdForm({ current_password: '', new_password: '', confirm_password: '' }); }
      else alert(data.error);
    };

    const tabs = [{ key: 'branding', label: '🎨 Branding' }, { key: 'email', label: '📧 Email' }, { key: 'limits', label: '⚙ Limits' }, { key: 'security', label: '🔐 Security' }, { key: 'profile', label: '👤 My Profile' }];
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    const labelS = { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' };

    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Settings</div>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Manage platform configuration</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setSettingsTab(t.key)}
              style={{ padding: '8px 16px', border: 'none', borderBottom: settingsTab === t.key ? `2px solid ${colors.primary}` : '2px solid transparent', background: 'transparent', color: settingsTab === t.key ? colors.primary : colors.textMuted, fontWeight: settingsTab === t.key ? 600 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Branding Tab */}
        {settingsTab === 'branding' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Platform Identity</div>
              <label style={labelS}>Platform Name</label>
              <input style={inputS} value={form.platform_name} onChange={e => setForm({ ...form, platform_name: e.target.value })} />
              <label style={labelS}>Tagline (shown in sidebar)</label>
              <input style={inputS} value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Mail Platform" />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Primary Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Secondary Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Sidebar Color <span style={{ fontSize: 10, color: colors.textMuted }}>(leave blank for default)</span></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.sidebar_color || '#ffffff'} onChange={e => setForm({ ...form, sidebar_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.sidebar_color} onChange={e => setForm({ ...form, sidebar_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} placeholder="#ffffff or blank for default" />
                    {form.sidebar_color && <button onClick={() => setForm({ ...form, sidebar_color: '' })} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Header Color <span style={{ fontSize: 10, color: colors.textMuted }}>(leave blank for default)</span></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.header_color || '#ffffff'} onChange={e => setForm({ ...form, header_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.header_color} onChange={e => setForm({ ...form, header_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} placeholder="#ffffff or blank for default" />
                    {form.header_color && <button onClick={() => setForm({ ...form, header_color: '' })} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Sidebar Text Color <span style={{ fontSize: 10, color: colors.textMuted }}>(blank = auto)</span></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.sidebar_text_color || '#1e293b'} onChange={e => setForm({ ...form, sidebar_text_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.sidebar_text_color} onChange={e => setForm({ ...form, sidebar_text_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} placeholder="#1e293b or blank" />
                    {form.sidebar_text_color && <button onClick={() => setForm({ ...form, sidebar_text_color: '' })} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Header Text Color <span style={{ fontSize: 10, color: colors.textMuted }}>(blank = auto)</span></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <input type="color" value={form.header_text_color || '#1e293b'} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                    <input value={form.header_text_color} onChange={e => setForm({ ...form, header_text_color: e.target.value })} style={{ ...inputS, marginBottom: 0, flex: 1 }} placeholder="#1e293b or blank" />
                    {form.header_text_color && <button onClick={() => setForm({ ...form, header_text_color: '' })} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Font Family</label>
                  <select style={inputS} value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })}>
                    <option value="">Default (Inter)</option>
                    <option value="poppins">Poppins</option>
                    <option value="roboto">Roboto</option>
                    <option value="opensans">Open Sans</option>
                    <option value="lato">Lato</option>
                    <option value="nunito">Nunito</option>
                    <option value="georgia">Georgia (Serif)</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Font Size</label>
                  <select style={inputS} value={form.font_size} onChange={e => setForm({ ...form, font_size: e.target.value })}>
                    <option value="small">Small (12px)</option>
                    <option value="medium">Medium (14px) — Default</option>
                    <option value="large">Large (16px)</option>
                  </select>
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Logo & Favicon</div>
              <label style={labelS}>Platform Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                {branding.logo_url
                  ? <img src={branding.logo_url} alt="logo" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'contain', border: `1px solid ${colors.border}` }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 10, background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✉</div>
                }
                <label style={{ background: colors.primary, color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Upload Logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                </label>
              </div>
              <label style={labelS}>Favicon</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {branding.favicon_url
                  ? <img src={branding.favicon_url} alt="favicon" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', border: `1px solid ${colors.border}` }} />
                  : <div style={{ width: 32, height: 32, borderRadius: 6, background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌐</div>
                }
                <label style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
                  Upload Favicon
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFavicon} />
                </label>
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>Recommended: 32x32px ICO or PNG</div>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {settingsTab === 'email' && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Email Configuration</div>
            <div style={{ background: colors.warningLight, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: colors.warning }}>⚠ These settings affect all outgoing emails from the platform.</div>
            <label style={labelS}>From Name</label>
            <input style={inputS} value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} placeholder="SSGzone" />
            <label style={labelS}>From Email</label>
            <input style={inputS} value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@ssgzone.in" />
            <label style={labelS}>Email Footer Text</label>
            <textarea style={{ ...inputS, height: 80, resize: 'vertical' }} value={form.email_footer} onChange={e => setForm({ ...form, email_footer: e.target.value })} placeholder="Powered by SSGzone" />
            <label style={labelS}>Admin Alert Email (system notifications)</label>
            <input style={inputS} value={form.admin_alert_email} onChange={e => setForm({ ...form, admin_alert_email: e.target.value })} placeholder="admin@ssgzone.in" />
            <button onClick={saveSettings} disabled={saving} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        )}

        {/* Limits Tab */}
        {settingsTab === 'limits' && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Platform Defaults</div>
            <label style={labelS}>Default Max Users per Tenant</label>
            <input type="number" style={inputS} value={form.default_max_users} onChange={e => setForm({ ...form, default_max_users: parseInt(e.target.value) })} />
            <label style={labelS}>Default Mailbox Quota (MB)</label>
            <select style={inputS} value={form.default_mailbox_quota} onChange={e => setForm({ ...form, default_mailbox_quota: parseInt(e.target.value) })}>
              {[512, 1024, 2048, 5120, 10240].map(q => <option key={q} value={q}>{q >= 1024 ? `${q/1024} GB` : `${q} MB`}</option>)}
            </select>
            <button onClick={saveSettings} disabled={saving} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {settingsTab === 'security' && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Security Settings</div>
            <label style={labelS}>Session Timeout (minutes)</label>
            <select style={inputS} value={form.session_timeout} onChange={e => setForm({ ...form, session_timeout: parseInt(e.target.value) })}>
              {[60, 120, 240, 480, 720, 1440].map(t => <option key={t} value={t}>{t >= 60 ? `${t/60} hour${t > 60 ? 's' : ''}` : `${t} min`}</option>)}
            </select>
            <label style={labelS}>Minimum Password Length</label>
            <select style={inputS} value={form.password_min_length} onChange={e => setForm({ ...form, password_min_length: parseInt(e.target.value) })}>
              {[6, 8, 10, 12, 16].map(l => <option key={l} value={l}>{l} characters</option>)}
            </select>
            <button onClick={saveSettings} disabled={saving} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}

        {/* Profile Tab */}
        {settingsTab === 'profile' && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, maxWidth: 500 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Change Password</div>
            <label style={labelS}>Current Password</label>
            <input type="password" style={inputS} value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} />
            <label style={labelS}>New Password</label>
            <input type="password" style={inputS} value={pwdForm.new_password} onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })} />
            <label style={labelS}>Confirm New Password</label>
            <input type="password" style={inputS} value={pwdForm.confirm_password} onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })} />
            <button onClick={changePassword} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Change Password
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>Welcome back, Super Admin! 👋</div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Here's what's happening with your mail platform today.</div>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px' }}>
                📅 May 16 - May 22, 2026
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              <EnhancedMetricCard title="Emails Sent" value={12453} icon="✉️" trend="vs last 7 days" trendPercent={12.5} bgColor="#eef2ff" borderColor="#667eea" />
              <EnhancedMetricCard title="Delivery Rate" value={98.7} icon="📤" trend="vs last 7 days" trendPercent={2.3} bgColor="#d1fae5" borderColor="#10b981" />
              <EnhancedMetricCard title="Active Tenants" value={24} icon="🏢" trend="Real-time" trendPercent={14.3} bgColor="#cffafe" borderColor="#06b6d4" />
              <EnhancedMetricCard title="Total Users" value={1245} icon="👥" trend="Real-time" trendPercent={8.7} bgColor="#fef3c7" borderColor="#f59e0b" />
              <EnhancedMetricCard title="Emails Today" value={2345} icon="📧" trend="vs yesterday" trendPercent={-8.1} bgColor="#ede9fe" borderColor="#8b5cf6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <EmailOverview stats={{ sent: 12453, received: 12278, failed: 6521, bounced: 1245, spam: 175, deliveryRate: 98.5, chartData: [{ sent: 2000, received: 1800, failed: 100 }, { sent: 2100, received: 1900, failed: 120 }, { sent: 1900, received: 1700, failed: 90 }, { sent: 2200, received: 2000, failed: 130 }, { sent: 2300, received: 2100, failed: 140 }, { sent: 2150, received: 1950, failed: 110 }, { sent: 2400, received: 2200, failed: 150 }] }} />
              <EmailHealthMetrics stats={{ uptime: 99.9, avgDeliveryTime: 1.2, spamScore: 0.8, dkimStatus: 'verified', spfStatus: 'verified', dmarcStatus: 'verified' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <SystemActivity activities={[{ type: 'email_sent', title: 'Bulk Email Campaign', description: 'Sent to 500 users', timestamp: new Date(Date.now() - 5*60000) }, { type: 'user_created', title: 'New User Created', description: 'pradeep.singh@nabc.lms.ssgzone.in', timestamp: new Date(Date.now() - 15*60000) }, { type: 'tenant_created', title: 'New Tenant', description: 'NABC Institute', timestamp: new Date(Date.now() - 30*60000) }, { type: 'settings_changed', title: 'Settings Updated', description: 'Branding configuration changed', timestamp: new Date(Date.now() - 60*60000) }, { type: 'login', title: 'Admin Login', description: 'Super Admin logged in', timestamp: new Date(Date.now() - 120*60000) }]} />
              <StorageUsage stats={{ used: 320.8, total: 1000, percentage: 32, breakdown: { emails: 300, attachments: 12, backups: 3, other: 0.2 } }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div>
                <TopTenants />
                <RecentUsers />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </div>
        );
      case 'applications': return <ApplicationsSection />;
      case 'tenants': return <TenantsSection />;
      case 'users': return <UsersSection />;
      case 'email': return <EmailSection />;
      case 'compose': return <ComposeSection />;
      case 'templates': return <TemplatesSection />;
      case 'admins': return <AdminsSection />;
      case 'settings': return <SettingsSection />;
      case 'mailboxes': return <MailboxSection />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: colors.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Coming Soon</div>
            <div style={{ fontSize: 13 }}>This section is under development</div>
          </div>
        );
    }
  };

  const fontFamilyMap = {
    'poppins': "'Poppins', sans-serif",
    'roboto': "'Roboto', sans-serif",
    'opensans': "'Open Sans', sans-serif",
    'lato': "'Lato', sans-serif",
    'nunito': "'Nunito', sans-serif",
    'georgia': "Georgia, serif",
    'monospace': "monospace",
  };
  const googleFontUrls = {
    'poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    'roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'opensans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
    'lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
    'nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
  };
  const fontSizeMap = { small: '12px', medium: '14px', large: '16px' };

  useEffect(() => {
    const fontFamily = fontFamilyMap[branding.font_family] || '"Inter", "Roboto", sans-serif';
    const zoomMap = { small: 0.9, medium: 1, large: 1.12 };
    const zoom = zoomMap[branding.font_size] || 1;
    document.body.style.fontFamily = fontFamily;
    document.body.style.zoom = zoom;
    const url = googleFontUrls[branding.font_family];
    if (url) {
      let link = document.getElementById('pems-google-font');
      if (!link) { link = document.createElement('link'); link.id = 'pems-google-font'; link.rel = 'stylesheet'; document.head.appendChild(link); }
      link.href = url;
    }
    if (branding.favicon_url) {
      const faviconUrl = branding.favicon_url + '?v=' + Date.now();
      let favicon = document.querySelector("link[rel='icon']");
      let favicon2 = document.querySelector("link[rel='shortcut icon']");
      if (favicon) favicon.remove();
      if (favicon2) favicon2.remove();
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.type = 'image/x-icon';
      newFavicon.href = faviconUrl;
      document.head.appendChild(newFavicon);
    }
    if (branding.platform_name) document.title = branding.platform_name + ' - Super Admin';
  }, [branding.font_family, branding.font_size, branding.favicon_url, branding.platform_name]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ marginTop: 60, padding: 28, flex: 1 }}>
          {renderContent()}
        </div>
      </div>
      <Dialogs />
    </div>
  );
}

export default SuperAdminDashboard;
