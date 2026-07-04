import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Grid, Card, CardContent, Avatar, Button, List, ListItem, ListItemText, ListItemIcon, IconButton, Badge, Tabs, Tab, Paper, Divider, Chip, Dialog, DialogTitle, DialogContent, TextField, DialogActions
} from '@mui/material';
import {
  Email as EmailIcon, Chat as ChatIcon, Notifications as NotificationsIcon, Send as SendIcon, Inbox as InboxIcon, Drafts as DraftsIcon, Star as StarIcon, Delete as DeleteIcon, Reply as ReplyIcon, Forward as ForwardIcon, Attachment as AttachmentIcon, WhatsApp as WhatsAppIcon, VideoCall as VideoCallIcon, Phone as PhoneIcon, ExitToApp
} from '@mui/icons-material';

function WebmailDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    unreadEmails: 0,
    unreadChats: 0,
    unreadNotifications: 0,
    totalEmails: 0,
    totalChats: 0
  });
  const [emails, setEmails] = useState([]);
  const [chats, setChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [openComposeDialog, setOpenComposeDialog] = useState(false);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [composeEmail, setComposeEmail] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('webmail_token');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Set user data from localStorage
      setUser(userData);

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/v1/user/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      // Fetch emails
      const emailsResponse = await fetch('/api/v1/webmail/messages?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setEmails(emailsData.data || []);
      }

      // Fetch chats
      const chatsResponse = await fetch('/api/v1/user/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        setChats(chatsData.data || []);
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/v1/user/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('/api/v1/webmail/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(composeEmail)
      });
      
      if (response.ok) {
        setOpenComposeDialog(false);
        setComposeEmail({ to: '', subject: '', body: '' });
        // Refresh emails
        fetchUserData();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSendChatMessage = async () => {
    try {
      const response = await fetch('/api/v1/user/chats/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedChatRoom?.id,
          message: chatMessage
        })
      });
      
      if (response.ok) {
        setChatMessage('');
        // Refresh chats
        fetchUserData();
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const QuickActionCard = ({ title, icon, color, count, onClick }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        borderRadius: 3,
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {title}
            </Typography>
            {count > 0 && (
              <Chip 
                label={`${count} new`} 
                color="primary" 
                size="small" 
              />
            )}
          </Box>
          <Badge badgeContent={count} color="error">
            <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
          </Badge>
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>SSGzone Mail</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
              {userData.first_name?.charAt(0) || userData.username?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{userData.first_name || userData.username}</Typography>
              <Typography variant="caption" color="text.secondary">Employee</Typography>
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
            Welcome back, {user.first_name || user.username}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your communication hub - {user.email}
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Email"
              icon={<EmailIcon />}
              color="#1976d2"
              count={stats.unreadEmails}
              onClick={() => setActiveTab(0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Chat"
              icon={<ChatIcon />}
              color="#2e7d32"
              count={stats.unreadChats}
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Notifications"
              icon={<NotificationsIcon />}
              color="#ed6c02"
              count={stats.unreadNotifications}
              onClick={() => setActiveTab(2)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="WhatsApp"
              icon={<WhatsAppIcon />}
              color="#25d366"
              count={0}
              onClick={() => setActiveTab(3)}
            />
          </Grid>
        </Grid>

        {/* Communication Tabs */}
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab 
                label={
                  <Badge badgeContent={stats.unreadEmails} color="error">
                    Email
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.unreadChats} color="error">
                    Chat
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.unreadNotifications} color="error">
                    Notifications
                  </Badge>
                } 
              />
              <Tab label="WhatsApp" />
            </Tabs>
          </Box>

          {/* Email Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Email Inbox</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<SendIcon />} 
                  onClick={() => setOpenComposeDialog(true)}
                >
                  Compose
                </Button>
              </Box>
              
              <List>
                {emails.map((email, index) => (
                  <React.Fragment key={email.id || index}>
                    <ListItem 
                      sx={{ 
                        bgcolor: email.flags?.includes('\\Seen') ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {email.sender?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: email.flags?.includes('\\Seen') ? 400 : 600 }}>
                              {email.sender}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(email.received_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {email.subject}
                          </Typography>
                        }
                      />
                      <Box>
                        <IconButton size="small"><ReplyIcon /></IconButton>
                        <IconButton size="small"><ForwardIcon /></IconButton>
                        <IconButton size="small"><DeleteIcon /></IconButton>
                      </Box>
                    </ListItem>
                    {index < emails.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </TabPanel>

          {/* Chat Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Team Chat</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<ChatIcon />}
                  onClick={() => setOpenChatDialog(true)}
                >
                  New Chat
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Chat Rooms</Typography>
                    <List dense>
                      {chats.map((chat) => (
                        <ListItem 
                          key={chat.id}
                          button
                          selected={selectedChatRoom?.id === chat.id}
                          onClick={() => setSelectedChatRoom(chat)}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {chat.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={chat.name}
                            secondary={`${chat.participant_count || 0} members`}
                          />
                          {chat.unread_count > 0 && (
                            <Chip label={chat.unread_count} color="primary" size="small" />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                    {selectedChatRoom ? (
                      <>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          {selectedChatRoom.name}
                        </Typography>
                        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Chat messages will appear here
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                          />
                          <Button 
                            variant="contained" 
                            onClick={handleSendChatMessage}
                            disabled={!chatMessage.trim()}
                          >
                            <SendIcon />
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Select a chat room to start messaging
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Recent Notifications</Typography>
              
              <List>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id || index}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                          <NotificationsIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={notification.type || 'info'} 
                        color={notification.type === 'urgent' ? 'error' : 'default'} 
                        size="small" 
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </TabPanel>

          {/* WhatsApp Tab */}
          <TabPanel value={activeTab} index={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>WhatsApp Business</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Quick Actions</Typography>
                      <List>
                        <ListItem button>
                          <ListItemIcon><WhatsAppIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Send Message" secondary="Send WhatsApp message to contacts" />
                        </ListItem>
                        <ListItem button>
                          <ListItemIcon><VideoCallIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Video Call" secondary="Start WhatsApp video call" />
                        </ListItem>
                        <ListItem button>
                          <ListItemIcon><PhoneIcon color="info" /></ListItemIcon>
                          <ListItemText primary="Voice Call" secondary="Make WhatsApp voice call" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Recent Conversations</Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        No recent WhatsApp conversations
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>
        </Card>

        {/* Compose Email Dialog */}
        <Dialog open={openComposeDialog} onClose={() => setOpenComposeDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="To"
              value={composeEmail.to}
              onChange={(e) => setComposeEmail({...composeEmail, to: e.target.value})}
              margin="normal"
              placeholder="recipient@company.com"
            />
            <TextField
              fullWidth
              label="Subject"
              value={composeEmail.subject}
              onChange={(e) => setComposeEmail({...composeEmail, subject: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Message"
              value={composeEmail.body}
              onChange={(e) => setComposeEmail({...composeEmail, body: e.target.value})}
              margin="normal"
              multiline
              rows={8}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenComposeDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} variant="contained" startIcon={<SendIcon />}>
              Send Email
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Chat Dialog */}
        <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Start New Chat</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select colleagues to start a new conversation
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Feature coming soon...
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenChatDialog(false)}>Cancel</Button>
            <Button variant="contained">Start Chat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default WebmailDashboard;