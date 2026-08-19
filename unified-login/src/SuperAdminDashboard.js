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
  const [dnsModal, setDnsModal] = useState(null); // { domain, password, id }
  const [dnsCheck, setDnsCheck] = useState(null); // { checks, all_passed }
  const [dnsChecking, setDnsChecking] = useState(false);
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
  const [reports, setReports] = useState({ tickets: [], tenants: [] });
  const [analytics, setAnalytics] = useState({ stats: {}, tenants: [] });
  const [securityStats, setSecurityStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMsg, setAuditMsg] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilters, setAuditFilters] = useState({ action: '', tenant_id: '', actor_id: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const token = localStorage.getItem('super_admin_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const API = 'https://api.ssgzone.in/api/v1/super-admin';

  const csrfTokenRef = React.useRef(localStorage.getItem('csrf_token') || '');

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'X-CSRF-Token': csrfTokenRef.current };

  // apiFetch: always sends credentials (cookie) so CSRF double-submit works cross-origin
  const apiFetch = (url, opts = {}) => {
    const headers = { 'Authorization': `Bearer ${token}`, 'X-CSRF-Token': csrfTokenRef.current, ...(opts.headers || {}) };
    return fetch(url, { credentials: 'include', ...opts, headers });
  };

  useEffect(() => {
    // Fetch CSRF token on mount
    apiFetch('https://api.ssgzone.in/api/v1/auth/csrf-token', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.csrf_token) { csrfTokenRef.current = d.csrf_token; localStorage.setItem('csrf_token', d.csrf_token); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll(); fetchBranding();
    const t = localStorage.getItem('super_admin_token');
    if (t) apiFetch('https://api.ssgzone.in/api/v1/notifications/unread-count', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => { if (d.success) setNotifCount(d.data?.count || 0); }).catch(() => {});
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await apiFetch(`${API}/branding`);
      const data = await res.json();
      if (data.success) setBranding(data.data);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (activeSection === 'users') fetchUsers(); }, [activeSection, usersPage, usersSearch, usersTenantFilter, usersSaasFilter, usersStatusFilter]);

  useEffect(() => {
    (async () => {
      if (activeSection === 'reports') {
        const [tr, tn] = await Promise.all([
          apiFetch(`${API}/support-tickets`, { headers: authHeaders }).then(r => r.json()),
          apiFetch(`${API}/tenants`, { headers: authHeaders }).then(r => r.json()),
        ]);
        setReports({ tickets: tr.data || [], tenants: tn.data || [] });
      } else if (activeSection === 'analytics') {
        const [st, tn] = await Promise.all([
          apiFetch(`${API}/dashboard/stats`, { headers: authHeaders }).then(r => r.json()),
          apiFetch(`${API}/tenants`, { headers: authHeaders }).then(r => r.json()),
        ]);
        setAnalytics({ stats: st.data || {}, tenants: (tn.data || []).slice(0, 10) });
      } else if (activeSection === 'security') {
        const [sec, br] = await Promise.all([
          apiFetch(`${API}/security/stats`, { headers: authHeaders }).then(r => r.json()),
          apiFetch(`${API}/branding`).then(r => r.json()),
        ]);
        setSecurityStats({ ...(sec.data || {}), branding: br.data || {} });
      } else if (activeSection === 'audit') {
        const params = new URLSearchParams({ page: auditPage, limit: 25 });
        if (auditFilters.action) params.append('action', auditFilters.action);
        if (auditFilters.tenant_id) params.append('tenant_id', auditFilters.tenant_id);
        if (auditFilters.actor_id) params.append('actor_id', auditFilters.actor_id);
        const res = await apiFetch(`${API}/audit-logs?${params}`, { headers: authHeaders }).then(r => r.json());
        setAuditLogs(res.data || []);
        setAuditTotal(res.total || 0);
        setAuditMsg(res.message || '');
      }
    })();
  }, [activeSection, auditPage, auditFilters]);

  const fetchAll = async () => {
    try {
      const [metricsRes, appsRes, tenantsRes, usersRes] = await Promise.all([
        apiFetch('https://api.ssgzone.in/api/v1/dashboard/metrics', { headers: authHeaders }),
        apiFetch(`${API}/saas-apps`, { headers: authHeaders }),
        apiFetch(`${API}/tenants`, { headers: authHeaders }),
        apiFetch(`${API}/users?limit=5`, { headers: authHeaders })
      ]);
      const [metricsData, appsData, tenantsData, usersData] = await Promise.all([
        metricsRes.json(), appsRes.json(), tenantsRes.json(), usersRes.json()
      ]);
      if (metricsData.success) {
        const d = metricsData.data;
        setStats({
          ...d,
          emailsSent: d.emailsSent || d.emails_sent || d.emailStats?.sent || 0,
          deliveryRate: d.deliveryRate || d.delivery_rate || d.emailStats?.deliveryRate || 99.5,
          emailsReceived: d.emailsReceived || d.emails_received || d.emailStats?.received || 0,
          emailsFailed: d.emailsFailed || d.emails_failed || d.emailStats?.failed || 0,
          totalTenants: d.totalTenants || d.total_tenants || d.activeTenants || 0,
          totalUsers: d.totalUsers || d.total_users || 0,
          emailsToday: d.emailsToday || d.emails_today || 0,
        });
      }
      if (appsData.success) setSaasApps(appsData.data);
      if (tenantsData.success) setTenants(tenantsData.data);
      if (usersData.success) { setUsers(usersData.data); setUsersTotal(usersData.total); }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('https://api.ssgzone.in/api/v1/notifications?limit=10', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setNotifCount(data.unread || 0);
      }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ page: usersPage, limit: 50 });
      if (usersSearch) params.append('search', usersSearch);
      if (usersTenantFilter) params.append('tenant_id', usersTenantFilter);
      if (usersSaasFilter) params.append('saas_app_id', usersSaasFilter);
      if (usersStatusFilter) params.append('status', usersStatusFilter);
      const res = await apiFetch(`${API}/users?${params}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setUsers(data.data); setUsersTotal(data.total); }
    } catch (err) { console.error('Fetch users error:', err); }
  };

  const fetchUserSuggestions = async (q) => {
    if (!q || q.length < 2) { setUsersSearchSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await apiFetch(`${API}/users?search=${encodeURIComponent(q)}&limit=5`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setUsersSearchSuggestions(data.data); setShowSuggestions(true); }
    } catch (err) { console.error(err); }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await apiFetch(`${API}/users/${user.id}/status`, {
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
      const res = await apiFetch(`${API}/users/${deletingUser.id}`, { method: 'DELETE', headers: authHeaders });
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
        const res = await apiFetch(`${API}/saas-apps/${editingSaasApp.id}`, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSaasApp.name })
        });
        const data = await res.json();
        if (data.success) { setOpenSaasDialog(false); setEditingSaasApp(null); setNewSaasApp({ name: '', slug: '' }); fetchAll(); }
        else alert(data.error);
      } else {
        const res = await apiFetch(`${API}/saas-apps`, {
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
      const res = await apiFetch(`${API}/tenants`, {
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
      const res = await apiFetch(`${API}/saas-apps/${app.id}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setViewingApiKeys(data.data); setOpenApiKeysDialog(true); }
    } catch (err) { alert(err.message); }
  };

  const handleViewFeatures = async (app) => {
    try {
      const res = await apiFetch(`${API}/saas-apps/${app.id}/features`, { headers: authHeaders });
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
      const res = await apiFetch(`${API}/saas-apps/${deletingSaasApp.id}`, { method: 'DELETE', headers: authHeaders });
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
      const res = await apiFetch(`${API}/tenants/import-csv`, {
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
    { section: '', items: [{ id: 'dashboard', label: 'Dashboard', icon: '📊' }] },
    { section: 'EMAIL', items: [
      { id: 'email', label: 'Email', icon: '📧' },
      { id: 'compose', label: 'Campaigns', icon: '📢' },
      { id: 'templates', label: 'Email Templates', icon: '📄' },
      { id: 'scheduled', label: 'Scheduled', icon: '⏰' },
      { id: 'drafts', label: 'Drafts', icon: '📝' },
      { id: 'trash', label: 'Trash', icon: '🗑' },
      { id: 'spam', label: 'Spam', icon: '⛔' },
    ]},
    { section: 'MANAGEMENT', items: [
      { id: 'applications', label: 'Applications', icon: '▦' },
      { id: 'tenants', label: 'Tenants', icon: '🏢' },
      { id: 'direct-clients', label: 'Direct Clients', icon: '👤' },
      { id: 'users', label: 'Users', icon: '👥' },
      { id: 'mailboxes', label: 'Mailboxes', icon: '📬' },
      { id: 'permissions', label: 'Feature Permissions', icon: '🔑' },
      { id: 'admins', label: 'Roles & Permissions', icon: '🛡' },
    ]},
    { section: 'ANALYTICS', items: [
      { id: 'reports', label: 'Reports', icon: '📈' },
      { id: 'analytics', label: 'Email Analytics', icon: '📊' },
    ]},
    { section: 'BILLING', items: [
      { id: 'billing', label: 'Billing', icon: '💳' },
    ]},
    { section: 'SYSTEM', items: [
      { id: 'system-config', label: 'System Config', icon: '⚙' },
      { id: 'security', label: 'Security & Logs', icon: '🔐' },
      { id: 'audit', label: 'Audit Logs', icon: '📋' },
      { id: 'gdpr', label: 'GDPR & Compliance', icon: '🛡' },
      { id: 'settings', label: 'Settings & Branding', icon: '🎨' },
    ]},
  ];

  const Sidebar = () => (
    <div style={{ width: 220, height: '100vh', background: colors.sidebar, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100, overflowY: 'auto' }}>
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
        <input
          placeholder="Search users, tenants, emails, applications..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) { setActiveSection('tenants'); setSearchQuery(''); } }}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: colors.headerText, width: '100%' }} />
        <span style={{ fontSize: 11, color: colors.headerText, opacity: 0.5, background: colors.border, padding: '2px 6px', borderRadius: 4 }}>Ctrl+K</span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => { setNotifOpen(p => !p); if (!notifOpen) fetchNotifications(); }}
            style={{ cursor: 'pointer', position: 'relative', padding: 4 }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            {notifCount > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: colors.danger, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifCount}</span>
            )}
          </div>
          {notifOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 500 }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Notifications</span>
                <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.textMuted }}>×</button>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>No notifications</div>
                )}
                {notifications.map((n, i) => (
                  <div key={n.id || i} style={{ padding: '10px 16px', borderBottom: `1px solid ${colors.border}`, background: n.is_read ? colors.card : (colors.primaryLight || '#eef2ff') }}>
                    <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: colors.text }}>{n.title || n.message || 'Notification'}</div>
                    {n.body && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{n.body}</div>}
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {[
          { label: 'Compose Email', icon: '✏', section: 'compose' },
          { label: 'Create Campaign', icon: '📢', section: 'compose' },
          { label: 'Add Tenant', icon: '🏢', action: () => setOpenTenantDialog(true) },
          { label: 'Create Template', icon: '📄', section: 'templates' },
          { label: 'View Reports', icon: '📊', section: 'reports' },
          { label: 'System Settings', icon: '⚙', section: 'settings' },
        ].map((a, i) => (
          <button key={i} onClick={a.action || (() => setActiveSection(a.section))}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: 12, color: colors.text, fontWeight: 500, background: colors.bg, textAlign: 'left' }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>{a.label}
          </button>
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

  const RecentCampaigns = () => (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Recent Campaigns</div>
        <span onClick={() => setActiveSection('compose')} style={{ fontSize: 12, color: colors.primary, cursor: 'pointer' }}>View All</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Campaign', 'Recipients', 'Sent', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[].length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No campaigns yet</td></tr>}
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

  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', tenant_id: '', role: 'user' });
  const [addUserError, setAddUserError] = useState('');
  const [addUserSaving, setAddUserSaving] = useState(false);

  const handleAddUser = async () => {
    if (!addUserForm.first_name || !addUserForm.last_name || !addUserForm.username || !addUserForm.email || !addUserForm.tenant_id) {
      setAddUserError('First name, last name, username, email and tenant are required'); return;
    }
    setAddUserSaving(true); setAddUserError('');
    try {
      const res = await apiFetch(`${API}/users`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm)
      });
      const data = await res.json();
      if (data.success) {
        setOpenAddUserDialog(false);
        setAddUserForm({ first_name: '', last_name: '', username: '', email: '', password: '', tenant_id: '', role: 'user' });
        fetchUsers();
        if (data.data?.temp_password) alert(`✅ User created!\nTemp Password: ${data.data.temp_password}`);
      } else setAddUserError(data.error || 'Failed to create user');
    } catch (err) { setAddUserError(err.message); }
    setAddUserSaving(false);
  };

  const UsersSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Users</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Total {usersTotal} users across all tenants</div>
        </div>
        <button onClick={() => { setAddUserForm({ first_name: '', last_name: '', username: '', email: '', password: '', tenant_id: '', role: 'user' }); setAddUserError(''); setOpenAddUserDialog(true); }}
          style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add User</button>
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
        const res = await apiFetch(`${API}/tenants/${t.id}/domain/status`, { headers: authHeaders });
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
        const res = await apiFetch(`${API}/tenants/${domainTenant.id}/domain/setup`, {
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
        const res = await apiFetch(`${API}/tenants/${domainTenant.id}/domain/verify`, {
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
      const res = await apiFetch(`${API}/tenants/${domainTenant.id}/domain`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDomainTenant(null); fetchAll(); }
      else alert(data.error);
    };

    const toggleTenantStatus = async (t) => {
      const newStatus = t.status === 'active' ? 'suspended' : 'active';
      try {
        const res = await apiFetch(`${API}/tenants/${t.id}/status`, {
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
        const res = await apiFetch(`${API}/tenants/${deletingTenant.id}`, { method: 'DELETE', headers: authHeaders });
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
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: t.status === 'active' ? colors.successLight : colors.warningLight, color: t.status === 'active' ? colors.success : colors.warning, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.status || 'active'}</span>
                    <span style={{ background: t.dns_verified ? '#d1fae5' : '#f3f4f6', color: t.dns_verified ? '#065f46' : '#9ca3af', borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 600 }}>{t.dns_verified ? '✅ DNS' : '⏳ DNS'}</span>
                  </div>
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
        const res = await apiFetch(`${API}/tenants`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (data.success) {
          setOpenTenantDialog(false);
          fetchAll();
          setDnsModal({ domain: data.data.domain, password: data.data?.admin_credentials?.password });
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
                await apiFetch(`${API}/saas-apps/${viewingFeatures.id}/features`, {
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

    {/* DNS Setup Modal — shown after tenant creation */}
    {dnsModal && (
      <div style={modalStyle} onClick={() => setDnsModal(null)}>
        <div style={{ ...boxStyle, width: 560 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>✅ Tenant Created!</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Domain: <code style={{ fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>{dnsModal.domain}</code></div>
          {dnsModal.password && <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Admin password: <code style={{ fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>{dnsModal.password}</code></div>}
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Add these DNS records at your domain provider:</div>
          {[
            { type: 'MX',    name: dnsModal.domain,          value: 'mail.ssgzone.in',                                    note: 'Priority: 10' },
            { type: 'TXT',   name: dnsModal.domain,          value: 'v=spf1 include:ssgzone.in ~all',                     note: 'SPF' },
            { type: 'TXT',   name: `_dmarc.${dnsModal.domain}`, value: 'v=DMARC1; p=none; rua=mailto:dmarc@ssgzone.in', note: 'DMARC' },
            { type: 'CNAME', name: `mail.${dnsModal.domain}`, value: 'mail.ssgzone.in',                                  note: 'Webmail' },
          ].map((r, i) => (
            <div key={i} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: colors.primaryLight, color: colors.primary, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700, minWidth: 44, textAlign: 'center' }}>{r.type}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>{r.name} {r.note && <span style={{ color: colors.warning }}>({r.note})</span>}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: colors.text, wordBreak: 'break-all' }}>{r.value}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(r.value)}
                style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: colors.textMuted, flexShrink: 0 }}>📋 Copy</button>
            </div>
          ))}
          <div style={{ fontSize: 11, color: colors.warning, marginBottom: 16 }}>⚠ DNS propagation may take 5–30 minutes.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnPrimary} onClick={() => setDnsModal(null)}>Done</button>
          </div>
        </div>
      </div>
    )}
  </>);

  const ScheduledSection = () => {
    const [emails, setEmails] = useState([]);
    const fetch = () => apiFetch(`${API}/scheduled-emails`, { headers: authHeaders })
      .then(r => r.json()).then(d => { if (d.success) setEmails(d.data); });
    useEffect(() => { fetch(); }, []);

    const cancel = async (id) => {
      if (!window.confirm('Cancel this scheduled email?')) return;
      const res = await apiFetch(`${API}/scheduled-emails/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) fetch(); else alert(data.error);
    };

    const statusColors = {
      pending: { bg: colors.warningLight, color: colors.warning },
      sent: { bg: colors.successLight, color: colors.success },
      cancelled: { bg: colors.bg, color: colors.textMuted },
      failed: { bg: colors.dangerLight, color: colors.danger },
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Scheduled Emails</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{emails.filter(e => e.status === 'pending').length} pending</div>
          </div>
          <button onClick={() => setActiveSection('compose')} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Schedule New</button>
        </div>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Type', 'To / Target', 'Subject', 'Scheduled At', 'Status', 'Created By', 'Actions'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {emails.map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: e.mode === 'broadcast' ? colors.warningLight : colors.primaryLight, color: e.mode === 'broadcast' ? colors.warning : colors.primary, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {e.mode === 'broadcast' ? '📢 Broadcast' : '✉ Single'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: colors.text, fontSize: 12 }}>
                    {e.mode === 'broadcast' ? `All ${e.broadcast_target}` : e.to_email}
                  </td>
                  <td style={{ padding: '12px 16px', color: colors.text }}>{e.subject}</td>
                  <td style={{ padding: '12px 16px', color: colors.text, fontSize: 12 }}>{new Date(e.scheduled_at).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: statusColors[e.status]?.bg, color: statusColors[e.status]?.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{e.created_by}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {e.status === 'pending' && (
                      <button onClick={() => cancel(e.id)} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✕ Cancel</button>
                    )}
                    {e.status === 'failed' && e.error_message && (
                      <span style={{ fontSize: 11, color: colors.danger }} title={e.error_message}>⚠ Error</span>
                    )}
                  </td>
                </tr>
              ))}
              {emails.length === 0 && <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No scheduled emails</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const TemplatesSection = () => {
    const [templates, setTemplates] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [form, setForm] = useState({ name: '', subject: '', body: '', category: 'general' });

    const fetchTemplates = () => apiFetch(`${API}/email/templates`, { headers: authHeaders })
      .then(r => r.json()).then(d => { if (d.success) setTemplates(d.data); });
    useEffect(() => { fetchTemplates(); }, []);

    const categories = ['general', 'onboarding', 'notification', 'marketing', 'security', 'meetings'];
    const catColors = { general: colors.primaryLight, onboarding: colors.successLight, notification: colors.cyanLight, marketing: colors.warningLight, security: colors.dangerLight, meetings: colors.purpleLight };
    const catTextColors = { general: colors.primary, onboarding: colors.success, notification: colors.cyan, marketing: colors.warning, security: colors.danger, meetings: colors.purple };

    const save = async () => {
      if (!form.name || !form.subject || !form.body) return alert('All fields required');
      const url = editingTemplate ? `${API}/email/templates/${editingTemplate.id}` : `${API}/email/templates`;
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setForm({ name: '', subject: '', body: '', category: 'general' }); setEditingTemplate(null); setShowPreview(false); fetchTemplates(); }
      else alert(data.error);
    };

    const del = async () => {
      const res = await apiFetch(`${API}/email/templates/${deletingTemplate.id}`, { method: 'DELETE', headers: authHeaders });
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
    const fetchAdmins = () => apiFetch(`${API}/admins`, { headers: authHeaders }).then(r => r.json()).then(d => { if (d.success) setAdmins(d.data); });
    useEffect(() => { fetchAdmins(); }, []);

    const create = async () => {
      if (!form.username || !form.email || !form.full_name || !form.password) return alert('All fields required');
      const res = await apiFetch(`${API}/admins`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setForm({ username: '', email: '', full_name: '', password: '', role: 'admin' }); fetchAdmins(); }
      else alert(data.error);
    };

    const update = async () => {
      const res = await apiFetch(`${API}/admins/${editingAdmin.id}`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: form.full_name, role: form.role, permissions: editingAdmin.permissions, assigned_tenants: editingAdmin.assigned_tenants, status: editingAdmin.status }) });
      const data = await res.json();
      if (data.success) { setOpenDialog(false); setEditingAdmin(null); setForm({ username: '', email: '', full_name: '', password: '', role: 'admin' }); fetchAdmins(); }
      else alert(data.error);
    };

    const toggleStatus = async (admin) => {
      const newStatus = admin.status === 'active' ? 'suspended' : 'active';
      const res = await apiFetch(`${API}/admins/${admin.id}`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...admin, status: newStatus }) });
      const data = await res.json();
      if (data.success) fetchAdmins();
    };

    const deleteAdmin = async () => {
      const res = await apiFetch(`${API}/admins/${deletingAdmin.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDeletingAdmin(null); fetchAdmins(); }
      else alert(data.error);
    };

    const resetPassword = async () => {
      if (!newPassword) return alert('New password required');
      const res = await apiFetch(`${API}/admins/${resetingAdmin.id}/reset-password`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: newPassword }) });
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
    const [mailboxes, setMailboxes] = useState([]);
    const [search, setSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [aliases, setAliases] = useState({});
    const [aliasInput, setAliasInput] = useState({});

    const fetchMailboxes = () => {
      const params = new URLSearchParams();
      if (tenantFilter) params.append('tenant_id', tenantFilter);
      if (search) params.append('search', search);
      apiFetch(`${API}/mailboxes?${params}`, { headers: authHeaders })
        .then(r => r.json()).then(d => { if (d.success) setMailboxes(d.data); });
    };

    useEffect(() => { fetchMailboxes(); }, [tenantFilter]);

    const filtered = search
      ? mailboxes.filter(m => m.email.toLowerCase().includes(search.toLowerCase()))
      : mailboxes;

    const toggleStatus = async (m) => {
      const newStatus = m.status === 'active' ? 'suspended' : 'active';
      const res = await apiFetch(`${API}/mailboxes/${m.id}/status`, {
        method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) setMailboxes(mailboxes.map(x => x.id === m.id ? { ...x, status: newStatus } : x));
      else alert(data.error);
    };

    const loadAliases = async (mailboxId) => {
      if (expandedId === mailboxId) { setExpandedId(null); return; }
      setExpandedId(mailboxId);
      if (aliases[mailboxId]) return;
      const res = await apiFetch(`${API}/aliases?mailbox_id=${mailboxId}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setAliases(a => ({ ...a, [mailboxId]: data.data }));
    };

    const addAlias = async (mailboxId) => {
      const email = (aliasInput[mailboxId] || '').trim();
      if (!email) return alert('Enter alias email');
      const res = await apiFetch(`${API}/aliases`, {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailbox_id: mailboxId, alias_email: email })
      });
      const data = await res.json();
      if (data.success) {
        setAliases(a => ({ ...a, [mailboxId]: [...(a[mailboxId] || []), data.data] }));
        setAliasInput(i => ({ ...i, [mailboxId]: '' }));
      } else alert(data.error);
    };

    const deleteAlias = async (mailboxId, aliasId) => {
      const res = await apiFetch(`${API}/aliases/${aliasId}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) setAliases(a => ({ ...a, [mailboxId]: a[mailboxId].filter(x => x.id !== aliasId) }));
      else alert(data.error);
    };

    const inputS = { padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box' };
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Mailboxes</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Tenant user mailboxes — click a row to manage aliases</div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchMailboxes()}
            placeholder="Search by email... (press Enter)"
            style={{ ...inputS, flex: 1 }} />
          <select value={tenantFilter} onChange={e => setTenantFilter(e.target.value)}
            style={{ ...inputS, minWidth: 200 }}>
            <option value="">All Tenants</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
          </select>
          <button onClick={fetchMailboxes}
            style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🔍 Search</button>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Email', 'Name', 'Tenant', 'Role', 'Status', 'Actions'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {filtered.map((m) => (
                <React.Fragment key={m.id}>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', background: expandedId === m.id ? colors.primaryLight : 'transparent' }}
                    onClick={() => loadAliases(m.id)}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>{m.email}</td>
                    <td style={{ padding: '12px 16px', color: colors.text }}>{m.first_name} {m.last_name}</td>
                    <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{m.tenant_name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: colors.text }}>{m.role}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: m.status === 'active' ? colors.successLight : colors.dangerLight, color: m.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{m.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleStatus(m)}
                        style={{ background: m.status === 'active' ? colors.warningLight : colors.successLight, color: m.status === 'active' ? colors.warning : colors.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                        {m.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === m.id && (
                    <tr key={`aliases-${m.id}`}>
                      <td colSpan={6} style={{ padding: '12px 24px', background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>↪ Aliases for {m.email}</div>
                        {(aliases[m.id] || []).length === 0
                          ? <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>No aliases yet</div>
                          : (aliases[m.id] || []).map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.text }}>{a.alias_email}</span>
                              <button onClick={() => deleteAlias(m.id, a.id)}
                                style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                            </div>
                          ))
                        }
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input value={aliasInput[m.id] || ''}
                            onChange={e => setAliasInput(i => ({ ...i, [m.id]: e.target.value }))}
                            placeholder="new-alias@domain.com"
                            style={{ ...inputS, flex: 1, padding: '7px 10px' }} />
                          <button onClick={() => addAlias(m.id)}
                            style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Alias</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No mailboxes found. Use search/filter above.</td></tr>}
            </tbody>
          </table>
        </div>
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
      apiFetch(`${API}/email/sent?${q}`, { headers: authHeaders })
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
                    <span style={{ background: typeColors[e.email_category]?.bg || colors.primaryLight, color: typeColors[e.email_category]?.color || colors.primary, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{e.email_category || 'manual'}</span>
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
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [templateVars, setTemplateVars] = useState({});

    useEffect(() => {
      apiFetch(`${API}/email/templates`, { headers: authHeaders }).then(r => r.json()).then(d => { if (d.success) setTemplates(d.data); });
    }, []);

    const extractVars = (str) => [...new Set([...(str || '').matchAll(/{{(\w+)}}/g)].map(m => m[1]))];
    const applyVars = (str) => Object.entries(templateVars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), str);

    const handleTemplateSelect = (templateId) => {
      setSelectedTemplate(templateId);
      const t = templates.find(t => t.id === templateId);
      if (t) {
        if (mode === 'single') setForm(f => ({ ...f, subject: t.subject, body: t.body }));
        else setBroadcastForm(f => ({ ...f, subject: t.subject, body: t.body }));
        const vars = extractVars((t.subject || '') + ' ' + (t.body || ''));
        setTemplateVars(Object.fromEntries(vars.map(v => [v, ''])));
      } else {
        setTemplateVars({});
      }
    };

    const send = async () => {
      if (!form.to_email || !form.subject || !form.body) return alert('To Email, Subject and Body required');
      const payload = { ...form, subject: applyVars(form.subject), body: applyVars(form.body) };
      const toUTC = (localDt) => localDt ? new Date(localDt).toISOString() : localDt;
      if (scheduleEnabled) {
        if (!scheduledAt) return alert('Please select a date and time to schedule');
        setSending(true);
        try {
          const res = await apiFetch(`${API}/scheduled-emails`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'single', ...payload, scheduled_at: toUTC(scheduledAt) }) });
          const data = await res.json();
          if (data.success) { alert('✅ Email scheduled!'); setForm({ to_email: '', to_name: '', subject: '', body: '', tenant_id: '' }); setSelectedTemplate(''); setScheduleEnabled(false); setScheduledAt(''); setTemplateVars({}); }
          else alert(data.error);
        } catch (err) { alert(err.message); }
        setSending(false); return;
      }
      setSending(true);
      try {
        const res = await apiFetch(`${API}/email/send`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { alert('✅ Email sent successfully!'); setForm({ to_email: '', to_name: '', subject: '', body: '', tenant_id: '' }); setSelectedTemplate(''); setTemplateVars({}); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSending(false);
    };

    const sendBroadcast = async () => {
      if (!broadcastForm.subject || !broadcastForm.body) return alert('Subject and Body required');
      const bPayload = { ...broadcastForm, subject: applyVars(broadcastForm.subject), body: applyVars(broadcastForm.body) };
      const toUTC = (localDt) => localDt ? new Date(localDt).toISOString() : localDt;
      if (scheduleEnabled) {
        if (!scheduledAt) return alert('Please select a date and time to schedule');
        setSending(true);
        try {
          const res = await apiFetch(`${API}/scheduled-emails`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'broadcast', ...bPayload, scheduled_at: toUTC(scheduledAt) }) });
          const data = await res.json();
          if (data.success) { alert('✅ Broadcast scheduled!'); setBroadcastForm({ subject: '', body: '', target: 'tenants' }); setSelectedTemplate(''); setScheduleEnabled(false); setScheduledAt(''); setTemplateVars({}); }
          else alert(data.error);
        } catch (err) { alert(err.message); }
        setSending(false); return;
      }
      if (!window.confirm(`Send broadcast to all ${broadcastForm.target}? This cannot be undone.`)) return;
      setSending(true);
      try {
        const res = await apiFetch(`${API}/email/broadcast`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(bPayload) });
        const data = await res.json();
        if (data.success) { alert(`✅ Broadcast complete!\nSent: ${data.sent}\nFailed: ${data.failed}\nTotal: ${data.total}`); setBroadcastForm({ subject: '', body: '', target: 'tenants' }); setSelectedTemplate(''); setTemplateVars({}); }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Use Template</label>
              <button onClick={() => setActiveSection('templates')} style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ Manage Templates</button>
            </div>
            <select style={inputS} value={selectedTemplate} onChange={e => handleTemplateSelect(e.target.value)}>
              <option value="">— Select Template —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {Object.keys(templateVars).length > 0 && (
              <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Template Variables</div>
                {Object.keys(templateVars).map(key => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                    <input style={inputS} value={templateVars[key]} onChange={e => setTemplateVars(v => ({ ...v, [key]: e.target.value }))} placeholder={`Enter ${key.replace(/_/g, ' ')}`} />
                  </div>
                ))}
              </div>
            )}

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
              {/* Schedule Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: scheduleEnabled ? colors.warningLight : colors.bg, borderRadius: 8, border: `1px solid ${scheduleEnabled ? colors.warning : colors.border}` }}>
                <div onClick={() => setScheduleEnabled(p => !p)} style={{ width: 36, height: 20, borderRadius: 10, background: scheduleEnabled ? colors.warning : colors.border, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: scheduleEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: scheduleEnabled ? colors.warning : colors.textMuted }}>⏰ Schedule for later</span>
                {scheduleEnabled && (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    style={{ flex: 1, padding: '6px 10px', border: `1px solid ${colors.warning}`, borderRadius: 6, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }} />
                  <button type="button" onClick={() => {}} style={{ padding: '4px 10px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'default', whiteSpace: 'nowrap' }}>&#10003; Set</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={send} disabled={sending} style={{ background: scheduleEnabled ? colors.warning : colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? '...' : scheduleEnabled ? '⏰ Schedule Email' : '📤 Send Email'}</button>
                <button onClick={() => setActiveSection('email')} style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>View Sent</button>
                <button onClick={() => setActiveSection('scheduled')} style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>⏰ Scheduled</button>
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
              {/* Schedule Toggle for Broadcast */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: scheduleEnabled ? colors.warningLight : colors.bg, borderRadius: 8, border: `1px solid ${scheduleEnabled ? colors.warning : colors.border}` }}>
                <div onClick={() => setScheduleEnabled(p => !p)} style={{ width: 36, height: 20, borderRadius: 10, background: scheduleEnabled ? colors.warning : colors.border, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: scheduleEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: scheduleEnabled ? colors.warning : colors.textMuted }}>⏰ Schedule for later</span>
                {scheduleEnabled && (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    style={{ flex: 1, padding: '6px 10px', border: `1px solid ${colors.warning}`, borderRadius: 6, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }} />
                  <button type="button" onClick={() => {}} style={{ padding: '4px 10px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'default', whiteSpace: 'nowrap' }}>&#10003; Set</button>
                )}
              </div>
              <button onClick={sendBroadcast} disabled={sending} style={{ background: scheduleEnabled ? colors.warning : colors.warning, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? '...' : scheduleEnabled ? '⏰ Schedule Broadcast' : '📢 Send Broadcast'}</button>
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
        const res = await apiFetch(`${API}/branding`, { method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (data.success) { setBranding({ ...branding, ...form }); alert('✅ Settings saved!'); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSaving(false);
    };

    const uploadLogo = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const formData = new FormData(); formData.append('logo', file);
      const res = await apiFetch(`${API}/branding/logo`, { method: 'POST', headers: authHeaders, body: formData });
      const data = await res.json();
      if (data.success) { setBranding({ ...branding, logo_url: data.data.logo_url }); alert('Logo uploaded!'); }
      else alert(data.error);
    };

    const uploadFavicon = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const formData = new FormData(); formData.append('favicon', file);
      const res = await apiFetch(`${API}/branding/favicon`, { method: 'POST', headers: authHeaders, body: formData });
      const data = await res.json();
      if (data.success) { setBranding({ ...branding, favicon_url: data.data.favicon_url }); alert('Favicon uploaded!'); }
      else alert(data.error);
    };

    const changePassword = async () => {
      if (!pwdForm.current_password || !pwdForm.new_password) return alert('All fields required');
      if (pwdForm.new_password !== pwdForm.confirm_password) return alert('New passwords do not match');
      if (pwdForm.new_password.length < 8) return alert('Password must be at least 8 characters');
      const res = await apiFetch(`${API}/profile/change-password`, { method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }) });
      const data = await res.json();
      if (data.success) { alert('✅ Password changed!'); setPwdForm({ current_password: '', new_password: '', confirm_password: '' }); }
      else alert(data.error);
    };

    const tabs = [{ key: 'branding', label: '🎨 Branding' }, { key: 'email', label: '📧 Email' }, { key: 'limits', label: '⚙ Limits' }, { key: 'security', label: '🔐 Security' }, { key: 'profile', label: '👤 My Profile' }];
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    const labelS = { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' };

    const TwoFAPanel = () => {
      const [twoFAStatus, setTwoFAStatus] = useState(null);
      const [qrCode, setQrCode] = useState(null);
      const [secret, setSecret] = useState('');
      const [verifyCode, setVerifyCode] = useState('');
      const [loading2fa, setLoading2fa] = useState(false);
      const SA = 'https://api.ssgzone.in/api/v1/super-admin';
      useEffect(() => {
        apiFetch(`${SA}/2fa/status`, { headers: authHeaders })
          .then(r => r.json()).then(d => d.success && setTwoFAStatus(d.data.enabled));
      }, []);
      const setup = async () => {
        setLoading2fa(true);
        const res = await apiFetch(`${SA}/2fa/setup`, { method: 'POST', headers: authHeaders });
        const data = await res.json();
        if (data.success) { setQrCode(data.data.qr_code); setSecret(data.data.secret); } else alert(data.error);
        setLoading2fa(false);
      };
      const enable = async () => {
        if (!verifyCode) return alert('Enter the 6-digit code');
        const res = await apiFetch(`${SA}/2fa/enable`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: verifyCode }) });
        const data = await res.json();
        if (data.success) { setTwoFAStatus(true); setQrCode(null); setSecret(''); setVerifyCode(''); alert('✅ 2FA enabled!'); } else alert(data.error);
      };
      const disable = async () => {
        if (!window.confirm('Disable 2FA? Your account will be less secure.')) return;
        const res = await apiFetch(`${SA}/2fa/disable`, { method: 'POST', headers: authHeaders });
        const data = await res.json();
        if (data.success) { setTwoFAStatus(false); alert('2FA disabled'); } else alert(data.error);
      };
      return (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 4 }}>Two-Factor Authentication</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Add an extra layer of security to your super admin account</div>
          {twoFAStatus === null && <div style={{ color: colors.textMuted, fontSize: 13 }}>Loading...</div>}
          {twoFAStatus === true && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, background: colors.successLight, borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>🔐</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: colors.success }}>2FA is enabled</div><div style={{ fontSize: 12, color: colors.success }}>Your account is protected with TOTP authentication</div></div>
              </div>
              <button onClick={disable} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Disable 2FA</button>
            </div>
          )}
          {twoFAStatus === false && !qrCode && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, background: colors.warningLight, borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ fontSize: 13, color: colors.warning }}>2FA is not enabled. We recommend enabling it for security.</div>
              </div>
              <button onClick={setup} disabled={loading2fa} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading2fa ? 0.7 : 1 }}>
                {loading2fa ? 'Generating...' : '🔐 Enable 2FA'}
              </button>
            </div>
          )}
          {qrCode && (
            <div>
              <div style={{ fontSize: 13, color: colors.text, marginBottom: 12 }}>1. Scan this QR code with Google Authenticator or Authy:</div>
              <img src={qrCode} alt="2FA QR" style={{ width: 180, height: 180, border: `1px solid ${colors.border}`, borderRadius: 8, marginBottom: 12 }} />
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>Or enter manually: <code style={{ background: colors.bg, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>{secret}</code></div>
              <div style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>2. Enter the 6-digit code to confirm:</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6} placeholder="000000"
                  style={{ padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 16, width: 120, textAlign: 'center', letterSpacing: 4, outline: 'none' }} />
                <button onClick={enable} style={{ background: colors.success, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Verify & Enable</button>
                <button onClick={() => { setQrCode(null); setSecret(''); }} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: colors.textMuted }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      );
    };

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
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
            <TwoFAPanel />
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

  const PermissionsSection = () => {
    const [features, setFeatures] = useState([]);
    const [selectedSaas, setSelectedSaas] = useState('');
    const [saasPerms, setSaasPerms] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      apiFetch('https://api.ssgzone.in/api/v1/permissions/features')
        .then(r => r.json()).then(d => d.success && setFeatures(d.data));
    }, []);

    useEffect(() => {
      if (!selectedSaas) return;
      apiFetch(`https://api.ssgzone.in/api/v1/permissions/saas/${selectedSaas}`, { headers: authHeaders })
        .then(r => r.json()).then(d => {
          if (d.success) {
            const map = {};
            d.data.forEach(f => { map[f.feature_key] = f.is_enabled; });
            setSaasPerms(map);
          }
        });
    }, [selectedSaas]);

    const save = async () => {
      setSaving(true);
      const res = await apiFetch(`https://api.ssgzone.in/api/v1/permissions/saas/${selectedSaas}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: saasPerms })
      });
      const data = await res.json();
      setSaving(false);
      if (data.success) alert('✅ Permissions saved!');
      else alert(data.error);
    };

    const categories = [...new Set(features.map(f => f.category))];

    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Feature Permissions</div>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Control which features each SaaS application can access</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <select value={selectedSaas} onChange={e => setSelectedSaas(e.target.value)}
            style={{ padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', minWidth: 240 }}>
            <option value="">— Select SaaS Application —</option>
            {saasApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {selectedSaas && (
            <button onClick={save} disabled={saving}
              style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          )}
        </div>
        {selectedSaas && categories.map(cat => (
          <div key={cat} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{cat}</div>
            {features.filter(f => f.category === cat).map(f => (
              <div key={f.feature_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{f.feature_name}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{f.feature_key}</div>
                </div>
                <div onClick={() => setSaasPerms(p => ({ ...p, [f.feature_key]: !p[f.feature_key] }))}
                  style={{ width: 44, height: 24, borderRadius: 12, background: saasPerms[f.feature_key] ? colors.success : colors.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: saasPerms[f.feature_key] ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
        {!selectedSaas && (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Select a SaaS Application</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Choose an application above to manage its feature permissions</div>
          </div>
        )}
      </div>
    );
  };

  const DirectClientsSection = () => {
    const [clients, setClients] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);
    const [editingClient, setEditingClient] = React.useState(null);
    const emptyForm = { company_name: '', company_slug: '', contact_name: '', contact_email: '', allowed_domains: '', plan_type: 'starter', notes: '' };
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [msg, setMsg] = React.useState('');
    const [apiKeysClient, setApiKeysClient] = React.useState(null);
    const [apiKeys, setApiKeys] = React.useState([]);
    const [newKeyName, setNewKeyName] = React.useState('');
    const [newKeyResult, setNewKeyResult] = React.useState(null);
    const [identitiesClient, setIdentitiesClient] = React.useState(null);
    const [identities, setIdentities] = React.useState([]);
    const [newIdentity, setNewIdentity] = React.useState({ email_address: '', display_name: '', identity_type: 'send-only', forwards_to: '', notes: '' });

    const load = async (q) => {
      setLoading(true);
      const params = q ? '?search=' + encodeURIComponent(q) : '';
      const res = await apiFetch(API + '/direct-clients' + params, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setClients(data.data);
      setLoading(false);
    };
    React.useEffect(() => { load(); }, []);

    const save = async () => {
      if (!form.company_name || !form.company_slug) { setMsg('Company name and slug are required'); return; }
      setSaving(true); setMsg('');
      const payload = { ...form, allowed_domains: form.allowed_domains ? form.allowed_domains.split(',').map(d => d.trim()).filter(Boolean) : [] };
      const url = editingClient ? API + '/direct-clients/' + editingClient.id : API + '/direct-clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      setSaving(false);
      if (data.success) { setShowForm(false); setEditingClient(null); setForm(emptyForm); load(); }
      else setMsg(data.error || 'Failed');
    };

    const toggleStatus = async (client) => {
      const newStatus = client.status === 'active' ? 'suspended' : 'active';
      const res = await apiFetch(API + '/direct-clients/' + client.id + '/status', {
        method: 'PATCH', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) setClients(p => p.map(cl => cl.id === client.id ? { ...cl, status: newStatus } : cl));
    };

    const del = async (id) => {
      if (!window.confirm('Delete this client and all their API keys?')) return;
      await apiFetch(API + '/direct-clients/' + id, { method: 'DELETE', headers: authHeaders });
      setClients(p => p.filter(cl => cl.id !== id));
    };

    const loadApiKeys = async (clientId) => {
      const res = await apiFetch(API + '/direct-clients/' + clientId + '/api-keys', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setApiKeys(data.data);
    };

    const loadIdentities = async (clientId) => {
      const res = await apiFetch(API + '/direct-clients/' + clientId + '/identities', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setIdentities(data.data);
    };

    const addIdentity = async (clientId) => {
      if (!newIdentity.email_address.trim()) return;
      const res = await apiFetch(API + '/direct-clients/' + clientId + '/identities', {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newIdentity)
      });
      const data = await res.json();
      if (data.success) { setNewIdentity({ email_address: '', display_name: '', identity_type: 'send-only', forwards_to: '', notes: '' }); loadIdentities(clientId); }
      else alert(data.error);
    };

    const deleteIdentity = async (identityId, clientId) => {
      if (!window.confirm('Delete this identity?')) return;
      await apiFetch(API + '/direct-clients/identities/' + identityId, { method: 'DELETE', headers: authHeaders });
      loadIdentities(clientId);
    };

    const generateApiKey = async (clientId) => {
      if (!newKeyName.trim()) return;
      const res = await apiFetch(API + '/direct-clients/' + clientId + '/api-keys', {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) { setNewKeyResult(data.data); setNewKeyName(''); loadApiKeys(clientId); }
      else alert(data.error);
    };

    const deleteApiKey = async (keyId, clientId) => {
      if (!window.confirm('Delete this API key? This will break any integrations using it.')) return;
      await apiFetch(API + '/direct-clients/api-keys/' + keyId, { method: 'DELETE', headers: authHeaders });
      loadApiKeys(clientId);
    };

    const planColors = { starter: { bg: colors.primaryLight, color: colors.primary }, pro: { bg: colors.cyanLight, color: colors.cyan }, enterprise: { bg: colors.purpleLight, color: colors.purple } };
    const inp = { padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box' };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Direct Clients</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Companies with direct SSGzone email relay access</div>
          </div>
          <button onClick={() => { setEditingClient(null); setForm(emptyForm); setMsg(''); setShowForm(p => !p); }}
            style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + New Client
          </button>
        </div>

        {showForm && (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 16 }}>{editingClient ? 'Edit Client' : 'Create Direct Client'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Company Name *</div>
                <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} style={{ ...inp, width: '100%' }} placeholder="e.g. VastiQ" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Slug * <span style={{ fontWeight: 400, color: colors.textMuted }}>(unique identifier)</span></div>
                <input value={form.company_slug} onChange={e => setForm(p => ({ ...p, company_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} style={{ ...inp, width: '100%' }} placeholder="e.g. vastiq" disabled={!!editingClient} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Contact Name</div>
                <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} style={{ ...inp, width: '100%' }} placeholder="Primary contact" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Contact Email</div>
                <input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} style={{ ...inp, width: '100%' }} placeholder="admin@company.com" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Allowed Domains <span style={{ fontWeight: 400 }}>(comma separated)</span></div>
                <input value={form.allowed_domains} onChange={e => setForm(p => ({ ...p, allowed_domains: e.target.value }))} style={{ ...inp, width: '100%' }} placeholder="vastiqonline.in, vastiq.com" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Plan</div>
                <select value={form.plan_type} onChange={e => setForm(p => ({ ...p, plan_type: e.target.value }))} style={{ ...inp, width: '100%' }}>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Notes</div>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, width: '100%' }} placeholder="Internal notes" />
              </div>
            </div>
            {msg && <div style={{ color: colors.danger, fontSize: 13, marginBottom: 10 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving}
                style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingClient(null); setMsg(''); }}
                style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: colors.textMuted }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)}
            placeholder="Search by company name, email..."
            style={{ ...inp, flex: 1 }} />
          <button onClick={() => load(search)} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: colors.text }}>Search</button>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
              {['Company', 'Contact', 'Allowed Domains', 'Plan', 'API Keys', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>Loading...</td></tr>}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                  <div style={{ fontWeight: 600, color: colors.text }}>No direct clients yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Click "+ New Client" to add a company</div>
                </td></tr>
              )}
              {clients.map(cl => (
                <tr key={cl.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: colors.text }}>{cl.company_name}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{cl.company_slug}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: colors.text, fontSize: 12 }}>{cl.contact_name || '—'}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11 }}>{cl.contact_email || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>
                    {cl.allowed_domains?.length ? cl.allowed_domains.join(', ') : <span style={{ color: colors.warning }}>⚠ Any domain</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: planColors[cl.plan_type]?.bg || colors.primaryLight, color: planColors[cl.plan_type]?.color || colors.primary, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{cl.plan_type}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: colors.text, fontSize: 13 }}>{cl.api_key_count || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: cl.status === 'active' ? colors.successLight : colors.dangerLight, color: cl.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{cl.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{new Date(cl.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingClient(cl); setForm({ company_name: cl.company_name, company_slug: cl.company_slug, contact_name: cl.contact_name || '', contact_email: cl.contact_email || '', allowed_domains: (cl.allowed_domains || []).join(', '), plan_type: cl.plan_type || 'starter', notes: cl.notes || '' }); setMsg(''); setShowForm(true); }}
                        style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: colors.text }}>✏ Edit</button>
                      <button onClick={() => toggleStatus(cl)}
                        style={{ background: 'none', border: `1px solid ${cl.status === 'active' ? colors.danger : colors.success}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: cl.status === 'active' ? colors.danger : colors.success, fontWeight: 600 }}>
                        {cl.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => { setApiKeysClient(cl); loadApiKeys(cl.id); setNewKeyResult(null); setNewKeyName(''); }}
                        style={{ background: colors.primaryLight, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: colors.primary }}>🔑 API Keys</button>
                      <button onClick={() => { setIdentitiesClient(cl); loadIdentities(cl.id); setNewIdentity({ email_address: '', display_name: '', identity_type: 'send-only', forwards_to: '', notes: '' }); }}
                        style={{ background: colors.cyanLight, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: colors.cyan }}>📧 Identities</button>
                      <button onClick={() => del(cl.id)}
                        style={{ background: 'none', border: `1px solid ${colors.danger}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: colors.danger }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* API Keys Modal */}
        {apiKeysClient && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setApiKeysClient(null)}>
            <div style={{ background: colors.card, borderRadius: 12, width: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>🔑 API Keys — {apiKeysClient.company_name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Allowed: {apiKeysClient.allowed_domains?.join(', ') || <span style={{ color: colors.warning }}>⚠ Any domain</span>}</div>
                </div>
                <button onClick={() => setApiKeysClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.textMuted }}>×</button>
              </div>
              <div style={{ padding: 20, overflowY: 'auto' }}>
                {newKeyResult && (
                  <div style={{ background: colors.successLight, border: `1px solid ${colors.success}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: colors.success, marginBottom: 8 }}>✅ Save these now — secret shown only once!</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 4 }}>Key: <strong>{newKeyResult.api_key}</strong> <button onClick={() => navigator.clipboard.writeText(newKeyResult.api_key)} style={{ marginLeft: 6, background: 'none', border: `1px solid ${colors.success}`, borderRadius: 4, padding: '1px 6px', fontSize: 10, cursor: 'pointer', color: colors.success }}>📋</button></div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace' }}>Secret: <strong>{newKeyResult.api_secret}</strong> <button onClick={() => navigator.clipboard.writeText(newKeyResult.api_secret)} style={{ marginLeft: 6, background: 'none', border: `1px solid ${colors.success}`, borderRadius: 4, padding: '1px 6px', fontSize: 10, cursor: 'pointer', color: colors.success }}>📋</button></div>
                    <button onClick={() => setNewKeyResult(null)} style={{ marginTop: 8, background: 'none', border: `1px solid ${colors.success}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', color: colors.success }}>Dismiss</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateApiKey(apiKeysClient.id)}
                    placeholder="Key name (e.g. Production, Test)"
                    style={{ flex: 1, padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: colors.bg, color: colors.text }} />
                  <button onClick={() => generateApiKey(apiKeysClient.id)}
                    style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Generate</button>
                </div>
                {apiKeys.length === 0 && <div style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>No API keys yet</div>}
                {apiKeys.map(k => (
                  <div key={k.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{k.name}</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.textMuted, marginTop: 2 }}>
                          {k.api_key} <button onClick={() => navigator.clipboard.writeText(k.api_key)} style={{ marginLeft: 4, background: 'none', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, cursor: 'pointer', color: colors.textMuted }}>📋</button>
                        </div>
                        {k.api_secret && (
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.textMuted, marginTop: 2 }}>
                            Secret: {'•'.repeat(16)} <button onClick={() => navigator.clipboard.writeText(k.api_secret)} style={{ marginLeft: 4, background: 'none', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, cursor: 'pointer', color: colors.textMuted }}>📋 Copy</button>
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Created: {new Date(k.created_at).toLocaleDateString()}{k.last_used_at && ` · Last used: ${new Date(k.last_used_at).toLocaleDateString()}`}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ background: k.status === 'active' ? colors.successLight : colors.dangerLight, color: k.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{k.status}</span>
                        <button onClick={() => deleteApiKey(k.id, apiKeysClient.id)}
                          style={{ background: 'none', border: `1px solid ${colors.danger}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: colors.danger }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: 14, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: colors.text, marginBottom: 6 }}>Relay API</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: colors.textMuted, lineHeight: 1.8 }}>
                    POST https://api.ssgzone.in/api/v1/saas/integration/email/send<br/>
                    {`{ api_key, api_secret, to, subject, html, from_name, from_email }`}
                  </div>
                  {apiKeysClient.allowed_domains?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: colors.warning }}>⚠ from_email must be from: {apiKeysClient.allowed_domains.join(', ')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Identities Modal */}
        {identitiesClient && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIdentitiesClient(null)}>
            <div style={{ background: colors.card, borderRadius: 12, width: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>📧 Email Identities — {identitiesClient.company_name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Send-from addresses and aliases for this client</div>
                </div>
                <button onClick={() => setIdentitiesClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.textMuted }}>×</button>
              </div>
              <div style={{ padding: 20, overflowY: 'auto' }}>
                <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10 }}>Add New Identity</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={newIdentity.email_address} onChange={e => setNewIdentity(p => ({ ...p, email_address: e.target.value }))}
                      placeholder="info@vastiqonline.in"
                      style={{ padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }} />
                    <input value={newIdentity.display_name} onChange={e => setNewIdentity(p => ({ ...p, display_name: e.target.value }))}
                      placeholder="Display Name (e.g. VastiQ Support)"
                      style={{ padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }} />
                    <select value={newIdentity.identity_type} onChange={e => setNewIdentity(p => ({ ...p, identity_type: e.target.value }))}
                      style={{ padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }}>
                      <option value="send-only">Send-Only (relay from this address)</option>
                      <option value="alias">Alias (forward incoming to another address)</option>
                    </select>
                    {newIdentity.identity_type === 'alias' && (
                      <input value={newIdentity.forwards_to} onChange={e => setNewIdentity(p => ({ ...p, forwards_to: e.target.value }))}
                        placeholder="Forwards to (e.g. admin@vastiqonline.in)"
                        style={{ padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: colors.card, color: colors.text }} />
                    )}
                  </div>
                  <button onClick={() => addIdentity(identitiesClient.id)}
                    style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Identity</button>
                </div>
                {identities.length === 0 && <div style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>No identities yet</div>}
                {identities.map(ident => (
                  <div key={ident.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{ident.display_name || ident.email_address}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.textMuted }}>{ident.email_address}</div>
                      {ident.forwards_to && <div style={{ fontSize: 11, color: colors.textMuted }}>→ {ident.forwards_to}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ background: ident.identity_type === 'alias' ? colors.cyanLight : colors.primaryLight, color: ident.identity_type === 'alias' ? colors.cyan : colors.primary, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{ident.identity_type}</span>
                      <span style={{ background: ident.status === 'active' ? colors.successLight : colors.dangerLight, color: ident.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{ident.status}</span>
                      <button onClick={() => deleteIdentity(ident.id, identitiesClient.id)}
                        style={{ background: 'none', border: `1px solid ${colors.danger}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: colors.danger }}>Delete</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: 12, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted }}>
                  <strong style={{ color: colors.text }}>Send-Only:</strong> Use as <code>from_email</code> in relay API. &nbsp;
                  <strong style={{ color: colors.text }}>Alias:</strong> Forwards incoming mail to target mailbox.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GDPRSection = () => {
    const [gdprTab, setGdprTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [stats, setGdprStats] = useState(null);
    const [retentionPolicies, setRetentionPolicies] = useState([]);
    const [auditTrail, setAuditTrail] = useState(null);
    const [auditRequest, setAuditRequest] = useState(null);
    const [newRequest, setNewRequest] = useState({ user_email: '', tenant_id: '', delay_hours: 72 });
    const [retentionForm, setRetentionForm] = useState({ tenant_id: '', inbox_days: 365, sent_days: 365, trash_days: 30, spam_days: 7 });
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [showRetentionForm, setShowRetentionForm] = useState(false);
    const GDPR = 'https://api.ssgzone.in/api/v1/gdpr';

    const load = () => {
      apiFetch(`${GDPR}/requests`, { headers: authHeaders }).then(r => r.json()).then(d => d.success && setRequests(d.data));
      apiFetch(`${GDPR}/stats`, { headers: authHeaders }).then(r => r.json()).then(d => d.success && setGdprStats(d.data));
      apiFetch(`${GDPR}/retention`, { headers: authHeaders }).then(r => r.json()).then(d => d.success && setRetentionPolicies(d.data));
    };
    useEffect(() => { load(); }, []);

    const createRequest = async () => {
      if (!newRequest.user_email || !newRequest.tenant_id) return alert('Email and tenant required');
      const res = await apiFetch(`${GDPR}/requests`, {
        method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      const data = await res.json();
      if (data.success) { setShowNewRequest(false); setNewRequest({ user_email: '', tenant_id: '', delay_hours: 72 }); load(); }
      else alert(data.error);
    };

    const cancelRequest = async (id) => {
      if (!window.confirm('Cancel this deletion request?')) return;
      const res = await apiFetch(`${GDPR}/requests/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) load(); else alert(data.error);
    };

    const executeNow = async (id) => {
      if (!window.confirm('Execute deletion immediately? This cannot be undone.')) return;
      const res = await apiFetch(`${GDPR}/requests/${id}/execute`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (data.success) { alert('✅ Deletion triggered'); load(); } else alert(data.error);
    };

    const loadAudit = async (req) => {
      const res = await apiFetch(`${GDPR}/requests/${req.id}/audit`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setAuditTrail(data.data); setAuditRequest(req); }
    };

    const saveRetention = async () => {
      if (!retentionForm.tenant_id) return alert('Select a tenant');
      const res = await apiFetch(`${GDPR}/retention/${retentionForm.tenant_id}`, {
        method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(retentionForm)
      });
      const data = await res.json();
      if (data.success) { setShowRetentionForm(false); load(); alert('✅ Retention policy saved!'); }
      else alert(data.error);
    };

    const statusColors = {
      pending: { bg: colors.warningLight, color: colors.warning },
      processing: { bg: colors.cyanLight, color: colors.cyan },
      completed: { bg: colors.successLight, color: colors.success },
      failed: { bg: colors.dangerLight, color: colors.danger },
      cancelled: { bg: colors.border, color: colors.textMuted },
    };
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };

    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>GDPR & Compliance</div>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Manage right-to-erasure requests and data retention policies</div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
            {[['Pending', stats.pending, colors.warning], ['Processing', stats.processing, colors.cyan], ['Completed', stats.completed, colors.success], ['Failed', stats.failed, colors.danger], ['Total', stats.total, colors.primary]].map(([label, val, color]) => (
              <div key={label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>{val || 0}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
          {[['requests', '🗑 Deletion Requests'], ['retention', '⏱ Retention Policies']].map(([id, label]) => (
            <button key={id} onClick={() => setGdprTab(id)}
              style={{ padding: '9px 18px', border: 'none', borderBottom: gdprTab === id ? `2px solid ${colors.primary}` : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: gdprTab === id ? 700 : 400, color: gdprTab === id ? colors.primary : colors.textMuted, marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {gdprTab === 'requests' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: colors.textMuted }}>Right-to-erasure requests. Deletions execute after the scheduled delay.</div>
              <button onClick={() => setShowNewRequest(true)}
                style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + New Deletion Request
              </button>
            </div>

            {showNewRequest && (
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 14 }}>New GDPR Deletion Request</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>User Email *</label>
                    <input style={inputS} value={newRequest.user_email} onChange={e => setNewRequest(p => ({ ...p, user_email: e.target.value }))} placeholder="user@tenant.ssgzone.in" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Tenant *</label>
                    <select style={inputS} value={newRequest.tenant_id} onChange={e => setNewRequest(p => ({ ...p, tenant_id: e.target.value }))}>
                      <option value="">Select Tenant</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Delay (hours)</label>
                    <select style={inputS} value={newRequest.delay_hours} onChange={e => setNewRequest(p => ({ ...p, delay_hours: parseInt(e.target.value) }))}>
                      <option value={0}>Immediate</option>
                      <option value={24}>24 hours</option>
                      <option value={72}>72 hours (default)</option>
                      <option value={168}>7 days</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={createRequest}
                    style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Submit Request</button>
                  <button onClick={() => setShowNewRequest(false)}
                    style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: colors.textMuted }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                  {['User Email', 'Tenant', 'Status', 'Requested', 'Scheduled For', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '10px 14px', color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>{r.user_email}</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12 }}>{r.tenant_name || r.tenant_id}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: statusColors[r.status]?.bg || colors.border, color: statusColors[r.status]?.color || colors.textMuted, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12 }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12 }}>{new Date(r.scheduled_for).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => loadAudit(r)}
                            style={{ background: colors.primaryLight, color: colors.primary, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>📋 Audit</button>
                          {r.status === 'pending' && (<>
                            <button onClick={() => executeNow(r.id)}
                              style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>⚡ Now</button>
                            <button onClick={() => cancelRequest(r.id)}
                              style={{ background: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>✕ Cancel</button>
                          </> )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>No deletion requests</td></tr>}
                </tbody>
              </table>
            </div>

            {auditTrail && auditRequest && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAuditTrail(null)}>
                <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Audit Trail</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>{auditRequest.user_email}</div>
                  {auditTrail.length === 0 && <div style={{ color: colors.textMuted, fontSize: 13 }}>No audit steps recorded yet</div>}
                  {auditTrail.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16 }}>{step.status === 'completed' ? '✅' : '❌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{step.step}</div>
                        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{JSON.stringify(step.details)}</div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>{new Date(step.completed_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button onClick={() => setAuditTrail(null)} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {gdprTab === 'retention' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: colors.textMuted }}>Set how long emails are retained per folder for each tenant.</div>
              <button onClick={() => setShowRetentionForm(true)}
                style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Set Policy</button>
            </div>

            {showRetentionForm && (
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 14 }}>Set Retention Policy</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Tenant *</label>
                    <select style={inputS} value={retentionForm.tenant_id} onChange={e => setRetentionForm(p => ({ ...p, tenant_id: e.target.value }))}>
                      <option value="">Select</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                    </select>
                  </div>
                  {[['inbox_days', 'Inbox (days)'], ['sent_days', 'Sent (days)'], ['trash_days', 'Trash (days)'], ['spam_days', 'Spam (days)']].map(([key, label]) => (
                    <div key={key}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' }}>{label}</label>
                      <input type="number" style={inputS} value={retentionForm[key]} onChange={e => setRetentionForm(p => ({ ...p, [key]: parseInt(e.target.value) }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveRetention}
                    style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save Policy</button>
                  <button onClick={() => setShowRetentionForm(false)}
                    style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: colors.textMuted }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                  {['Tenant', 'Inbox', 'Sent', 'Trash', 'Spam', 'Active'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {retentionPolicies.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: colors.text }}>{p.company_name}</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted }}>{p.inbox_days}d</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted }}>{p.sent_days}d</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted }}>{p.trash_days}d</td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted }}>{p.spam_days}d</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: p.is_active ? colors.successLight : colors.dangerLight, color: p.is_active ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{p.is_active ? 'Active' : 'Paused'}</span>
                      </td>
                    </tr>
                  ))}
                  {retentionPolicies.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>No retention policies set — default: emails kept indefinitely</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const BillingSection = () => {
    const BAPI = 'https://api.ssgzone.in/api/v1/billing';
    const [billingTab, setBillingTab] = React.useState('plans');
    const [plans, setPlans] = React.useState([]);
    const [subscriptions, setSubscriptions] = React.useState([]);
    const [subStats, setSubStats] = React.useState({});
    const [openPlanDialog, setOpenPlanDialog] = React.useState(false);
    const [openSubDialog, setOpenSubDialog] = React.useState(false);
    const [editingPlan, setEditingPlan] = React.useState(null);
    const [deletingPlan, setDeletingPlan] = React.useState(null);
    const [assigningSub, setAssigningSub] = React.useState(null); // saas row
    const [saasFilter, setSaasFilter] = React.useState('');
    const [planForm, setPlanForm] = React.useState({ saas_app_id: '', name: '', slug: '', price_monthly: 0, price_yearly: 0, currency: 'INR', max_users: 10, max_storage_gb: 5, max_emails_per_month: 1000, features: {}, sort_order: 0, is_standard: false });
    const [subForm, setSubForm] = React.useState({ plan_id: '', billing_cycle: 'monthly', custom_price: '', currency: 'INR', status: 'active', notes: '' });
    const [saving, setSaving] = React.useState(false);

    const fetchPlans = async () => {
      const q = saasFilter ? `?saas_app_id=${saasFilter}` : '';
      const res = await apiFetch(`${BAPI}/super-admin/plans${q}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setPlans(data.data);
    };

    const fetchSubscriptions = async () => {
      const res = await apiFetch(`${BAPI}/super-admin/subscriptions`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setSubscriptions(data.data); setSubStats(data.stats || {}); }
    };

    React.useEffect(() => { fetchPlans(); fetchSubscriptions(); }, [saasFilter]);

    const openCreate = () => {
      setEditingPlan(null);
      setPlanForm({ saas_app_id: saasFilter || '', name: '', slug: '', price_monthly: 0, price_yearly: 0, currency: 'INR', max_users: 10, max_storage_gb: 5, max_emails_per_month: 1000, features: {}, sort_order: 0, is_standard: false });
      setOpenPlanDialog(true);
    };

    const openEdit = (plan) => {
      setEditingPlan(plan);
      setPlanForm({ saas_app_id: plan.saas_app_id || '', name: plan.name, slug: plan.slug, price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, currency: plan.currency, max_users: plan.max_users, max_storage_gb: plan.max_storage_gb, max_emails_per_month: plan.max_emails_per_month, features: plan.features || {}, sort_order: plan.sort_order || 0, is_standard: plan.is_standard || false });
      setOpenPlanDialog(true);
    };

    const savePlan = async () => {
      if (!planForm.name || !planForm.slug) return alert('Name and Slug required');
      if (!planForm.is_standard && !planForm.saas_app_id) return alert('SaaS App required (or enable Standard Plan)');
      setSaving(true);
      try {
        const url = editingPlan ? `${BAPI}/super-admin/plans/${editingPlan.id}` : `${BAPI}/super-admin/plans`;
        const method = editingPlan ? 'PUT' : 'POST';
        const res = await apiFetch(url, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(planForm) });
        const data = await res.json();
        if (data.success) { setOpenPlanDialog(false); fetchPlans(); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSaving(false);
    };

    const deletePlan = async () => {
      const res = await apiFetch(`${BAPI}/super-admin/plans/${deletingPlan.id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) { setDeletingPlan(null); fetchPlans(); }
      else alert(data.error);
    };

    const openAssignSub = (row) => {
      setAssigningSub(row);
      setSubForm({ plan_id: row.plan_id || '', billing_cycle: row.billing_cycle || 'monthly', custom_price: row.custom_price || '', currency: row.currency || 'INR', status: row.status || 'active', notes: row.notes || '' });
      setOpenSubDialog(true);
    };

    const saveSub = async () => {
      if (!subForm.plan_id) return alert('Plan required');
      setSaving(true);
      try {
        const res = await apiFetch(`${BAPI}/super-admin/subscriptions`, {
          method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ saas_app_id: assigningSub.id, ...subForm, custom_price: subForm.custom_price || null })
        });
        const data = await res.json();
        if (data.success) { setOpenSubDialog(false); fetchSubscriptions(); }
        else alert(data.error);
      } catch (err) { alert(err.message); }
      setSaving(false);
    };

    const removeSub = async (saasAppId) => {
      if (!window.confirm('Remove subscription?')) return;
      const res = await apiFetch(`${BAPI}/super-admin/subscriptions/${saasAppId}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) fetchSubscriptions(); else alert(data.error);
    };

    const featureKeys = ['email', 'chat', 'whatsapp', 'video', 'drive', 'notifications', 'custom_domain'];
    const statusColors = { active: { bg: colors.successLight, color: colors.success }, trial: { bg: colors.cyanLight, color: colors.cyan }, past_due: { bg: colors.dangerLight, color: colors.danger }, cancelled: { bg: colors.border, color: colors.textMuted }, suspended: { bg: colors.warningLight, color: colors.warning } };
    const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
    const labelS = { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4, display: 'block' };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>Billing Management</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Create and manage billing plans for SaaS applications</div>
          </div>
          {billingTab === 'plans' && (
            <button onClick={openCreate} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Create Plan</button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[['Active', subStats.active, colors.success], ['Trial', subStats.trial, colors.cyan], ['Past Due', subStats.past_due, colors.danger], ['Unsubscribed', subStats.unsubscribed, colors.warning]].map(([label, val, color]) => (
            <div key={label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{val || 0}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{label} SaaS</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
          {[['plans', '💳 SSGzone Plans'], ['subscriptions', '🏢 SaaS Subscriptions']].map(([id, label]) => (
            <button key={id} onClick={() => setBillingTab(id)}
              style={{ padding: '9px 18px', border: 'none', borderBottom: billingTab === id ? `2px solid ${colors.primary}` : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: billingTab === id ? 700 : 400, color: billingTab === id ? colors.primary : colors.textMuted, marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {billingTab === 'plans' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <select value={saasFilter} onChange={e => setSaasFilter(e.target.value)}
                style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', minWidth: 220 }}>
                <option value="">All SaaS Applications</option>
                {saasApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                  {['Plan Name', 'SaaS App', 'Monthly', 'Yearly', 'Max Users', 'Storage', 'Tenants', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {plans.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>
                        {p.name}
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'monospace' }}>{p.slug}</span>
                          {p.is_standard && <span style={{ background: colors.cyanLight, color: colors.cyan, borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>STANDARD</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{p.is_standard ? <span style={{ color: colors.cyan }}>All Apps</span> : p.saas_name}</td>
                      <td style={{ padding: '12px 16px', color: colors.text, fontWeight: 600 }}>{p.currency} {Number(p.price_monthly).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: colors.textMuted }}>{p.currency} {Number(p.price_yearly).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>{p.max_users}</td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>{p.max_storage_gb} GB</td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>{p.tenant_count || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: p.is_active ? colors.successLight : colors.dangerLight, color: p.is_active ? colors.success : colors.danger, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(p)} style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                          <button onClick={() => setDeletingPlan(p)} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No billing plans yet. Create one to get started.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {billingTab === 'subscriptions' && (
          <div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Assign SSGzone plans to SaaS applications. SaaS will manage their own tenant billing independently.</div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                  {['SaaS App', 'Plan', 'Quota (Users/Storage/Emails)', 'Status', 'Billing Cycle', 'Next Billing', 'Tenants', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {subscriptions.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>
                        {row.saas_name}
                        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{row.saas_slug}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>{row.plan_name || <span style={{ color: colors.textMuted }}>—</span>}</td>
                      <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>
                        {row.plan_name ? `${row.max_users} users / ${row.max_storage_gb}GB / ${(row.max_emails_per_month||0).toLocaleString()} emails` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.status
                          ? <span style={{ background: (statusColors[row.status]||{}).bg||colors.border, color: (statusColors[row.status]||{}).color||colors.textMuted, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{row.status}</span>
                          : <span style={{ color: colors.warning, fontSize: 12 }}>Not subscribed</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{row.billing_cycle || '—'}</td>
                      <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: 12 }}>{row.next_billing_date ? new Date(row.next_billing_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>{row.tenant_count || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openAssignSub(row)} style={{ background: colors.primaryLight, color: colors.primary, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                            {row.status ? '✏ Update' : '+ Assign'}
                          </button>
                          {row.status && <button onClick={() => removeSub(row.id)} style={{ background: colors.dangerLight, color: colors.danger, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>🗑</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: colors.textMuted }}>No SaaS applications found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assign Subscription Dialog */}
        {openSubDialog && assigningSub && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenSubDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Assign Plan — {assigningSub.saas_name}</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>SaaS will manage its own tenant billing within this quota</div>
              <label style={labelS}>SSGzone Plan *</label>
              <select style={inputS} value={subForm.plan_id} onChange={e => setSubForm(p => ({ ...p, plan_id: e.target.value }))}>
                <option value="">Select Plan</option>
                {plans.filter(p => p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.currency} {Number(p.price_monthly).toLocaleString()}/mo ({p.max_users} users, {p.max_storage_gb}GB)</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelS}>Billing Cycle</label>
                  <select style={inputS} value={subForm.billing_cycle} onChange={e => setSubForm(p => ({ ...p, billing_cycle: e.target.value }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div><label style={labelS}>Status</label>
                  <select style={inputS} value={subForm.status} onChange={e => setSubForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="past_due">Past Due</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div><label style={labelS}>Custom Price (optional)</label><input type="number" style={inputS} value={subForm.custom_price} onChange={e => setSubForm(p => ({ ...p, custom_price: e.target.value }))} placeholder="Leave blank for plan price" /></div>
                <div><label style={labelS}>Currency</label>
                  <select style={inputS} value={subForm.currency} onChange={e => setSubForm(p => ({ ...p, currency: e.target.value }))}>
                    {['INR','USD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label style={labelS}>Notes</label>
              <textarea style={{ ...inputS, height: 60, resize: 'none' }} value={subForm.notes} onChange={e => setSubForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenSubDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} onClick={saveSub} disabled={saving}>{saving ? 'Saving...' : 'Assign Plan'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Plan Dialog */}
        {openPlanDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenPlanDialog(false)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>{editingPlan ? 'Edit Billing Plan' : 'Create Billing Plan'}</div>
              {/* Standard Plan Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 14px', background: planForm.is_standard ? colors.cyanLight : colors.bg, borderRadius: 8, border: `1px solid ${planForm.is_standard ? colors.cyan : colors.border}` }}>
                <div onClick={() => !editingPlan && setPlanForm(p => ({ ...p, is_standard: !p.is_standard, saas_app_id: '' }))}
                  style={{ width: 44, height: 24, borderRadius: 12, background: planForm.is_standard ? colors.cyan : colors.border, cursor: editingPlan ? 'not-allowed' : 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: planForm.is_standard ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Standard Plan</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>Visible to all SaaS apps — for generic/public pricing display</div>
                </div>
              </div>
              {!planForm.is_standard && (<>
                <label style={labelS}>SaaS Application *</label>
                <select style={inputS} value={planForm.saas_app_id} onChange={e => setPlanForm(p => ({ ...p, saas_app_id: e.target.value }))} disabled={!!editingPlan}>
                  <option value="">Select SaaS App</option>
                  {saasApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </>)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelS}>Plan Name *</label><input style={inputS} value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Starter" /></div>
                <div><label style={labelS}>Slug *</label><input style={inputS} value={planForm.slug} onChange={e => setPlanForm(p => ({ ...p, slug: e.target.value.toLowerCase() }))} placeholder="e.g. starter" disabled={!!editingPlan} /></div>
                <div><label style={labelS}>Monthly Price</label><input type="number" style={inputS} value={planForm.price_monthly} onChange={e => setPlanForm(p => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))} /></div>
                <div><label style={labelS}>Yearly Price</label><input type="number" style={inputS} value={planForm.price_yearly} onChange={e => setPlanForm(p => ({ ...p, price_yearly: parseFloat(e.target.value) || 0 }))} /></div>
                <div><label style={labelS}>Max Users</label><input type="number" style={inputS} value={planForm.max_users} onChange={e => setPlanForm(p => ({ ...p, max_users: parseInt(e.target.value) || 10 }))} /></div>
                <div><label style={labelS}>Storage (GB)</label><input type="number" style={inputS} value={planForm.max_storage_gb} onChange={e => setPlanForm(p => ({ ...p, max_storage_gb: parseInt(e.target.value) || 5 }))} /></div>
                <div><label style={labelS}>Emails/Month</label><input type="number" style={inputS} value={planForm.max_emails_per_month} onChange={e => setPlanForm(p => ({ ...p, max_emails_per_month: parseInt(e.target.value) || 1000 }))} /></div>
                <div><label style={labelS}>Currency</label>
                  <select style={inputS} value={planForm.currency} onChange={e => setPlanForm(p => ({ ...p, currency: e.target.value }))}>
                    {['INR','USD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label style={labelS}>Included Features</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {featureKeys.map(key => {
                  const on = planForm.features[key] !== false && planForm.features[key] !== undefined ? planForm.features[key] : false;
                  return (
                    <div key={key} onClick={() => setPlanForm(p => ({ ...p, features: { ...p.features, [key]: !on } }))}
                      style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${on ? colors.primary : colors.border}`, background: on ? colors.primaryLight : 'transparent', color: on ? colors.primary : colors.textMuted, fontSize: 12, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>
                      {on ? '✓' : '+'} {key}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setOpenPlanDialog(false)}>Cancel</button>
                <button style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} onClick={savePlan} disabled={saving}>{saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deletingPlan && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeletingPlan(null)}>
            <div style={{ background: colors.card, borderRadius: 12, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Delete Plan</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Delete <strong>{deletingPlan.name}</strong>? This cannot be undone. Plans assigned to tenants cannot be deleted.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeletingPlan(null)}>Cancel</button>
                <button style={{ background: colors.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={deletePlan}>Delete</button>
              </div>
            </div>
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
                📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 6*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              <EnhancedMetricCard title="Emails Sent" value={stats.emailsSent || 0} icon="✉️" trend="vs last 7 days" trendPercent={stats.emailsSentTrend || 0} bgColor="#eef2ff" borderColor="#667eea" />
              <EnhancedMetricCard title="Delivery Rate" value={(stats.deliveryRate || 0).toFixed(1)} icon="📤" trend="vs last 7 days" trendPercent={stats.deliveryRateTrend || 0} bgColor="#d1fae5" borderColor="#10b981" />
              <EnhancedMetricCard title="Active Tenants" value={stats.totalTenants || 0} icon="🏢" trend="Real-time" trendPercent={stats.tenantsTrend || 0} bgColor="#cffafe" borderColor="#06b6d4" />
              <EnhancedMetricCard title="Total Users" value={stats.totalUsers || 0} icon="👥" trend="Real-time" trendPercent={stats.usersTrend || 0} bgColor="#fef3c7" borderColor="#f59e0b" />
              <EnhancedMetricCard title="Emails Today" value={stats.emailsToday || 0} icon="📧" trend="vs yesterday" trendPercent={stats.emailsTodayTrend || 0} bgColor="#ede9fe" borderColor="#8b5cf6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <EmailOverview stats={{ sent: stats.emailsSent || 0, received: stats.emailsReceived || 0, failed: stats.emailsFailed || 0, bounced: stats.emailsBounced || 0, spam: stats.emailsSpam || 0, deliveryRate: stats.deliveryRate || 0, chartData: stats.chartData || [] }} />
              <EmailHealthMetrics stats={stats.healthMetrics || { uptime: 0, avgDeliveryTime: 0, spamScore: 0, dkimStatus: 'pending', spfStatus: 'pending', dmarcStatus: 'pending', tlsEnabled: false, apiHealth: 'checking' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <SystemActivity activities={stats.activities || []} />
              <StorageUsage stats={{ used: stats.storageUsed || 0, total: stats.storageTotal || 1000, percentage: stats.storagePercentage || 0, breakdown: stats.storageBreakdown || {} }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div>
                <TopTenants />
                <RecentCampaigns />
                <RecentUsers />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </div>
        );
      case 'billing': return <BillingSection />;
      case 'applications': return <ApplicationsSection />;
      case 'tenants': return <TenantsSection />;
      case 'users': return <UsersSection />;
      case 'email': return <EmailSection />;
      case 'scheduled': return <ScheduledSection />;
      case 'compose': return <ComposeSection />;
      case 'templates': return <TemplatesSection />;
      case 'permissions': return <PermissionsSection />;
      case 'admins': return <AdminsSection />;
      case 'direct-clients': return <DirectClientsSection />;
      case 'gdpr': return <GDPRSection />;
      case 'settings': return <SettingsSection />;
      case 'mailboxes': return <MailboxSection />;
      case 'reports': return (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Reports</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Platform-wide summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[['Total Tenants', reports.tenants.length, '🏢', colors.primary], ['Total Users', stats.totalUsers || 0, '👥', colors.success], ['Emails Today', stats.emailsToday || 0, '📧', colors.warning]].map(([label, value, icon, color]) => (
              <div key={label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
                <div><div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{value}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 14 }}>Top Tenants by User Count</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Company', 'Users', 'Plan', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
                </tr></thead>
                <tbody>{[...reports.tenants].sort((a, b) => (b.user_count || 0) - (a.user_count || 0)).slice(0, 8).map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '10px', color: colors.text, fontWeight: 500 }}>{t.company_name}</td>
                    <td style={{ padding: '10px', color: colors.text }}>{t.user_count || 0}</td>
                    <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{t.plan_type || '—'}</td>
                    <td style={{ padding: '10px' }}><span style={{ background: t.status === 'active' ? colors.successLight : colors.dangerLight, color: t.status === 'active' ? colors.success : colors.danger, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{t.status}</span></td>
                  </tr>
                ))}
                {reports.tenants.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No tenants</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 14 }}>Recent Support Tickets</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Subject', 'Tenant', 'Priority', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
                </tr></thead>
                <tbody>{reports.tickets.slice(0, 8).map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '10px', color: colors.text, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{t.tenant_name || '—'}</td>
                    <td style={{ padding: '10px' }}><span style={{ background: t.priority === 'high' ? colors.dangerLight : t.priority === 'medium' ? colors.warningLight : colors.successLight, color: t.priority === 'high' ? colors.danger : t.priority === 'medium' ? colors.warning : colors.success, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{t.priority}</span></td>
                    <td style={{ padding: '10px' }}><span style={{ background: t.status === 'resolved' ? colors.successLight : t.status === 'in_progress' ? colors.cyanLight : colors.warningLight, color: t.status === 'resolved' ? colors.success : t.status === 'in_progress' ? colors.cyan : colors.warning, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{t.status}</span></td>
                  </tr>
                ))}
                {reports.tickets.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No tickets</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 'analytics': {
        const emailsToday = analytics.stats.emailsToday || 0;
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const barVals = analytics.stats.chartData?.length === 7
          ? analytics.stats.chartData.map(d => d.count || 0)
          : days.map((_, i) => {
              const base = Math.floor((analytics.stats.emailsToday || 0) / 7);
              return Math.max(0, base + (i % 3 === 0 ? 2 : i % 2 === 0 ? -1 : 0));
            });
        const maxBar = Math.max(...barVals, 1);
        return (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Email Analytics</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Platform activity overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[['Active SaaS Apps', analytics.stats.totalSaasApps, '▦', colors.primary], ['Active Tenants', analytics.stats.totalTenants, '🏢', colors.cyan], ['Active Users', analytics.stats.totalUsers, '👥', colors.success], ['Emails Today', analytics.stats.emailsToday, '📧', colors.warning]].map(([label, value, icon, color]) => (
                <div key={label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                  <div><div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{value ?? '—'}</div></div>
                </div>
              ))}
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Email Volume (Last 7 Days)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
                {barVals.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{v}</div>
                    <div style={{ width: '100%', background: colors.primary, borderRadius: '4px 4px 0 0', height: `${Math.round((v / maxBar) * 80)}px`, minHeight: 4 }} />
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{days[i]}</div>
                  </div>
                ))}
              </div>
              {!analytics.stats.chartData && (
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
                  * Estimated distribution — connect analytics API for real daily data
                </div>
              )}
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 14 }}>Recent Tenant Growth (Top 10)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Company', 'SaaS App', 'Users', 'Created'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
                </tr></thead>
                <tbody>{analytics.tenants.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '10px', color: colors.text, fontWeight: 500 }}>{t.company_name}</td>
                    <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{t.saas_app_name || '—'}</td>
                    <td style={{ padding: '10px', color: colors.text }}>{t.user_count || 0}</td>
                    <td style={{ padding: '10px', color: colors.textMuted, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {analytics.tenants.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case 'security': return (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Security & Logs</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Platform security overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>🔐 2FA Status — Super Admins</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1, background: colors.successLight, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colors.success }}>{securityStats.admins_2fa_enabled ?? '—'}</div>
                  <div style={{ fontSize: 12, color: colors.success }}>2FA Enabled</div>
                </div>
                <div style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{securityStats.admins_total ?? '—'}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>Total Admins</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                {securityStats.admins_total > 0 ? `${Math.round((securityStats.admins_2fa_enabled / securityStats.admins_total) * 100)}% of super admins have 2FA enabled` : 'No super admins found'}
              </div>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>🔐 2FA Status — Platform Employees</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1, background: colors.successLight, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colors.success }}>{securityStats.employees_2fa_enabled ?? '—'}</div>
                  <div style={{ fontSize: 12, color: colors.success }}>2FA Enabled</div>
                </div>
                <div style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{securityStats.employees_total ?? '—'}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>Total Employees</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                {securityStats.employees_total > 0 ? `${Math.round((securityStats.employees_2fa_enabled / securityStats.employees_total) * 100)}% of employees have 2FA enabled` : 'No employees found'}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 12 }}>⚙ Password Policy</div>
              {[['Min Password Length', `${securityStats.branding?.password_min_length || 8} characters`], ['Session Timeout', `${(securityStats.branding?.session_timeout || 480) / 60} hours`]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 13 }}>
                  <span style={{ color: colors.textMuted }}>{k}</span>
                  <span style={{ fontWeight: 600, color: colors.text }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 12 }}>Edit in Settings → Security tab</div>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 12 }}>🕐 Active Sessions</div>
              <div style={{ color: colors.textMuted, fontSize: 13, padding: '20px 0' }}>Session management coming soon</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 12, marginTop: 8 }}>⚠ Failed Login Attempts</div>
              <div style={{ color: colors.textMuted, fontSize: 13 }}>Audit log coming soon</div>
            </div>
          </div>
        </div>
      );
      case 'audit': return (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Audit Logs</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Platform activity trail — {auditTotal} total records</div>
          {auditMsg ? (
            <div style={{ background: colors.warningLight, border: `1px solid ${colors.warning}`, borderRadius: 12, padding: 24, color: colors.warning, fontSize: 13 }}>
              ℹ️ {auditMsg}. Run a migration to enable audit logging.
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={auditFilters.action} onChange={e => { setAuditFilters(f => ({ ...f, action: e.target.value })); setAuditPage(1); }}
                  placeholder="Filter by action..."
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', minWidth: 180 }} />
                <input value={auditFilters.actor_id} onChange={e => { setAuditFilters(f => ({ ...f, actor_id: e.target.value })); setAuditPage(1); }}
                  placeholder="Actor ID..."
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', width: 120 }} />
                <select value={auditFilters.tenant_id} onChange={e => { setAuditFilters(f => ({ ...f, tenant_id: e.target.value })); setAuditPage(1); }}
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.text, background: colors.card, outline: 'none', minWidth: 180 }}>
                  <option value="">All Tenants</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                </select>
                {(auditFilters.action || auditFilters.actor_id || auditFilters.tenant_id) && (
                  <button onClick={() => { setAuditFilters({ action: '', tenant_id: '', actor_id: '' }); setAuditPage(1); }}
                    style={{ padding: '8px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: colors.textMuted }}>✕ Clear</button>
                )}
              </div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                    {['Timestamp', 'Actor', 'Action', 'Target', 'Tenant', 'IP', 'Details'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {auditLogs.map((log, i) => (
                      <tr key={log.id || i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: colors.text, fontSize: 12 }}>{log.actor_id || '—'}<br/><span style={{ fontSize: 10, color: colors.textMuted }}>{log.actor_type}</span></td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: colors.primary, fontSize: 12 }}>{log.action}</td>
                        <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12 }}>{log.target_type ? `${log.target_type}:${log.target_id}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 11 }}>{log.tenant_id || '—'}</td>
                        <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 11, fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11 }}>
                          {log.details ? (
                            <details style={{ cursor: 'pointer' }}>
                              <summary style={{ color: colors.primary, fontSize: 11 }}>View</summary>
                              <pre style={{ fontSize: 10, color: colors.text, background: colors.bg, padding: 8, borderRadius: 4, marginTop: 4, maxWidth: 240, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>No audit logs found</td></tr>}
                  </tbody>
                </table>
              </div>
              {auditTotal > 25 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)}
                    style={{ padding: '6px 14px', border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.card, color: colors.text, cursor: auditPage === 1 ? 'not-allowed' : 'pointer', opacity: auditPage === 1 ? 0.5 : 1 }}>← Prev</button>
                  <span style={{ fontSize: 13, color: colors.textMuted }}>Page {auditPage} of {Math.ceil(auditTotal / 25)}</span>
                  <button disabled={auditPage >= Math.ceil(auditTotal / 25)} onClick={() => setAuditPage(p => p + 1)}
                    style={{ padding: '6px 14px', border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.card, color: colors.text, cursor: 'pointer' }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      );

      case 'drafts': return (
        <div>
          <h2 style={{ marginBottom: 20, fontSize: 22, fontWeight: 700, color: colors.text }}>Drafts</h2>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24, color: colors.textMuted, fontSize: 13 }}>Draft emails will appear here.</div>
        </div>
      );
      case 'trash': return (
        <div>
          <h2 style={{ marginBottom: 20, fontSize: 22, fontWeight: 700, color: colors.text }}>Trash</h2>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24, color: colors.textMuted, fontSize: 13 }}>Deleted items will appear here.</div>
        </div>
      );
      case 'spam': return (
        <div>
          <h2 style={{ marginBottom: 20, fontSize: 22, fontWeight: 700, color: colors.text }}>Spam</h2>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24, color: colors.textMuted, fontSize: 13 }}>Spam emails will appear here.</div>
        </div>
      );
      case 'system-config': return (
        <div>
          <h2 style={{ marginBottom: 20, fontSize: 22, fontWeight: 700, color: colors.text }}>System Configuration</h2>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24, color: colors.textMuted, fontSize: 13 }}>System configuration settings — coming soon.</div>
        </div>
      );
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
      {openAddUserDialog && (
        <div style={modalStyle} onClick={() => setOpenAddUserDialog(false)}>
          <div style={{ ...boxStyle, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Add New User</div>
            {addUserError && <div style={{ background: colors.dangerLight, color: colors.danger, borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{addUserError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input style={{ ...inputStyle, marginBottom: 0 }} value={addUserForm.first_name} onChange={e => setAddUserForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First Name" />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input style={{ ...inputStyle, marginBottom: 0 }} value={addUserForm.last_name} onChange={e => setAddUserForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last Name" />
              </div>
              <div>
                <label style={labelStyle}>Username *</label>
                <input style={{ ...inputStyle, marginBottom: 0 }} value={addUserForm.username} onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={{ ...inputStyle, marginBottom: 0 }} value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
              </div>
            </div>
            <label style={{ ...labelStyle, marginTop: 12 }}>Tenant *</label>
            <select style={inputStyle} value={addUserForm.tenant_id} onChange={e => setAddUserForm(f => ({ ...f, tenant_id: e.target.value }))}>
              <option value="">Select Tenant</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
            </select>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={addUserForm.role} onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
            <label style={labelStyle}>Password (leave blank to auto-generate)</label>
            <input type="password" style={inputStyle} value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generate if blank" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button style={btnSecondary} onClick={() => setOpenAddUserDialog(false)}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: addUserSaving ? 0.7 : 1 }} disabled={addUserSaving} onClick={handleAddUser}>{addUserSaving ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
