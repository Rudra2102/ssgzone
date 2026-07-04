import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Send as SentIcon,
  Drafts as DraftsIcon,
  Delete as TrashIcon,
  Create as ComposeIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../services/authService';

const drawerWidth = 240;

const folders = [
  { text: 'Inbox', icon: <InboxIcon />, path: '/inbox', folder: 'INBOX' },
  { text: 'Sent', icon: <SentIcon />, path: '/sent', folder: 'Sent' },
  { text: 'Drafts', icon: <DraftsIcon />, path: '/drafts', folder: 'Drafts' },
  { text: 'Trash', icon: <TrashIcon />, path: '/trash', folder: 'Trash' }
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap>
          SSGhub Mail
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {user?.email}
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ComposeIcon />}
          onClick={() => navigate('/compose')}
        >
          Compose
        </Button>
      </Box>

      <Divider />

      <List>
        {folders.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Sidebar;