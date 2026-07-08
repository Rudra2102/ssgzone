import React, { useState, useEffect } from 'react';
import usePermissions from '../components/usePermissions';
import PermissionWrapper from '../components/PermissionWrapper';
import MetricCard from '../components/MetricCard';
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
    ownUsers: 0
  });
  const [topTenants, setTopTenants] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch metrics based on role
      let metricsEndpoint = '/api/v1/super-admin/dashboard/metrics';
      if (isAdmin) metricsEndpoint = '/api/v1/admin/dashboard/metrics';
      if (isTenant) metricsEndpoint = '/api/v1/tenant/dashboard/metrics';
      if (isUser) metricsEndpoint = '/api/v1/user/dashboard/metrics';

      const metricsRes = await fetch(metricsEndpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.data);

      // Fetch tenants/users based on role
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

      {/* Metrics Cards - Role-based */}
      <div className="metrics-grid">
        <PermissionWrapper module="dashboard" action="viewAllMetrics">
          <MetricCard 
            title="Total SaaS Apps" 
            value={metrics.totalSaasApps}
            icon="📊"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" action="viewAllTenants">
          <MetricCard 
            title="Active Tenants" 
            value={metrics.activeTenants}
            subtitle="Real-time"
            icon="🏢"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" actions={['viewAllUsers', 'viewOwnUsers']} requireAll={false}>
          <MetricCard 
            title={isSuperAdmin ? "Total Users" : "Your Users"}
            value={metrics.totalUsers || metrics.ownUsers}
            subtitle="Real-time"
            icon="👥"
          />
        </PermissionWrapper>

        <PermissionWrapper module="email" action="compose">
          <MetricCard 
            title="Emails Today" 
            value={metrics.emailsToday}
            icon="📧"
          />
        </PermissionWrapper>

        <PermissionWrapper module="dashboard" action="viewAllAdmins">
          <MetricCard 
            title="Platform Admins" 
            value={metrics.platformAdmins}
            icon="🛡️"
          />
        </PermissionWrapper>
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
