import React, { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Button, Typography, Alert,
  Container, Avatar, InputAdornment, IconButton, Paper, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';

function UnifiedLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAState, setTwoFAState] = useState({ pending: false, temp_token: '' });
  const [twoFACode, setTwoFACode] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState('');

  // SSO auto-login on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    const sso = params.get('sso');
    const autoNav = params.get('autoNav') || 'dashboard';
    const tenant = params.get('tenant') || 'demo';

    if (sso) {
      // PEMS SSO: decode base64 token directly, no API call needed
      try {
        const decoded = atob(sso);
        const parts = decoded.split(':');
        if (parts.length >= 3) {
          const email = parts[0];
          const fullName = parts[2];
          localStorage.setItem('user_data', JSON.stringify({ email, full_name: fullName || email, id: btoa(email) }));
          localStorage.setItem('webmail_token', sso);
          localStorage.setItem('user_role', 'user');
          window.location.href = `/dashboard/webmail?autoNav=${autoNav}&tenant=${tenant}&embed=true`;
        }
      } catch (e) {}
    } else if (ssoToken) {
      handleSSOLogin(ssoToken);
    }
  }, []);

  const handleSSOLogin = async (ssoToken) => {
    setSsoLoading(true);
    setSsoError('');
    try {
      const response = await fetch('https://api.ssgzone.in/api/v1/saas/sso/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ssoToken })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('webmail_token', data.data.token);
        localStorage.setItem('user_role', 'user');
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        window.location.href = data.data.redirect_to || '/dashboard/webmail';
      } else {
        setSsoError(data.error || 'SSO login failed');
        setSsoLoading(false);
      }
    } catch (err) {
      setSsoError('SSO error. Please login manually.');
      setSsoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try all login endpoints to detect user role
      const endpoints = [
        { type: 'super_admin', endpoint: 'https://api.ssgzone.in/api/v1/super-admin/auth/login', tokenKey: 'super_admin_token' },
        { type: 'saas_admin', endpoint: 'https://api.ssgzone.in/api/saas-admin/login', tokenKey: 'saas_admin_token' },
        { type: 'tenant_admin', endpoint: 'https://api.ssgzone.in/api/v1/tenant-admin/auth/login', tokenKey: 'tenant_admin_token' },
        { type: 'user', endpoint: 'https://api.ssgzone.in/api/v1/webmail/auth/login', tokenKey: 'webmail_token' }
      ];

      for (const config of endpoints) {
        try {
          const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              (config.type === 'user' || config.type === 'saas_admin') ?
              { email: credentials.username, password: credentials.password } :
              credentials
            )
          });

          const data = await response.json();

          if (data.success) {
            if (data.requires_2fa) {
              setTwoFAState({ pending: true, temp_token: data.temp_token });
              setLoading(false);
              return;
            }
            localStorage.setItem(config.tokenKey, data.data.token);
            
            // Store user info and redirect to appropriate dashboard
            if (config.type === 'super_admin') {
              localStorage.setItem('user_role', 'super_admin');
              localStorage.setItem('user_data', JSON.stringify(data.data.admin));
              window.location.href = '/dashboard/super-admin';
            } else if (config.type === 'saas_admin') {
              localStorage.setItem('user_role', 'saas_admin');
              localStorage.setItem('user_data', JSON.stringify(data.data.admin));
              window.location.href = '/dashboard/saas-admin';
            } else if (config.type === 'tenant_admin') {
              localStorage.setItem('user_role', 'tenant_admin');
              localStorage.setItem('user_data', JSON.stringify(data.data.admin));
              window.location.href = '/dashboard/tenant-admin';
            } else {
              localStorage.setItem('user_role', 'user');
              localStorage.setItem('user_data', JSON.stringify(data.data.user));
              window.location.href = '/dashboard/webmail';
            }
            return;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }
      
      setError('Invalid credentials');
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (ssoLoading) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={24} sx={{ borderRadius: 4, p: 5, textAlign: 'center', minWidth: 320 }}>
          <CircularProgress size={48} sx={{ color: '#667eea', mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>Signing you in...</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Verifying your SSO credentials</Typography>
        </Paper>
      </Box>
    );
  }

  if (ssoError) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={24} sx={{ borderRadius: 4, p: 5, textAlign: 'center', minWidth: 320 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>⚠️</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>SSO Login Failed</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>{ssoError}</Typography>
          <Button variant="contained" onClick={() => { setSsoError(''); window.history.replaceState({}, '', '/'); }}
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            Back to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={24} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ p: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <LoginIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>SSGzone Mail</Typography>
            <Typography variant="body1">Login Portal</Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {twoFAState.pending ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Enter the 6-digit code from your authenticator app</div>
                <input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} maxLength={6}
                  placeholder="000000" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 20, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <button onClick={async () => {
                  const res = await fetch('https://api.ssgzone.in/api/v1/super-admin/2fa/verify', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ temp_token: twoFAState.temp_token, totp_token: twoFACode })
                  });
                  const d = await res.json();
                  if (d.success) {
                    localStorage.setItem('super_admin_token', d.data.token);
                    localStorage.setItem('user_data', JSON.stringify({ ...d.data.admin, type: 'super_admin' }));
                    window.location.href = '/dashboard/super-admin';
                  } else { alert(d.error); setTwoFACode(''); }
                }} style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Verify
                </button>
                <div onClick={() => setTwoFAState({ pending: false, temp_token: '' })} style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>← Back to login</div>
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              <TextField fullWidth label="Username / Email" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required sx={{ mb: 3 }} />
              <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required sx={{ mb: 4 }} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} startIcon={<LoginIcon />} sx={{ py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>{loading ? 'Signing in...' : 'Sign In'}</Button>
            </form>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default UnifiedLogin;