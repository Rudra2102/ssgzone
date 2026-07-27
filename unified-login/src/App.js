import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UnifiedLogin from './UnifiedLogin';
import SuperAdminDashboard from './SuperAdminDashboard';
import TenantAdminDashboard from './TenantAdminDashboard';
import WebmailDashboard from './WebmailDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import SaasAdminDashboard from './SaasAdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnifiedLogin />} />
        <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/saas-admin" element={<SaasAdminDashboard />} />
        <Route path="/dashboard/tenant-admin" element={<TenantAdminDashboard />} />
        <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        <Route path="/dashboard/webmail" element={<WebmailDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;