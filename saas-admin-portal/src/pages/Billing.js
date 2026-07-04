import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Receipt } from '@mui/icons-material';

export default function Billing() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Billing & Usage
      </Typography>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Coming Soon - Day 5
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Track usage, manage subscriptions, and view billing history
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
