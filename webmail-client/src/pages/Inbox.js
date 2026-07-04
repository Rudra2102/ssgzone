import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Toolbar,
  AppBar,
  Button
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Refresh as RefreshIcon,
  Create as CreateIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { mailService } from '../services/mailService';

function Inbox({ folder = 'INBOX' }) {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMessages();
  }, [folder]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await mailService.getMessages(folder);
      setMessages(response.data.data || []); // Use response.data.data since API returns {success: true, data: [...]}
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSelect = async (message) => {
    try {
      const response = await mailService.getMessage(message.id);
      setSelectedMessage(response.data.data); // Fix response structure
      
      // Mark as read if unread
      if (message.flags.includes('\\\\Recent')) {
        await mailService.markAsRead(message.id);
        loadMessages(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to load message:', error);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await mailService.deleteMessage(messageId);
      loadMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReply = () => {
    if (selectedMessage) {
      navigate('/compose', {
        state: {
          replyTo: selectedMessage,
          subject: `Re: ${selectedMessage.subject}`,
          to: selectedMessage.sender
        }
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getFolderTitle = () => {
    switch (folder) {
      case 'INBOX': return 'Inbox';
      case 'Sent': return 'Sent';
      case 'Drafts': return 'Drafts';
      case 'Trash': return 'Trash';
      default: return folder;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Message List */}
      <Box sx={{ width: 400, borderRight: 1, borderColor: 'divider' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {getFolderTitle()}
            </Typography>
            <IconButton onClick={loadMessages} size="small">
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<CreateIcon />}
              onClick={() => navigate('/compose')}
              size="small"
            >
              Compose
            </Button>
          </Toolbar>
        </AppBar>
        
        <List sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : messages.length === 0 ? (
            <ListItem>
              <ListItemText primary="No messages" />
            </ListItem>
          ) : (
            messages.map((message) => (
              <ListItem
                key={message.id}
                button
                selected={selectedMessage?.id === message.id}
                onClick={() => handleMessageSelect(message)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  fontWeight: message.flags.includes('\\\\Recent') ? 'bold' : 'normal'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: message.flags.includes('\\\\Recent') ? 'bold' : 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 200
                        }}
                      >
                        {folder === 'Sent' ? message.recipients[0] : message.sender}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(message.received_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {message.subject || '(No Subject)'}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Message Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedMessage ? (
          <>
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar variant="dense">
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {selectedMessage.subject || '(No Subject)'}
                </Typography>
                <IconButton onClick={handleReply} size="small">
                  <ReplyIcon />
                </IconButton>
                <IconButton size="small">
                  <ForwardIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(selectedMessage.id)} 
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Toolbar>
            </AppBar>

            <Paper sx={{ m: 2, p: 2, flexGrow: 1, overflow: 'auto' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedMessage.subject || '(No Subject)'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    From:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMessage.sender}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    To:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMessage.recipients.join(', ')}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {format(new Date(selectedMessage.received_at), 'PPpp')}
                </Typography>
                
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {selectedMessage.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        label={`${attachment.filename} (${(attachment.size / 1024).toFixed(1)} KB)`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box
                dangerouslySetInnerHTML={{
                  __html: selectedMessage.body_html || selectedMessage.body_text?.replace(/\\n/g, '<br>')
                }}
                sx={{ lineHeight: 1.6 }}
              />
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}
          >
            <Typography variant="h6">
              Select a message to read
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Inbox;