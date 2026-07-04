import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function MetricCard({ title, value, change, icon, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="30%" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change >= 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color: 'primary.main', opacity: 0.8 }}>{icon}</Box>
        </Box>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
          )}
          <Typography variant="body2" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>
            {Math.abs(change)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
