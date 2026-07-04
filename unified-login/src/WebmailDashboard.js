import React, { useState, useEffect } from 'react';

function WebmailDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [stats, setStats] = useState({ email: {}, chat: {}, whatsapp: {}, notifications: {} });
  const [emails, setEmails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('webmail_token');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, emailsRes, notifRes] = await Promise.all([
        fetch('/api/v1/communication/dashboard/stats/demo', { headers }),
        fetch(`/api/v1/communication/email/inbox/demo/${userData.email}`, { headers }),
        fetch(`/api/v1/communication/notifications/demo/${userData.id}`, { headers })
      ]);
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.stats || {}); }
      if (emailsRes.ok) { const d = await emailsRes.json(); setEmails(d.emails || []); }
      if (notifRes.ok) { const d = await notifRes.json(); setNotifications(d.notifications || []); }
    } catch (e) {}
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  const initials = userData.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const navSections = [
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
        { id: 'inbox', label: 'Email', icon: '✉', badge: stats.email?.unread_emails },
        { id: 'compose', label: 'Compose', icon: '✏' },
        { id: 'drafts', label: 'Drafts', icon: '📄', badge: 0 },
        { id: 'sent', label: 'Sent', icon: '➤' },
        { id: 'trash', label: 'Trash', icon: '🗑' },
        { id: 'spam', label: 'Spam', icon: '⚠' },
      ]
    },
    {
      title: 'COLLABORATION',
      items: [
        { id: 'chat', label: 'Team Chat', icon: '💬' },
        { id: 'contacts', label: 'Contacts', icon: '👥' },
        { id: 'groups', label: 'Groups', icon: '👤' },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports', icon: '📊' },
        { id: 'analytics', label: 'Email Analytics', icon: '📈' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Settings', icon: '⚙' },
        { id: 'profile', label: 'Account & Profile', icon: '👤' },
        { id: 'security', label: 'Security', icon: '🔒' },
      ]
    }
  ];

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: 0 }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: color, lineHeight: 1 }}>{value || 0}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: color, marginTop: 4, cursor: 'pointer' }}>View all →</div>
      </div>
    </div>
  );

  const recentActivity = [
    { text: 'Welcome to SSGzone Mail', sub: 'System', time: '2h ago', color: '#6366f1' },
    { text: 'Your account has been created', sub: 'System', time: '2h ago', color: '#3b82f6' },
    { text: 'Get started with SSGzone Mail', sub: 'System', time: '2h ago', color: '#10b981' },
    { text: 'Security settings updated', sub: 'System', time: '2h ago', color: '#ef4444' },
  ];

  const quickActions = [
    { label: 'Compose Email', icon: '✉', color: '#6366f1', action: () => setComposeOpen(true) },
    { label: 'Create Campaign', icon: '📢', color: '#f59e0b', action: () => {} },
    { label: 'Add Contact', icon: '👤', color: '#10b981', action: () => {} },
    { label: 'Add Group', icon: '👥', color: '#f97316', action: () => {} },
    { label: 'Create Template', icon: '📄', color: '#3b82f6', action: () => {} },
    { label: 'View Reports', icon: '📊', color: '#8b5cf6', action: () => {} },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 60 : 220, background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>S</div>
          {!sidebarCollapsed && <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>SSGzone Mail</span>}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navSections.map(section => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', padding: '12px 16px 4px', letterSpacing: '0.05em' }}>
                  {section.title}
                </div>
              )}
              {section.items.map(item => (
                <div key={item.id}
                  onClick={() => { setActiveNav(item.id); if (item.id === 'compose') setComposeOpen(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: sidebarCollapsed ? '10px 16px' : '8px 16px',
                    cursor: 'pointer', borderRadius: 6, margin: '1px 8px',
                    background: activeNav === item.id ? '#eff6ff' : 'transparent',
                    color: activeNav === item.id ? '#2563eb' : '#4b5563',
                    fontSize: 13, fontWeight: activeNav === item.id ? 600 : 400,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                  }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{item.badge}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Sign Out */}
        <div style={{ borderTop: '1px solid #f3f4f6', padding: 8 }}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer', color: '#ef4444', fontSize: 13, borderRadius: 6, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span>🚪</span>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', padding: 4 }}>☰</button>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
            <input placeholder="Search emails, contacts, campaigns..." style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 11 }}>Ctrl + /</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Compose Button */}
          <button onClick={() => setComposeOpen(true)} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>+</span> Compose
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            {(stats.notifications?.unread_notifications > 0) && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{stats.notifications?.unread_notifications}</span>
            )}
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{userData.full_name || 'User'}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Administrator</div>
            </div>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>▼</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <StatCard title="Unread Emails" value={stats.email?.unread_emails} icon="✉" color="#6366f1" bgColor="#eff6ff" />
            <StatCard title="Chat Messages" value={stats.chat?.messages_today} icon="💬" color="#10b981" bgColor="#f0fdf4" />
            <StatCard title="WhatsApp Today" value={stats.whatsapp?.messages_today} icon="📱" color="#22c55e" bgColor="#f0fdf4" />
            <StatCard title="Notifications" value={stats.notifications?.unread_notifications} icon="🔔" color="#f59e0b" bgColor="#fffbeb" />
          </div>

          {/* Email Overview + Right Panel */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>

            {/* Email Overview */}
            <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Email Overview</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Your email activity overview for the last 7 days</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📅 Last 7 Days ▼
                </div>
              </div>

              {/* Mini Stats */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Emails Sent', value: 0, icon: '➤', color: '#6366f1' },
                  { label: 'Emails Delivered', value: 0, icon: '✓', color: '#10b981' },
                  { label: 'Emails Opened', value: 0, icon: '👁', color: '#8b5cf6' },
                  { label: 'Click Through Rate', value: '0%', icon: '↗', color: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, border: '1px solid #f3f4f6', borderRadius: 8, padding: '12px 16px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2937' }}>{s.value}</div>
                      </div>
                      <span style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div style={{ height: 120, background: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
                📈 Email activity chart will appear here
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>

              {/* Quick Actions */}
              <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {quickActions.map(a => (
                    <div key={a.label} onClick={a.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 4px', borderRadius: 8, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 22, color: a.color }}>{a.icon}</span>
                      <span style={{ fontSize: 10, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Health */}
              <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Email Health</div>
                {[
                  { label: 'Deliverability', value: '100%', color: '#10b981' },
                  { label: 'Bounce Rate', value: '0%', color: '#10b981' },
                  { label: 'Spam Complaints', value: '0', color: '#10b981' },
                  { label: 'Reputation Score', value: 'Excellent', color: '#10b981' },
                ].map(h => (
                  <div key={h.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>● {h.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: h.color }}>{h.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 12, color: '#6366f1', cursor: 'pointer' }}>View Details →</div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'flex', gap: 16 }}>

            {/* Recent Emails */}
            <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Recent Emails</div>
                <span style={{ fontSize: 12, color: '#6366f1', cursor: 'pointer' }}>View All →</span>
              </div>
              {emails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>No emails found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>You're all caught up! No emails to show.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Subject', 'From', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emails.slice(0, 5).map(email => (
                      <tr key={email.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '10px 12px', color: '#1f2937', fontWeight: email.read_status ? 400 : 600 }}>{email.subject}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{email.from_email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: email.read_status ? '#f3f4f6' : '#eff6ff', color: email.read_status ? '#6b7280' : '#2563eb', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>
                            {email.read_status ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: 12 }}>{new Date(email.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{ width: 300, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Recent Activity</div>
                <span style={{ fontSize: 12, color: '#6366f1', cursor: 'pointer' }}>View All →</span>
              </div>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 500 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{a.sub} • {a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, width: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Compose Email</span>
              <button onClick={() => setComposeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {['To', 'Subject'].map(f => (
                <input key={f} placeholder={f} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
              ))}
              <textarea placeholder="Message" rows={8} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setComposeOpen(false)} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, color: '#374151' }}>Cancel</button>
              <button style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>➤ Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebmailDashboard;
