import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import MetricCard from '../components/MetricCard';
import TenantTable from '../components/TenantTable';
import UserTable from '../components/UserTable';
import QuickActions from '../components/QuickActions';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalSaasApps: 0,
    activeTenants: 0,
    totalUsers: 0,
    emailsToday: 0,
    platformAdmins: 0
  });
  const [topTenants, setTopTenants] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch metrics
      const metricsRes = await fetch('/api/v1/super-admin/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.data);

      // Fetch top tenants
      const tenantsRes = await fetch('/api/v1/super-admin/tenants?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tenantsData = await tenantsRes.json();
      setTopTenants(tenantsData.data);

      // Fetch recent users
      const usersRes = await fetch('/api/v1/super-admin/users?limit=5&sort=recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setRecentUsers(usersData.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, Super Admin! 👋</h1>
        <p>Here's what's happening with your mail platform today.</p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard 
          title="Total SaaS Apps" 
          value={metrics.totalSaasApps}
          icon="📊"
        />
        <MetricCard 
          title="Active Tenants" 
          value={metrics.activeTenants}
          subtitle="Real-time"
          icon="🏢"
        />
        <MetricCard 
          title="Total Users" 
          value={metrics.totalUsers}
          subtitle="Real-time"
          icon="👥"
        />
        <MetricCard 
          title="Emails Today" 
          value={metrics.emailsToday}
          icon="📧"
        />
        <MetricCard 
          title="Platform Admins" 
          value={metrics.platformAdmins}
          icon="🛡️"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Top Tenants */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Top Tenants</h2>
            <a href="/tenants" className="view-all">View All</a>
          </div>
          <TenantTable tenants={topTenants} />
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <QuickActions />
        </div>
      </div>

      {/* Recent Users */}
      <div className="dashboard-section full-width">
        <div className="section-header">
          <h2>Recent Users</h2>
          <a href="/users" className="view-all">View All</a>
        </div>
        <UserTable users={recentUsers} />
      </div>
    </div>
  );
};

export default Dashboard;
