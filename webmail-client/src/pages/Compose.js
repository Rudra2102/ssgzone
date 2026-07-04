import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { mailService } from '../services/mailService';
import SignatureManager from '../components/SignatureManager';

function Compose() {
  const navigate = useNavigate();
  const location = useLocation();
  const replyData = location.state;

  const [message, setMessage] = useState({
    to: replyData?.to || '',
    cc: '',
    bcc: '',
    subject: replyData?.subject || '',
    body: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const signatureManager = SignatureManager({});

  const handleSend = async () => {
    try {
      setSending(true);
      setError('');

      await mailService.sendMessage({
        to: message.to.split(',').map(email => email.trim()),
        cc: message.cc ? message.cc.split(',').map(email => email.trim()) : [],
        bcc: message.bcc ? message.bcc.split(',').map(email => email.trim()) : [],
        subject: message.subject,
        body: signatureManager.applySignatureToEmail(message.body, true),
        attachments: attachments
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/inbox');
      }, 2000);
    } catch (error) {
      setError('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (event) => {
    const files = Array.from(event.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    try {
      await mailService.saveDraft(message);
      navigate('/drafts');
    } catch (error) {
      setError('Failed to save draft: ' + error.message);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Compose Message
          </Typography>
          <Button
            variant="outlined"
            onClick={handleSaveDraft}
            sx={{ mr: 1 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={sending || !message.to || !message.subject}
            sx={{ mr: 1 }}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
          <IconButton onClick={() => navigate('/inbox')}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Message sent successfully! Redirecting to inbox...
          </Alert>
        )}

        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="To"
            value={message.to}
            onChange={(e) => setMessage({ ...message, to: e.target.value })}
            margin="normal"
            required
            placeholder="recipient@example.com"
          />

          <TextField
            fullWidth
            label="CC"
            value={message.cc}
            onChange={(e) => setMessage({ ...message, cc: e.target.value })}
            margin="normal"
            placeholder="cc@example.com"
          />

          <TextField
            fullWidth
            label="BCC"
            value={message.bcc}
            onChange={(e) => setMessage({ ...message, bcc: e.target.value })}
            margin="normal"
            placeholder="bcc@example.com"
          />

          <TextField
            fullWidth
            label="Subject"
            value={message.subject}
            onChange={(e) => setMessage({ ...message, subject: e.target.value })}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              type="file"
              multiple
              onChange={handleAttachment}
              style={{ display: 'none' }}
              id="attachment-input"
            />
            <label htmlFor="attachment-input">
              <Button
                component="span"
                startIcon={<AttachIcon />}
                variant="outlined"
                size="small"
              >
                Attach Files
              </Button>
            </label>

            {attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                    onDelete={() => removeAttachment(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <ReactQuill
              value={message.body}
              onChange={(value) => setMessage({ ...message, body: value })}
              style={{ minHeight: 300 }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Compose;