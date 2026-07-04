import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import './i18n'; // Initialize i18n

import Login from './pages/Login';
import WebmailDashboard from './pages/WebmailDashboard';
import Inbox from './pages/Inbox';
import Compose from './pages/Compose';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './services/authService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<WebmailDashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/sent" element={<Inbox folder="Sent" />} />
          <Route path="/drafts" element={<Inbox folder="Drafts" />} />
          <Route path="/trash" element={<Inbox folder="Trash" />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;