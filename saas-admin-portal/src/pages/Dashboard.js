import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { Business, People, TrendingUp, AttachMoney } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/MetricCard';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeUsers: 0,
    revenue: 0,
    growth: 0,
  });

  const mockChartData = [
    { month: 'Jan', tenants: 12, revenue: 4500 },
    { month: 'Feb', tenants: 19, revenue: 7200 },
    { month: 'Mar', tenants: 25, revenue: 9800 },
    { month: 'Apr', tenants: 32, revenue: 12400 },
    { month: 'May', tenants: 41, revenue: 15900 },
    { month: 'Jun', tenants: 48, revenue: 18600 },
  ];

  const recentActivity = [
    { action: 'New tenant created', tenant: 'Acme Corp', time: '2 hours ago', status: 'success' },
    { action: 'API key regenerated', tenant: 'TechStart Inc', time: '5 hours ago', status: 'info' },
    { action: 'Tenant suspended', tenant: 'Old Company', time: '1 day ago', status: 'warning' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Overview Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Tenants"
            value={stats.totalTenants || 48}
            change={12.5}
            icon={<Business />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Active Users"
            value={stats.activeUsers || 1247}
            change={8.2}
            icon={<People />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Monthly Revenue"
            value={`$${stats.revenue || '18.6k'}`}
            change={15.3}
            icon={<AttachMoney />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Growth Rate"
            value={`${stats.growth || 23}%`}
            change={5.1}
            icon={<TrendingUp />}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tenant Growth
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="month" stroke="#A3A3A3" />
                  <YAxis stroke="#A3A3A3" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="tenants" stroke="#6366F1" fillOpacity={1} fill="url(#colorTenants)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivity.map((activity, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.action}
                      </Typography>
                      <Chip
                        label={activity.status}
                        size="small"
                        color={activity.status === 'success' ? 'success' : activity.status === 'warning' ? 'warning' : 'info'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {activity.tenant} • {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="month" stroke="#A3A3A3" />
                  <YAxis stroke="#A3A3A3" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
