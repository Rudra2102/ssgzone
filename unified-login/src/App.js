import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import UnifiedLogin from './UnifiedLogin';
import SuperAdminDashboard from './SuperAdminDashboard';
import TenantAdminDashboard from './TenantAdminDashboard';
import WebmailDashboard from './WebmailDashboard';
import SaasAdminDashboard from './SaasAdminDashboard';

const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif'
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<UnifiedLogin />} />
          <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/saas-admin" element={<SaasAdminDashboard />} />
          <Route path="/dashboard/tenant-admin" element={<TenantAdminDashboard />} />
          <Route path="/dashboard/webmail" element={<WebmailDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;