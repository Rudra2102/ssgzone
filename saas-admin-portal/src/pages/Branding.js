import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Palette } from '@mui/icons-material';

export default function Branding() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Branding & Customization
      </Typography>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Palette sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Coming Soon - Day 4
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Customize your portal with logo, colors, and white-label options
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
