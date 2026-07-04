import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Business } from '@mui/icons-material';

export default function Tenants() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Tenant Management
      </Typography>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Coming Soon - Day 3
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tenant management with CRUD operations, bulk actions, and status controls
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
