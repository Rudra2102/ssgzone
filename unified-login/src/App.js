import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UnifiedLogin from './UnifiedLogin';
import SuperAdminDashboard from './SuperAdminDashboard';
import TenantAdminDashboard from './TenantAdminDashboard';
import WebmailDashboard from './WebmailDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import SaasAdminDashboard from './SaasAdminDashboard';

function WebmailRoute() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    if (!ssoToken) { setReady(true); return; }
    fetch('https://api.ssgzone.in/api/v1/webmail/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sso_token: ssoToken })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('webmail_token', data.data.token);
          localStorage.setItem('user_data', JSON.stringify(data.data.user));
          const redirect = data.data.redirect_to;
          window.history.replaceState({}, '', '/dashboard/webmail');
          if (redirect) window.location.href = redirect;
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <WebmailDashboard />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnifiedLogin />} />
        <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/saas-admin" element={<SaasAdminDashboard />} />
        <Route path="/dashboard/tenant-admin" element={<TenantAdminDashboard />} />
        <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        <Route path="/dashboard/webmail" element={<WebmailRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
