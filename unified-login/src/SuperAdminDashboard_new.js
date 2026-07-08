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

  const StatsRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
      <EnhancedMetricCard 
        title="Emails Sent" 
        value={12453} 
        icon="✉️" 
        trend="vs last 7 days"
        trendPercent={12.5}
        bgColor="#eef2ff"
        borderColor="#667eea"
      />
      <EnhancedMetricCard 
        title="Delivery Rate" 
        value={98.7} 
        icon="📤" 
        trend="vs last 7 days"
        trendPercent={2.3}
        bgColor="#d1fae5"
        borderColor="#10b981"
      />
      <EnhancedMetricCard 
        title="Active Tenants" 
        value={stats.totalTenants || 24} 
        icon="🏢" 
        trend="Real-time"
        trendPercent={14.3}
        bgColor="#cffafe"
        borderColor="#06b6d4"
      />
      <EnhancedMetricCard 
        title="Total Users" 
        value={stats.totalUsers || 1245} 
        icon="👥" 
        trend="Real-time"
        trendPercent={8.7}
        bgColor="#fef3c7"
        borderColor="#f59e0b"
      />
      <EnhancedMetricCard 
        title="Emails Today" 
        value={stats.emailsToday || 2345} 
        icon="📧" 
        trend="vs yesterday"
        trendPercent={-8.1}
        bgColor="#ede9fe"
        borderColor="#8b5cf6"
      />
    </div>
  );
