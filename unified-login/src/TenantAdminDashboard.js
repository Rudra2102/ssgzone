import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Grid, Card, CardContent, Avatar, Button, Chip,
  List, ListItem, ListItemText, ListItemIcon, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Switch, FormControlLabel, Alert
} from '@mui/material';
import {
  AccountCircle, ExitToApp, Dashboard, People, Email, Chat, WhatsApp, Settings, Add, Edit, Delete, Business, TrendingUp, Storage, Notifications
} from '@mui/icons-material';

function TenantAdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    emailsSent: 0,
    storageUsed: '0 GB',
    chatMessages: 0,
    whatsappMessages: 0
  });
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    department_id: '',
    role: 'user',
    phone: ''
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    head_user_id: ''
  });
  const [communicationSettings, setCommunicationSettings] = useState({
    email_enabled: true,
    chat_enabled: true,
    whatsapp_enabled: false,
    notifications_enabled: true
  });
  const [autoresponders, setAutoresponders] = useState([]);
  
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('tenant_admin_token');

  // Parse permissions from JWT
  const getJwtPermissions = () => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.permissions || {};
    } catch { return {}; }
  };
  const jwtPerms = getJwtPermissions();
  const canUse = (feature) => jwtPerms[feature] !== false;
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/v1/tenant-admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      // Fetch users
      const usersResponse = await fetch('/api/v1/tenant-admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      // Fetch departments
      const deptsResponse = await fetch('/api/v1/tenant-admin/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deptsResponse.ok) {
        const deptsData = await deptsResponse.json();
        setDepartments(deptsData.data || []);
      }

      // Fetch communication settings
      const settingsResponse = await fetch('/api/v1/tenant-admin/communication/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCommunicationSettings(settingsData.data || communicationSettings);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Validation
      if (!newUser.username || !newUser.email || !newUser.first_name || !newUser.last_name) {
        setError('Please fill all required fields');
        return;
      }
      
      const url = editingUser 
        ? `/api/v1/tenant-admin/users/${editingUser.id}`
        : '/api/v1/tenant-admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (editingUser) {
          setUsers(users.map(u => u.id === editingUser.id ? data.data : u));
          setSuccess('Employee updated successfully');
        } else {
          setUsers([...users, data.data]);
          setSuccess('Employee created successfully');
        }
        setOpenUserDialog(false);
        setEditingUser(null);
        setNewUser({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          department_id: '',
          role: 'user',
          phone: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      setError('Failed to save employee. Please try again.');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      department_id: user.department_id || '',
      role: user.role,
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setOpenUserDialog(true);
    setError('');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/v1/tenant-admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setSuccess('Employee deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete employee. Please try again.');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Validation
      if (!newDepartment.name) {
        setError('Department name is required');
        return;
      }
      
      const url = editingDept 
        ? `/api/v1/tenant-admin/departments/${editingDept.id}`
        : '/api/v1/tenant-admin/departments';
      
      const method = editingDept ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDepartment)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (editingDept) {
          setDepartments(departments.map(d => d.id === editingDept.id ? data.data : d));
          setSuccess('Department updated successfully');
        } else {
          setDepartments([...departments, data.data]);
          setSuccess('Department created successfully');
        }
        setOpenDeptDialog(false);
        setEditingDept(null);
        setNewDepartment({
          name: '',
          description: '',
          head_user_id: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save department');
      }
    } catch (error) {
      console.error('Failed to save department:', error);
      setError('Failed to save department. Please try again.');
    }
  };

  const handleEditDepartment = (dept) => {
    setEditingDept(dept);
    setNewDepartment({
      name: dept.name,
      description: dept.description || '',
      head_user_id: dept.head_user_id || ''
    });
    setOpenDeptDialog(true);
    setError('');
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/v1/tenant-admin/departments/${deptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(departments.filter(d => d.id !== deptId));
        setSuccess('Department deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Failed to delete department:', error);
      setError('Failed to delete department. Please try again.');
    }
  };

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setEditingUser(null);
    setNewUser({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      department_id: '',
      role: 'user',
      phone: ''
    });
    setError('');
  };

  const handleCloseDeptDialog = () => {
    setOpenDeptDialog(false);
    setEditingDept(null);
    setNewDepartment({
      name: '',
      description: '',
      head_user_id: ''
    });
    setError('');
  };

  const handleUpdateCommunicationSettings = async (setting, value) => {
    try {
      const updatedSettings = { ...communicationSettings, [setting]: value };
      
      const response = await fetch('/api/v1/tenant-admin/communication/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });
      
      if (response.ok) {
        setCommunicationSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 280, bgcolor: 'white', borderRadius: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Company Admin</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
              {userData.full_name?.charAt(0) || userData.username?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{userData.full_name || userData.username}</Typography>
              <Typography variant="caption" color="text.secondary">Company Administrator</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, width: 280, p: 2 }}>
          <Button fullWidth startIcon={<ExitToApp />} onClick={handleLogout} sx={{ borderRadius: 2, color: 'text.secondary' }}>
            Sign Out
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Company Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your company's communication system and employees
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Employees"
              value={stats.totalUsers}
              icon={<People />}
              color="#1976d2"
              subtitle="Active users in system"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Emails Sent"
              value={stats.emailsSent}
              icon={<Email />}
              color="#2e7d32"
              subtitle="This month"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Chat Messages"
              value={stats.chatMessages}
              icon={<Chat />}
              color="#ed6c02"
              subtitle="Internal communications"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="WhatsApp Messages"
              value={stats.whatsappMessages}
              icon={<WhatsApp />}
              color="#25d366"
              subtitle="Business messaging"
            />
          </Grid>
        </Grid>

        {/* Management Tabs */}
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Employee Management" />
              <Tab label="Departments" />
              {canUse('email') && <Tab label="Communication Settings" />}
              {canUse('analytics') && <Tab label="Analytics" />}
              {canUse('email') && <Tab label="Out of Office" />}
            </Tabs>
          </Box>

          {/* Employee Management Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Employee Management</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setOpenUserDialog(true)}>
                  Add Employee
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status || 'Active'} 
                            color={user.status === 'active' ? 'success' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditUser(user)}><Edit /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </TabPanel>

          {/* Departments Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Department Management</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDeptDialog(true)}>
                  Add Department
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {departments.map((dept) => (
                  <Grid item xs={12} md={6} key={dept.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>{dept.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {dept.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption">
                            Head: {dept.head_name || 'Not assigned'}
                          </Typography>
                          <Box>
                            <IconButton size="small" onClick={() => handleEditDepartment(dept)}><Edit /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteDepartment(dept.id)}><Delete /></IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Communication Settings Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Communication Features</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Email System</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={communicationSettings.email_enabled}
                            onChange={(e) => handleUpdateCommunicationSettings('email_enabled', e.target.checked)}
                          />
                        }
                        label="Enable Email System"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Professional email accounts for all employees
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Internal Chat</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={communicationSettings.chat_enabled}
                            onChange={(e) => handleUpdateCommunicationSettings('chat_enabled', e.target.checked)}
                          />
                        }
                        label="Enable Chat System"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Real-time messaging between employees
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>WhatsApp Business</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={communicationSettings.whatsapp_enabled}
                            onChange={(e) => handleUpdateCommunicationSettings('whatsapp_enabled', e.target.checked)}
                          />
                        }
                        label="Enable WhatsApp Integration"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Business messaging via WhatsApp
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Notifications</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={communicationSettings.notifications_enabled}
                            onChange={(e) => handleUpdateCommunicationSettings('notifications_enabled', e.target.checked)}
                          />
                        }
                        label="Enable Push Notifications"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Real-time notifications for important updates
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Communication Analytics</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Email Statistics</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Emails Sent Today" secondary={stats.emailsToday || 0} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Delivery Rate" secondary="98.5%" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Open Rate" secondary="76.2%" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Chat Activity</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Messages Today" secondary={stats.chatToday || 0} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Active Conversations" secondary={stats.activeChats || 0} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Response Time" secondary="< 5 minutes" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>WhatsApp Business</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Messages Sent" secondary={stats.whatsappSent || 0} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Delivery Rate" secondary="99.1%" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Read Rate" secondary="89.3%" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Out of Office Tab */}
          <TabPanel value={activeTab} index={4}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Team Out-of-Office Status</Typography>
              {autoresponders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No active autoresponders in your team</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Active Until</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {autoresponders.map((ar) => (
                        <TableRow key={ar.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{ar.first_name} {ar.last_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{ar.user_email}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{ar.subject}</TableCell>
                          <TableCell>{ar.end_date ? new Date(ar.end_date).toLocaleDateString() : 'Indefinite'}</TableCell>
                          <TableCell>
                            <Chip label={ar.is_active ? 'Active' : 'Inactive'} color={ar.is_active ? 'success' : 'default'} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </TabPanel>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingUser ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="Username *"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email *"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              margin="normal"
              placeholder="user@company.pems.ssgzone.in"
              required
            />
            <TextField
              fullWidth
              label="First Name *"
              value={newUser.first_name}
              onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name *"
              value={newUser.last_name}
              onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              margin="normal"
              placeholder="+91 9876543210"
            />
            <TextField
              fullWidth
              select
              label="Department"
              value={newUser.department_id}
              onChange={(e) => setNewUser({...newUser, department_id: e.target.value})}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Role"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Cancel</Button>
            <Button onClick={handleCreateUser} variant="contained">
              {editingUser ? 'Update' : 'Create'} Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Department Dialog */}
        <Dialog open={openDeptDialog} onClose={handleCloseDeptDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingDept ? 'Edit Department' : 'Create New Department'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="Department Name *"
              value={newDepartment.name}
              onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
              margin="normal"
              placeholder="e.g., Human Resources, IT, Finance"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newDepartment.description}
              onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              select
              label="Department Head"
              value={newDepartment.head_user_id}
              onChange={(e) => setNewDepartment({...newDepartment, head_user_id: e.target.value})}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Select Department Head</option>
              {users.filter(user => user.role === 'manager' || user.role === 'admin').map((user) => (
                <option key={user.id} value={user.id}>{`${user.first_name} ${user.last_name}`}</option>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeptDialog}>Cancel</Button>
            <Button onClick={handleCreateDepartment} variant="contained">
              {editingDept ? 'Update' : 'Create'} Department
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default TenantAdminDashboard;