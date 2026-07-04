import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Grid, Card, CardContent, 
  Avatar, IconButton, Menu, MenuItem, Button, Chip,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Paper, Stack, LinearProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControlLabel, Checkbox, FormGroup, FormLabel
} from '@mui/material';
import { 
  AccountCircle, ExitToApp, Dashboard, Business, People, 
  Settings, Assessment, Add, Edit, Delete, Notifications,
  TrendingUp, Email, Storage, Security, Speed, Warning, CheckCircle, Upload, CloudUpload, Download, VpnKey, ContentCopy
} from '@mui/icons-material';

function SuperAdminDashboard() {
  const [stats, setStats] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTenantDialog, setOpenTenantDialog] = useState(false);
  const [openSaasDialog, setOpenSaasDialog] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [saasApps, setSaasApps] = useState([]);
  const [newTenant, setNewTenant] = useState({
    company_name: '',
    slug: '',
    saas_app_id: '',
    admin_email: '',
    admin_name: '',
    max_users: 100
  });
  const [newSaasApp, setNewSaasApp] = useState({
    name: '',
    slug: '',
    description: '',
    webhook_url: '',
    permissions: {
      email: true,
      chat: true,
      whatsapp: false,
      calendar: false,
      notifications: true,
      file_storage: true
    }
  });
  const [editingSaasApp, setEditingSaasApp] = useState(null);
  const [deletingSaasApp, setDeleteingSaasApp] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [viewingApiKeys, setViewingApiKeys] = useState(null);
  const [openApiKeysDialog, setOpenApiKeysDialog] = useState(false);
  const [openBulkImportDialog, setOpenBulkImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');;
  const token = localStorage.getItem('super_admin_token');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch('https://api.ssgzone.in/api/v1/super-admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Stats response status:', response.status);
      const data = await response.json();
      console.log('Stats data:', data);
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Stats fetch failed:', data.error);
      }

      // Fetch tenants
      const tenantsResponse = await fetch('https://api.ssgzone.in/api/v1/super-admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Tenants response status:', tenantsResponse.status);
      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json();
        console.log('Tenants data:', tenantsData);
        setTenants(tenantsData.data || []);
      }

      // Fetch SaaS apps
      const saasResponse = await fetch('https://api.ssgzone.in/api/v1/super-admin/saas-apps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('SaaS apps response status:', saasResponse.status);
      if (saasResponse.ok) {
        const saasData = await saasResponse.json();
        console.log('SaaS apps data:', saasData);
        setSaasApps(saasData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const handleCreateTenant = async () => {
    try {
      console.log('Creating tenant with data:', newTenant);
      
      if (!newTenant.company_name || !newTenant.slug || !newTenant.saas_app_id || !newTenant.admin_name) {
        alert('Please fill in all required fields');
        return;
      }
      
      const response = await fetch('https://api.ssgzone.in/api/v1/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTenant)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setTenants([...tenants, data.data]);
        setOpenTenantDialog(false);
        setNewTenant({
          company_name: '',
          slug: '',
          saas_app_id: '',
          admin_email: '',
          admin_name: '',
          max_users: 100
        });
        alert(`Tenant created successfully! Admin credentials:\nUsername: admin\nPassword: ${data.data.admin_credentials?.password}\nLogin URL: ${data.data.admin_credentials?.login_url}`);
        // Refresh data
        fetchDashboardStats();
      } else {
        alert(`Error: ${data.error || 'Failed to create tenant'}`);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const handleCreateSaasApp = async () => {
    try {
      console.log('Creating SaaS app with data:', newSaasApp);
      
      if (!newSaasApp.name || !newSaasApp.slug) {
        alert('Please fill in required fields: Name and Slug');
        return;
      }
      
      const response = await fetch('https://api.ssgzone.in/api/v1/super-admin/saas-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSaasApp)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setSaasApps([...saasApps, data.data]);
        setOpenSaasDialog(false);
        setNewSaasApp({
          name: '',
          slug: '',
          description: '',
          webhook_url: '',
          permissions: {
            email: true,
            chat: true,
            whatsapp: false,
            calendar: false,
            notifications: true,
            file_storage: true
          }
        });
        alert('SaaS Application created successfully!');
        fetchDashboardStats();
      } else {
        alert(`Error: ${data.error || 'Failed to create SaaS application'}`);
      }
    } catch (error) {
      console.error('Failed to create SaaS app:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const handleViewApiKeys = async (app) => {
    try {
      // Fetch full SaaS app details including API keys
      const response = await fetch(`https://api.ssgzone.in/api/v1/super-admin/saas-apps/${app.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setViewingApiKeys(data.data);
          setOpenApiKeysDialog(true);
        } else {
          alert('Failed to fetch API keys');
        }
      } else {
        alert('Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      alert('Network error while fetching API keys');
    }
  };

  const handleEditSaasApp = (app) => {
    setNewSaasApp({
      name: app.name,
      slug: app.slug,
      description: app.description || '',
      webhook_url: app.webhook_url || '',
      permissions: app.permissions || {
        email: true,
        chat: true,
        whatsapp: false,
        calendar: false,
        notifications: true,
        file_storage: true
      }
    });
    setOpenSaasDialog(true);
  };

  const handleUpdateSaasApp = async () => {
    try {
      console.log('Updating SaaS app:', editingSaasApp.id, newSaasApp);
      
      const response = await fetch(`https://api.ssgzone.in/api/v1/super-admin/saas-apps/${editingSaasApp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSaasApp)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSaasApps(saasApps.map(app => app.id === editingSaasApp.id ? data.data : app));
        setOpenSaasDialog(false);
        setEditingSaasApp(null);
        setNewSaasApp({
          name: '',
          slug: '',
          description: '',
          webhook_url: ''
        });
        alert('SaaS Application updated successfully!');
        fetchDashboardStats();
      } else {
        alert(`Error: ${data.error || 'Failed to update SaaS application'}`);
      }
    } catch (error) {
      console.error('Failed to update SaaS app:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const handleDeleteSaasApp = (app) => {
    setDeleteingSaasApp(app);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteSaasApp = async () => {
    try {
      console.log('Deleting SaaS app:', deletingSaasApp.id);
      
      const response = await fetch(`https://api.ssgzone.in/api/v1/super-admin/saas-apps/${deletingSaasApp.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSaasApps(saasApps.filter(app => app.id !== deletingSaasApp.id));
        setOpenDeleteDialog(false);
        setDeleteingSaasApp(null);
        alert('SaaS Application deleted successfully!');
        fetchDashboardStats();
      } else {
        alert(`Error: ${data.error || 'Failed to delete SaaS application'}`);
      }
    } catch (error) {
      console.error('Failed to delete SaaS app:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must contain headers and at least one data row');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
      
      setCsvData(data);
      setImportPreview(data.slice(0, 5)); // Show first 5 rows
    };
    
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvData || csvData.length === 0) {
      alert('Please upload a CSV file first');
      return;
    }
    
    setImporting(true);
    setImportResults(null);
    
    try {
      const response = await fetch('https://api.ssgzone.in/api/v1/super-admin/tenants/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ csv_data: csvData })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setImportResults(data.data);
        fetchDashboardStats(); // Refresh tenant list
      } else {
        alert(`Error: ${data.error || 'Failed to import CSV'}`);
      }
    } catch (error) {
      console.error('Failed to import CSV:', error);
      alert(`Network error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleCloseBulkImport = () => {
    setOpenBulkImportDialog(false);
    setCsvFile(null);
    setCsvData([]);
    setImportPreview([]);
    setImportResults(null);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const csvContent = `company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,100
Global Enterprises,globalent,1,Sarah Johnson,150
Innovation Labs,innovlab,1,Michael Chen,75`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tenant_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: <Dashboard /> },
    { id: 'saas', label: 'Applications', icon: <Business /> },
    { id: 'communication', label: 'Communication', icon: <Email /> },
    { id: 'users', label: 'User Management', icon: <People /> },
    { id: 'analytics', label: 'Analytics', icon: <Assessment /> },
    { id: 'settings', label: 'System Config', icon: <Settings /> }
  ];

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ 
      height: 120, 
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)', 
        boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>{icon}</Avatar>
          {trend && <Chip label={trend} size="small" color="success" sx={{ fontSize: '0.7rem' }} />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Welcome back, {userData.full_name}</Typography>
              <Typography variant="body1" color="text.secondary">Here's what's happening with your platform today.</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Applications" 
                  value={stats.totalSaasApps || '-'} 
                  icon={<Business />} 
                  color="#6366f1"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Active Tenants" 
                  value={stats.totalTenants || '-'} 
                  icon={<People />} 
                  color="#06b6d4"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Total Users" 
                  value={stats.totalUsers || '-'} 
                  icon={<TrendingUp />} 
                  color="#10b981"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Emails Today" 
                  value={stats.emailsToday || '-'} 
                  icon={<Email />} 
                  color="#f59e0b"
                />
              </Grid>
            </Grid>

            {/* Management Tabs */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="SaaS Applications" />
                  <Tab label="Tenant Management" />
                  <Tab label="Communication" />
                  <Tab label="System Settings" />
                  <Tab label="Security & Logs" />
                </Tabs>
              </Box>

              {/* SaaS Applications Tab */}
              <TabPanel value={activeTab} index={0}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">SaaS Applications</Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpenSaasDialog(true)}>
                      Add SaaS App
                    </Button>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Slug</TableCell>
                          <TableCell>Tenants</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {saasApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>{app.name}</TableCell>
                            <TableCell>{app.slug}</TableCell>
                            <TableCell>{app.tenant_count || 0}</TableCell>
                            <TableCell>
                              <Chip label="Active" color="success" size="small" />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleViewApiKeys(app)} title="View API Keys"><VpnKey /></IconButton>
                              <IconButton size="small" onClick={() => handleEditSaasApp(app)} title="Edit"><Edit /></IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteSaasApp(app)} title="Delete"><Delete /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </TabPanel>

              {/* Tenant Management Tab */}
              <TabPanel value={activeTab} index={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Tenant Companies</Typography>
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" startIcon={<Upload />} onClick={() => setOpenBulkImportDialog(true)}>
                        Bulk Import
                      </Button>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setOpenTenantDialog(true)}>
                        Create Tenant
                      </Button>
                    </Stack>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Company Name</TableCell>
                          <TableCell>SaaS App</TableCell>
                          <TableCell>Admin Email</TableCell>
                          <TableCell>Users</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tenants.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell>{tenant.company_name}</TableCell>
                            <TableCell>{tenant.saas_app_name}</TableCell>
                            <TableCell>{tenant.admin_email}</TableCell>
                            <TableCell>{tenant.user_count || 0}/{tenant.max_users}</TableCell>
                            <TableCell>
                              <Chip 
                                label={tenant.status || 'Active'} 
                                color={tenant.status === 'active' ? 'success' : 'default'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small"><Edit /></IconButton>
                              <IconButton size="small" color="error"><Delete /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </TabPanel>

              {/* Communication Tab */}
              <TabPanel value={activeTab} index={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3 }}>Communication Management</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Email Services</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><Email /></ListItemIcon>
                              <ListItemText primary="Global Email Stats" secondary={`${stats.emailsToday || 0} emails sent today`} />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Storage /></ListItemIcon>
                              <ListItemText primary="Storage Usage" secondary="Monitor email storage across tenants" />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>WhatsApp Integration</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><Notifications /></ListItemIcon>
                              <ListItemText primary="Business API Status" secondary="Twilio WhatsApp connection active" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Assessment /></ListItemIcon>
                              <ListItemText primary="Message Analytics" secondary="Track WhatsApp usage per tenant" />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Communication Policies</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Button variant="outlined" fullWidth>Email Rate Limits</Button>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Button variant="outlined" fullWidth>WhatsApp Quotas</Button>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Button variant="outlined" fullWidth>Spam Protection</Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </TabPanel>

              {/* System Settings Tab */}
              <TabPanel value={activeTab} index={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3 }}>System Configuration</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Email Settings</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><Email /></ListItemIcon>
                              <ListItemText primary="SMTP Configuration" secondary="Configure mail server settings" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Security /></ListItemIcon>
                              <ListItemText primary="DKIM/SPF Setup" secondary="Email authentication settings" />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Storage & Limits</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><Storage /></ListItemIcon>
                              <ListItemText primary="Storage Quotas" secondary="Manage storage limits per tenant" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><People /></ListItemIcon>
                              <ListItemText primary="User Limits" secondary="Set maximum users per tenant" />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </TabPanel>

              {/* Security & Logs Tab */}
              <TabPanel value={activeTab} index={4}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3 }}>Security & Audit Logs</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Recent Security Events</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><Warning color="warning" /></ListItemIcon>
                              <ListItemText 
                                primary="Failed login attempt" 
                                secondary="admin@techcorp.pems.ssgzone.in - 2 minutes ago" 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="New tenant created" 
                                secondary="NABC Institute - 1 hour ago" 
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </TabPanel>
            </Card>
          </Box>
        );
      case 'communication':
        return (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Communication Hub</Typography>
              <Typography variant="body1" color="text.secondary">Manage email services, WhatsApp integration, and communication policies</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Emails Today" 
                  value={stats.emailsToday || '0'} 
                  icon={<Email />} 
                  color="#f59e0b"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="WhatsApp Messages" 
                  value={stats.whatsappToday || '0'} 
                  icon={<Notifications />} 
                  color="#10b981"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Active Domains" 
                  value={stats.activeDomains || '0'} 
                  icon={<Business />} 
                  color="#6366f1"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard 
                  title="Storage Used" 
                  value={stats.storageUsed || '0 GB'} 
                  icon={<Storage />} 
                  color="#06b6d4"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3 }}>Email Service Status</Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary="SMTP Server" secondary="All mail servers operational" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary="DKIM/SPF" secondary="Email authentication active" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText primary="Queue Status" secondary="2 emails in delivery queue" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3 }}>WhatsApp Business API</Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary="Twilio Connection" secondary="WhatsApp Business API connected" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Notifications /></ListItemIcon>
                        <ListItemText primary="Message Templates" secondary="5 approved templates available" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Assessment /></ListItemIcon>
                        <ListItemText primary="Usage Quota" secondary="850/1000 messages this month" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      case 'saas':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Applications</Typography>
                <Typography variant="body1" color="text.secondary">Manage your SaaS applications and integrations</Typography>
              </Box>
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenSaasDialog(true)} sx={{ borderRadius: 2, px: 3 }}>
                Add Application
              </Button>
            </Box>
            <Grid container spacing={3}>
              {['LMS Platform', 'Rupyo Financial', 'CRM System', 'Analytics Hub'].map((app, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease', 
                    '&:hover': { 
                      transform: 'translateY(-6px)', 
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)' 
                    } 
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><Business /></Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{app}</Typography>
                          <Chip label="Active" size="small" color="success" />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enterprise application with full integration
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<Edit />}>Edit</Button>
                        <Button size="small" color="error" startIcon={<Delete />}>Remove</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary">Feature Coming Soon</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>This section is under development</Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Modern Sidebar */}
      <Paper sx={{ 
        width: 280, 
        bgcolor: 'white',
        borderRadius: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        borderRight: '1px solid #e2e8f0'
      }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>SSGzone</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
              {userData.full_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{userData.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">Super Administrator</Typography>
            </Box>
          </Box>
        </Box>
        <List sx={{ p: 2 }}>
          {menuItems.map((item) => (
            <ListItem 
              key={item.id} 
              button 
              selected={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                '&.Mui-selected': { 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' }
                },
                '&:hover': { bgcolor: activeSection === item.id ? 'primary.main' : 'grey.50' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ position: 'absolute', bottom: 0, width: 280, p: 2 }}>
          <Button 
            fullWidth 
            startIcon={<ExitToApp />} 
            onClick={handleLogout}
            sx={{ borderRadius: 2, color: 'text.secondary' }}
          >
            Sign Out
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4, overflow: 'auto' }}>
        {renderContent()}
      </Box>

      {/* Create SaaS App Dialog */}
      <Dialog open={openSaasDialog} onClose={() => {
        setOpenSaasDialog(false);
        setEditingSaasApp(null);
        setNewSaasApp({ name: '', slug: '', description: '', webhook_url: '' });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSaasApp ? 'Edit SaaS Application' : 'Create New SaaS Application'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Application Name"
            value={newSaasApp.name}
            onChange={(e) => setNewSaasApp({...newSaasApp, name: e.target.value})}
            margin="normal"
            placeholder="e.g., PEMS, LMS, CRM"
          />
          <TextField
            fullWidth
            label="Slug"
            value={newSaasApp.slug}
            onChange={(e) => setNewSaasApp({...newSaasApp, slug: e.target.value})}
            margin="normal"
            placeholder="e.g., pems, lms, crm"
            disabled={editingSaasApp !== null}
          />
          <TextField
            fullWidth
            label="Description"
            value={newSaasApp.description}
            onChange={(e) => setNewSaasApp({...newSaasApp, description: e.target.value})}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Webhook URL"
            value={newSaasApp.webhook_url}
            onChange={(e) => setNewSaasApp({...newSaasApp, webhook_url: e.target.value})}
            margin="normal"
            placeholder="https://your-app.com/api/ssgzone/webhook"
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <FormLabel component="legend">Feature Permissions</FormLabel>
            <FormGroup>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.email || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, email: e.target.checked}})}
                      />
                    }
                    label="Email Service"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.chat || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, chat: e.target.checked}})}
                      />
                    }
                    label="Chat System"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.whatsapp || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, whatsapp: e.target.checked}})}
                      />
                    }
                    label="WhatsApp Integration"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.calendar || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, calendar: e.target.checked}})}
                      />
                    }
                    label="Calendar Service"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.notifications || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, notifications: e.target.checked}})}
                      />
                    }
                    label="Notifications"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newSaasApp.permissions?.file_storage || false}
                        onChange={(e) => setNewSaasApp({...newSaasApp, permissions: {...newSaasApp.permissions, file_storage: e.target.checked}})}
                      />
                    }
                    label="File Storage"
                  />
                </Grid>
              </Grid>
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSaasDialog(false);
            setEditingSaasApp(null);
            setNewSaasApp({ name: '', slug: '', description: '', webhook_url: '' });
          }}>Cancel</Button>
          <Button onClick={editingSaasApp ? handleUpdateSaasApp : handleCreateSaasApp} variant="contained">
            {editingSaasApp ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete SaaS Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingSaasApp?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteSaasApp} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={openTenantDialog} onClose={() => setOpenTenantDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Tenant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Company Name"
            value={newTenant.company_name}
            onChange={(e) => setNewTenant({...newTenant, company_name: e.target.value})}
            margin="normal"
            placeholder="e.g., NABC Institute"
          />
          <TextField
            fullWidth
            label="Company Slug"
            value={newTenant.slug}
            onChange={(e) => setNewTenant({...newTenant, slug: e.target.value})}
            margin="normal"
            placeholder="e.g., nabc"
          />
          <TextField
            fullWidth
            select
            label="SaaS Application"
            value={newTenant.saas_app_id}
            onChange={(e) => setNewTenant({...newTenant, saas_app_id: e.target.value})}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="">Select SaaS App</option>
            {saasApps.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Admin Name"
            value={newTenant.admin_name}
            onChange={(e) => setNewTenant({...newTenant, admin_name: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Admin Email"
            value={newTenant.admin_email}
            onChange={(e) => setNewTenant({...newTenant, admin_email: e.target.value})}
            margin="normal"
            placeholder="admin@company.com"
          />
          <TextField
            fullWidth
            label="Max Users"
            type="number"
            value={newTenant.max_users}
            onChange={(e) => setNewTenant({...newTenant, max_users: parseInt(e.target.value)})}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTenantDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTenant} variant="contained">Create Tenant</Button>
        </DialogActions>
      </Dialog>

      {/* API Keys Dialog */}
      <Dialog open={openApiKeysDialog} onClose={() => setOpenApiKeysDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKey color="primary" />
            <Typography variant="h6">API Credentials - {viewingApiKeys?.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>⚠️ Security Warning</Typography>
            <Typography variant="body2">
              Keep these credentials secure. Never expose them in client-side code or public repositories.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">API Key</Typography>
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(viewingApiKeys?.api_key || '')}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {viewingApiKeys?.api_key || 'Not available'}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">API Secret</Typography>
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(viewingApiKeys?.api_secret || '')}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {viewingApiKeys?.api_secret || 'Not available'}
            </Typography>
          </Paper>

          {viewingApiKeys?.webhook_secret && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Webhook Secret</Typography>
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(viewingApiKeys?.webhook_secret || '')}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {viewingApiKeys?.webhook_secret}
              </Typography>
            </Paper>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>📚 Usage Example:</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Using API Key in Header
curl -X POST https://api.ssgzone.in/api/v1/saas/tenants \\
  -H "X-API-Key: ${viewingApiKeys?.api_key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"company_name":"Test Corp","slug":"testcorp"}'`}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>🔗 API Endpoints:</Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>Base URL:</strong> https://api.ssgzone.in/api/v1/saas</li>
                <li><strong>Register:</strong> POST /register</li>
                <li><strong>Create Tenant:</strong> POST /tenants</li>
                <li><strong>Create User:</strong> POST /users</li>
                <li><strong>Sync Companies:</strong> GET /sync/companies</li>
                <li><strong>Sync Users:</strong> GET /sync/users</li>
              </ul>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApiKeysDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={openBulkImportDialog} onClose={handleCloseBulkImport} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Bulk Import Tenants</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                startIcon={<Download />} 
                onClick={handleDownloadTemplate}
                variant="outlined"
              >
                Download Template
              </Button>
              {importing && <LinearProgress sx={{ width: 200 }} />}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!importResults ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a CSV file with the following columns: <strong>company_name, slug, saas_app_id, admin_name, max_users</strong> (max_users is optional)
              </Typography>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  border: '2px dashed #ccc',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' }
                }}
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {csvFile ? csvFile.name : 'Click to upload CSV file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or drag and drop your file here
                </Typography>
              </Paper>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>📋 CSV Format Requirements:</Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li><strong>company_name</strong>: Full company name (e.g., "TechCorp Solutions")</li>
                    <li><strong>slug</strong>: URL-friendly identifier, lowercase (e.g., "techcorp")</li>
                    <li><strong>saas_app_id</strong>: Get from Applications tab (e.g., "1")</li>
                    <li><strong>admin_name</strong>: Full name of tenant admin (e.g., "John Smith")</li>
                    <li><strong>max_users</strong>: Optional, default is 50 (e.g., "100")</li>
                  </ul>
                </Typography>
              </Box>

              {importPreview.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Preview (First 5 rows)</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Company Name</TableCell>
                          <TableCell>Slug</TableCell>
                          <TableCell>SaaS App ID</TableCell>
                          <TableCell>Admin Name</TableCell>
                          <TableCell>Max Users</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importPreview.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.company_name}</TableCell>
                            <TableCell>{row.slug}</TableCell>
                            <TableCell>{row.saas_app_id}</TableCell>
                            <TableCell>{row.admin_name}</TableCell>
                            <TableCell>{row.max_users || '50'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Total rows to import: {csvData.length}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Import Results</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="h4" color="primary">{importResults.total}</Typography>
                    <Typography variant="body2">Total</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" color="success.dark">{importResults.success.length}</Typography>
                    <Typography variant="body2">Success</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="error.dark">{importResults.failed.length}</Typography>
                    <Typography variant="body2">Failed</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {importResults.success.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: 'success.main' }}>✓ Successfully Created</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Company</TableCell>
                          <TableCell>Domain</TableCell>
                          <TableCell>Admin Email</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResults.success.map((tenant, index) => (
                          <TableRow key={index}>
                            <TableCell>{tenant.company_name}</TableCell>
                            <TableCell>{tenant.domain}</TableCell>
                            <TableCell>{tenant.admin_email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {importResults.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: 'error.main' }}>✗ Failed to Create</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Company</TableCell>
                          <TableCell>Slug</TableCell>
                          <TableCell>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResults.failed.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.tenant.company_name}</TableCell>
                            <TableCell>{item.tenant.slug}</TableCell>
                            <TableCell sx={{ color: 'error.main' }}>{item.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkImport}>Close</Button>
          {!importResults && (
            <Button 
              onClick={handleBulkImport} 
              variant="contained" 
              disabled={csvData.length === 0 || importing}
              startIcon={importing ? <LinearProgress size={20} /> : <Upload />}
            >
              {importing ? 'Importing...' : `Import ${csvData.length} Tenants`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SuperAdminDashboard;
