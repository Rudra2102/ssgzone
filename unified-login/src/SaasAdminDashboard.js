import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Grid, Button, Chip } from '@mui/material';

const API = 'https://api.ssgzone.in';

export default function SaasAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('saas_admin_token');

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetch(`${API}/api/saas-admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => d.success && setStats(d.data));
    fetch(`${API}/api/saas-admin/tenants`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => d.success && setTenants(d.data));
  }, [token]);

  const logout = () => { localStorage.clear(); window.location.href = '/'; };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>SaaS Admin — {user.saas_name}</Typography>
        <Button variant="outlined" onClick={logout}>Logout</Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Tenants', value: stats.total_tenants },
            { label: 'Active Tenants', value: stats.active_tenants },
            { label: 'Total Users', value: stats.total_users },
            { label: 'Active Users', value: stats.active_users }
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700}>{s.value || 0}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Tenants</Typography>
        {tenants.map(t => (
          <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
            <Box>
              <Typography fontWeight={600}>{t.company_name}</Typography>
              <Typography variant="body2" color="text.secondary">{t.domain} · {t.user_count} users</Typography>
            </Box>
            <Chip label={t.status} color={t.status === 'active' ? 'success' : 'default'} size="small" />
          </Box>
        ))}
        {!tenants.length && <Typography color="text.secondary">No tenants yet</Typography>}
      </Card>
    </Box>
  );
}
