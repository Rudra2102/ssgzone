import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

function Settings() {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('settings')}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('language')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your preferred language for the interface
        </Typography>
        <Box sx={{ maxWidth: 300 }}>
          <LanguageSelector />
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('signature')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email signature settings will be available in a future update.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Settings;