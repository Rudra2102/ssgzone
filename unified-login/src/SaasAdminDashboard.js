import React, { useEffect, useState } from 'react';

const API = 'https://api.ssgzone.in';

export default function SaasAdminDashboard() {
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [features, setFeatures] = useState([]);
  const [tenantPerms, setTenantPerms] = useState({});
  const [selectedTenant, setSelectedTenant] = useState('');
  const [apiKeys, setApiKeys] = useState(null);
  const [savingPerms, setSavingPerms] = useState(false);

  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('saas_admin_token');
  const auth = { Authorization: `Bearer ${token}` };

  const c = {
    primary: '#667eea', primaryLight: '#667eea22', success: '#10b981', successLight: '#d1fae5',
    warning: '#f59e0b', warningLight: '#fef3c7', danger: '#ef4444', dangerLight: '#fee2e2',
    text: '#1e293b', textMuted: '#64748b', border: '#e2e8f0', bg: '#f8fafc', card: '#ffffff'
  };

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetch(`${API}/api/saas-admin/dashboard/stats`, { headers: auth }).then(r => r.json()).then(d => d.success && setStats(d.data));
    fetch(`${API}/api/saas-admin/tenants`, { headers: auth }).then(r => r.json()).then(d => d.success && setTenants(d.data));
    fetch(`${API}/api/v1/permissions/features`).then(r => r.json()).then(d => d.success && setFeatures(d.data));
  }, []);

  useEffect(() => {
    if (!selectedTenant) return;
    fetch(`${API}/api/v1/permissions/tenant/${selectedTenant}`, { headers: auth })
      .then(r => r.json()).then(d => {
        if (d.success) {
          const map = {};
          d.data.forEach(f => { map[f.feature_key] = f.is_enabled; });
          setTenantPerms(map);
        }
      });
  }, [selectedTenant]);

  const loadApiKeys = () => {
    fetch(`${API}/api/saas-admin/api-keys`, { headers: auth }).then(r => r.json()).then(d => d.success && setApiKeys(d.data));
  };

  const savePerms = async () => {
    setSavingPerms(true);
    const res = await fetch(`${API}/api/v1/permissions/tenant/${selectedTenant}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: tenantPerms })
    });
    const data = await res.json();
    setSavingPerms(false);
    if (data.success) alert('✅ Tenant permissions saved!');
    else alert(data.error);
  };

  const logout = () => { localStorage.clear(); window.location.href = '/'; };

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tenants', label: 'Tenants', icon: '🏢' },
    { id: 'permissions', label: 'Tenant Permissions', icon: '🔑' },
    { id: 'api-keys', label: 'API Keys', icon: '🗝' },
  ];

  const Sidebar = () => (
    <div style={{ width: 220, minHeight: '100vh', background: c.card, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{user.saas_name || 'SaaS Admin'}</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{user.email}</div>
      </div>
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {nav.map(item => (
          <div key={item.id} onClick={() => { setSection(item.id); if (item.id === 'api-keys') loadApiKeys(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: section === item.id ? c.primaryLight : 'transparent', color: section === item.id ? c.primary : c.text, fontWeight: section === item.id ? 600 : 400, fontSize: 13 }}>
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

  const Dashboard = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>Welcome, {user.name || user.email}</div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>SaaS: {user.saas_name} · {user.saas_slug}</div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[['Total Tenants', stats.total_tenants, '🏢'], ['Active Tenants', stats.active_tenants, '✅'], ['Total Users', stats.total_users, '👥'], ['Active Users', stats.active_users, '🟢']].map(([label, val, icon]) => (
            <div key={label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.text }}>{val || 0}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: c.text, marginBottom: 12 }}>Your Enabled Features</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(user.permissions || {}).map(([key, val]) => (
            <span key={key} style={{ background: val ? c.successLight : c.dangerLight, color: val ? c.success : c.danger, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
              {val ? '✓' : '✗'} {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const TenantsView = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 20 }}>Tenants</div>
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
            {['Company', 'Domain', 'Plan', 'Users', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: c.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: c.text }}>{t.company_name}</td>
                <td style={{ padding: '12px 16px', color: c.textMuted, fontSize: 12, fontFamily: 'monospace' }}>{t.domain}</td>
                <td style={{ padding: '12px 16px', color: c.text }}>{t.plan_type || 'free'}</td>
                <td style={{ padding: '12px 16px', color: c.text }}>{t.user_count || 0} / {t.max_users}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: t.status === 'active' ? c.successLight : c.warningLight, color: t.status === 'active' ? c.success : c.warning, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                </td>
              </tr>
            ))}
            {!tenants.length && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: c.textMuted }}>No tenants yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PermissionsView = () => {
    const categories = [...new Set(features.map(f => f.category))];
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>Tenant Permissions</div>
        <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Assign feature access to your tenants (cannot exceed your own SaaS permissions)</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
            style={{ padding: '10px 14px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: c.text, background: c.card, outline: 'none', minWidth: 240 }}>
            <option value="">— Select Tenant —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
          </select>
          {selectedTenant && (
            <button onClick={savePerms} disabled={savingPerms}
              style={{ background: c.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingPerms ? 0.7 : 1 }}>
              {savingPerms ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        {selectedTenant && categories.map(cat => (
          <div key={cat} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{cat}</div>
            {features.filter(f => f.category === cat).map(f => {
              const saasAllows = user.permissions?.[f.feature_key] !== false;
              return (
                <div key={f.feature_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${c.border}`, opacity: saasAllows ? 1 : 0.4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{f.feature_name}</div>
                    {!saasAllows && <div style={{ fontSize: 11, color: c.danger }}>Not available in your SaaS plan</div>}
                  </div>
                  <div onClick={() => saasAllows && setTenantPerms(p => ({ ...p, [f.feature_key]: !p[f.feature_key] }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: (saasAllows && tenantPerms[f.feature_key]) ? c.success : c.border, cursor: saasAllows ? 'pointer' : 'not-allowed', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: (saasAllows && tenantPerms[f.feature_key]) ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {!selectedTenant && <div style={{ textAlign: 'center', padding: 60, color: c.textMuted }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div><div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Select a Tenant</div></div>}
      </div>
    );
  };

  const ApiKeysView = () => (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>API Keys</div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Use these credentials to integrate SSGzone Mail into your application</div>
      {apiKeys ? (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, maxWidth: 600 }}>
          <div style={{ background: c.warningLight, borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: c.warning }}>⚠ Keep these credentials secure. Never expose in client-side code.</div>
          {[['API Key', apiKeys.api_key], ['API Secret', apiKeys.api_secret], ['Webhook Secret', apiKeys.webhook_secret]].map(([label, val]) => val && (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>{label}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '10px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: c.text, wordBreak: 'break-all' }}>{val}</div>
                <button onClick={() => { navigator.clipboard.writeText(val); alert('Copied!'); }}
                  style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13 }}>📋</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: c.bg, borderRadius: 8, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 8 }}>SSO Integration Example</div>
            <pre style={{ fontSize: 11, fontFamily: 'monospace', color: c.textMuted, margin: 0, whiteSpace: 'pre-wrap' }}>{`POST https://api.ssgzone.in/api/saas-admin/sso/generate\nX-Api-Key: ${apiKeys.api_key || '<your-api-key>'}\n{\n  "user_email": "employee@yourapp.com",\n  "tenant_slug": "your-company"\n}`}</pre>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading...</div>
      )}
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'tenants': return <TenantsView />;
      case 'permissions': return <PermissionsView />;
      case 'api-keys': return <ApiKeysView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, padding: 28 }}>
        {renderSection()}
      </div>
    </div>
  );
}
