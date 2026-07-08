import React, { useState, useEffect } from 'react';
import usePermissions from '../components/usePermissions';
import PermissionWrapper from '../components/PermissionWrapper';
import EnhancedMetricCard from '../components/EnhancedMetricCard';
import EmailOverview from '../components/EmailOverview';
import SystemActivity from '../components/SystemActivity';
import EmailHealthMetrics from '../components/EmailHealthMetrics';
import StorageUsage from '../components/StorageUsage';
import TenantTable from '../components/TenantTable';
import UserTable from '../components/UserTable';
import QuickActions from '../components/QuickActions';
import '../pages/Dashboard.css';

const UnifiedDashboard = () => {
  const { role, isSuperAdmin, isAdmin, isTenant, isUser } = usePermissions();
  const [metrics, setMetrics] = useState({
    totalSaasApps: 0,
    activeTenants: 0,
    totalUsers: 0,
    emailsToday: 0,
    platformAdmins: 0,
    ownTenants: 0,
    ownUsers: 0,
    emailStats: { sent: 0, received: 0, failed: 0, bounced: 0, spam: 0, deliveryRate: 98.5 },
    healthMetrics: { uptime: 99.9, avgDeliveryTime: 2.3, spamScore: 0.8, dkimStatus: 'valid', spfStatus: 'valid', dmarcStatus: 'valid', tlsEnabled: true, apiHealth: 'healthy' },
    storageUsage: { used: 45.2, total: 100, percentage: 45.2, breakdown: { emails: 30, attachments: 12, backups: 3, other: 0.2 } },
    trends: { emailsTrend: 12, usersTrend: -5, tenantsTrend: 8 }
  });
  const [topTenants, setTopTenants] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let metricsEndpoint = '/api/v1/super-admin/dashboard/metrics';
      if (isAdmin) metricsEndpoint = '/api/v1/admin/dashboard/metrics';
      if (isTenant) metricsEndpoint = '/api/v1/tenant/dashboard/metrics';
      if (isUser) metricsEndpoint = '/api/v1/user/dashboard/metrics';

      const metricsRes = await fetch(metricsEndpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      setMetrics(prev => ({ ...prev, ...metricsData.data }));

      if (isSuperAdmin || isAdmin) {
        const tenantsRes = await fetch(
          isSuperAdmin ? '/api/v1/super-admin/tenants?limit=5' : '/api/v1/admin/tenants?limit=5',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const tenantsData = await tenantsRes.json();
        setTopTenants(tenantsData.data);
      }

      if (isSuperAdmin || isAdmin || isTenant) {
        const usersRes = await fetch(
          isSuperAdmin ? '/api/v1/super-admin/users?limit=5&sort=recent' :
          isAdmin ? '/api/v1/admin/users?limit=5&sort=recent' :
          '/api/v1/tenant/users?limit=5&sort=recent',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const usersData = await usersRes.json();
        setRecentUsers(usersData.data);
      }

      const activitiesRes = await fetch(
        '/api/v1/dashboard/activities?limit=8',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const activitiesData = await activitiesRes.json();
      setActivities(activitiesData.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const messages = {
      super_admin: 'Welcome back, Super Admin! 👋',
      admin: 'Welcome back, Admin! 👋',
      tenant: 'Welcome back! 👋',
      user: 'Welcome! 👋'
    };
    return messages[role] || 'Welcome!';
  };

  const getSubtitle = () => {
    const subtitles = {
      super_admin: "Here's what's happening with your mail platform today.",
      admin: "Here's an overview of your tenants and users.",
      tenant: "Here's an overview of your company and employees.",
      user: "Here's your personal dashboard."
    };
    return subtitles[role] || '';
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{getWelcomeMessage()}</h1>
        <p>{getSubtitle()}</p>
      </div>

      {/* Enhanced Metrics Cards - Role-based */}
      <div className="metrics-grid">
        <PermissionWrapper module="dashboard" action="viewAllMetrics">
          <EnhancedMetricCard 
            title="Total SaaS Apps" 
            value={metrics.totalSaasApps}
            trendPercent={metrics.trends?.appsTrend || 0}
            icon="📊"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" action="viewAllTenants">
          <EnhancedMetricCard 
            title="Active Tenants" 
            value={metrics.activeTenants}
            trendPercent={metrics.trends?.tenantsTrend || 0}
            icon="🏢"
            subtitle="Real-time"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" actions={['viewAllUsers', 'viewOwnUsers']} requireAll={false}>
          <EnhancedMetricCard 
            title={isSuperAdmin ? "Total Users" : "Your Users"}
            value={metrics.totalUsers || metrics.ownUsers}
            trendPercent={metrics.trends?.usersTrend || 0}
            icon="👥"
            subtitle="Real-time"
          />
        </PermissionWrapper>

        <PermissionWrapper module="email" action="compose">
          <EnhancedMetricCard 
            title="Emails Today" 
            value={metrics.emailsToday}
            trendPercent={metrics.trends?.emailsTrend || 0}
            icon="📧"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" action="viewAllAdmins">
          <EnhancedMetricCard 
            title="Platform Admins" 
            value={metrics.platformAdmins}
            icon="🛡️"
          />
        </PermissionWrapper>
      </div>

      {/* Email Overview & Health Metrics */}
      <div className="dashboard-grid-2col">
        <PermissionWrapper module="email" action="compose">
          <EmailOverview stats={metrics.emailStats} />
        </PermissionWrapper>
        <EmailHealthMetrics metrics={metrics.healthMetrics} />
      </div>

      {/* Storage & System Activity */}
      <div className="dashboard-grid-2col">
        <StorageUsage storage={metrics.storageUsage} />
        <SystemActivity activities={activities} />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Top Tenants - Only for Super Admin and Admin */}
        <PermissionWrapper module="tenants" actions={['viewAll', 'viewOwn']} requireAll={false}>
          <div className="dashboard-section">
            <div className="section-header">
              <h2>{isSuperAdmin ? 'Top Tenants' : 'Your Tenants'}</h2>
              <a href="/tenants" className="view-all">View All</a>
            </div>
            <TenantTable tenants={topTenants} />
          </div>
        </PermissionWrapper>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <QuickActions role={role} />
        </div>
      </div>

      {/* Recent Users - Role-based */}
      <PermissionWrapper module="users" actions={['viewAll', 'viewOwn']} requireAll={false}>
        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>{isSuperAdmin ? 'Recent Users' : 'Recent Activity'}</h2>
            <a href="/users" className="view-all">View All</a>
          </div>
          <UserTable users={recentUsers} />
        </div>
      </PermissionWrapper>
    </div>
  );
};

export default UnifiedDashboard;
