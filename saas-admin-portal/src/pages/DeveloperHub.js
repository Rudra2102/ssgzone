import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { ContentCopy, Refresh, Visibility, VisibilityOff, CheckCircle, Send } from '@mui/icons-material';
import { apiKeysAPI } from '../services/api';

export default function DeveloperHub() {
  const [activeTab, setActiveTab] = useState(0);
  const [apiKeys, setApiKeys] = useState({ api_key: '', api_secret: '', webhook_secret: '' });
  const [showSecrets, setShowSecrets] = useState({ api_secret: false, webhook_secret: false });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [regenerateDialog, setRegenerateDialog] = useState({ open: false, type: '' });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await apiKeysAPI.getKeys();
      setApiKeys(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch API keys', 'error');
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showSnackbar(`${label} copied to clipboard`, 'success');
  };

  const handleRegenerate = async () => {
    try {
      await apiKeysAPI.regenerateKey(regenerateDialog.type);
      await fetchApiKeys();
      showSnackbar(`${regenerateDialog.type} regenerated successfully`, 'success');
      setRegenerateDialog({ open: false, type: '' });
    } catch (error) {
      showSnackbar('Failed to regenerate key', 'error');
    }
  };

  const handleTestWebhook = async () => {
    try {
      const response = await apiKeysAPI.testWebhook(webhookUrl);
      setTestResult({ success: true, message: 'Webhook test successful' });
      showSnackbar('Webhook test successful', 'success');
    } catch (error) {
      setTestResult({ success: false, message: error.response?.data?.message || 'Webhook test failed' });
      showSnackbar('Webhook test failed', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.ssgzone.com/v1/tenants \\
  -H "Authorization: Bearer ${apiKeys.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp",
    "email": "admin@acme.com"
  }'`,
    javascript: `const axios = require('axios');

const response = await axios.post(
  'https://api.ssgzone.com/v1/tenants',
  {
    name: 'Acme Corp',
    email: 'admin@acme.com'
  },
  {
    headers: {
      'Authorization': 'Bearer ${apiKeys.api_key}',
      'Content-Type': 'application/json'
    }
  }
);`,
    python: `import requests

response = requests.post(
    'https://api.ssgzone.com/v1/tenants',
    json={
        'name': 'Acme Corp',
        'email': 'admin@acme.com'
    },
    headers={
        'Authorization': f'Bearer ${apiKeys.api_key}',
        'Content-Type': 'application/json'
    }
)`,
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Developer Hub
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                API Credentials
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={apiKeys.api_key}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <IconButton onClick={() => handleCopy(apiKeys.api_key, 'API Key')} color="primary">
                      <ContentCopy />
                    </IconButton>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => setRegenerateDialog({ open: true, type: 'api_key' })}
                    >
                      Regenerate
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="API Secret"
                      type={showSecrets.api_secret ? 'text' : 'password'}
                      value={apiKeys.api_secret}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <IconButton
                      onClick={() => setShowSecrets({ ...showSecrets, api_secret: !showSecrets.api_secret })}
                    >
                      {showSecrets.api_secret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={() => handleCopy(apiKeys.api_secret, 'API Secret')} color="primary">
                      <ContentCopy />
                    </IconButton>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => setRegenerateDialog({ open: true, type: 'api_secret' })}
                    >
                      Regenerate
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Webhook Secret"
                      type={showSecrets.webhook_secret ? 'text' : 'password'}
                      value={apiKeys.webhook_secret}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <IconButton
                      onClick={() => setShowSecrets({ ...showSecrets, webhook_secret: !showSecrets.webhook_secret })}
                    >
                      {showSecrets.webhook_secret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={() => handleCopy(apiKeys.webhook_secret, 'Webhook Secret')} color="primary">
                      <ContentCopy />
                    </IconButton>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => setRegenerateDialog({ open: true, type: 'webhook_secret' })}
                    >
                      Regenerate
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Code Examples
              </Typography>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                <Tab label="cURL" />
                <Tab label="JavaScript" />
                <Tab label="Python" />
              </Tabs>
              <Box
                sx={{
                  bgcolor: '#0D0D0D',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => handleCopy(Object.values(codeSnippets)[activeTab], 'Code')}
                  size="small"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
                <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto' }}>
                  <code>{Object.values(codeSnippets)[activeTab]}</code>
                </pre>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Webhook Testing
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  placeholder="https://your-app.com/webhooks/ssgzone"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  size="small"
                />
                <Button variant="contained" startIcon={<Send />} onClick={handleTestWebhook} disabled={!webhookUrl}>
                  Test
                </Button>
              </Box>
              {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} icon={testResult.success ? <CheckCircle /> : null}>
                  {testResult.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={regenerateDialog.open} onClose={() => setRegenerateDialog({ open: false, type: '' })}>
        <DialogTitle>Regenerate {regenerateDialog.type}?</DialogTitle>
        <DialogContent>
          <Typography>
            This will invalidate the current {regenerateDialog.type}. Any applications using the old key will stop working.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialog({ open: false, type: '' })}>Cancel</Button>
          <Button onClick={handleRegenerate} variant="contained" color="error">
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
