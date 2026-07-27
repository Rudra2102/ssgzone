import React, { useState, useEffect } from 'react';

function UnifiedLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAState, setTwoFAState] = useState({ pending: false, temp_token: '' });
  const [twoFACode, setTwoFACode] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    const sso = params.get('sso');
    const autoNav = params.get('autoNav') || 'dashboard';
    const tenant = params.get('tenant') || 'demo';

    if (sso) {
      try {
        const decoded = atob(sso);
        const parts = decoded.split(':');
        // SSO token format: email:timestamp:fullName — issued by PEMS integration
        // TODO: Replace with HMAC-signed token verification before production use with untrusted sources
        if (parts.length < 2) throw new Error('Invalid SSO token format');
        const timestamp = parseInt(parts[1]);
        if (Date.now() - timestamp > 5 * 60 * 1000) throw new Error('SSO token expired');
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
      const endpoints = [
        { type: 'super_admin',  endpoint: 'https://api.ssgzone.in/api/v1/super-admin/auth/login',  tokenKey: 'super_admin_token' },
        { type: 'saas_admin',   endpoint: 'https://api.ssgzone.in/api/saas-admin/login',            tokenKey: 'saas_admin_token' },
        { type: 'tenant_admin', endpoint: 'https://api.ssgzone.in/api/v1/tenant-admin/auth/login',  tokenKey: 'tenant_admin_token' },
        { type: 'user',         endpoint: 'https://api.ssgzone.in/api/v1/webmail/auth/login',       tokenKey: 'webmail_token' },
      ];
      for (const config of endpoints) {
        try {
          const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              (config.type === 'user' || config.type === 'saas_admin')
                ? { email: credentials.username, password: credentials.password }
                : credentials
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
            if (config.type === 'super_admin') {
              localStorage.setItem('super_admin_token', data.data.token);
              localStorage.setItem('user_data', JSON.stringify(data.data.admin));
              try {
                const payload = JSON.parse(atob(data.data.token.split('.')[1]));
                const role = payload.role || 'super_admin';
                localStorage.setItem('user_role', role);
                window.location.href = role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard/employee';
              } catch(e) {
                localStorage.setItem('user_role', 'super_admin');
                window.location.href = '/dashboard/super-admin';
              }
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
        } catch (err) {}
      }
      setError('Invalid credentials');
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const cardStyle = {
    background: '#fff', borderRadius: 16, width: 420, maxWidth: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
  };
  const gradBtn = {
    width: '100%', height: 44, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  };

  if (ssoLoading) {
    return (
      <div style={pageStyle}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Signing you in...</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Verifying your SSO credentials</div>
        </div>
      </div>
    );
  }

  if (ssoError) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>SSO Login Failed</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>{ssoError}</div>
          <button style={gradBtn} onClick={() => { setSsoError(''); window.history.replaceState({}, '', '/'); }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✉️</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>SSGzone Mail</div>
          <div style={{ fontSize: 14, color: '#fff', opacity: 0.85 }}>Login Portal</div>
        </div>

        {/* Form */}
        <div style={{ padding: 32 }}>
          {twoFAState.pending ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Two-Factor Authentication</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Enter the 6-digit code from your authenticator app</div>
              <input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} maxLength={6}
                placeholder="000000" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 20, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
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
              }} style={gradBtn}>Verify</button>
              <div onClick={() => setTwoFAState({ pending: false, temp_token: '' })}
                style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>← Back to login</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Username / Email</label>
                <input
                  type="text" required value={credentials.username}
                  onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                  style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={credentials.password}
                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    style={{ width: '100%', height: 44, padding: '0 44px 0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ ...gradBtn, opacity: loading ? 0.75 : 1 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedLogin;
