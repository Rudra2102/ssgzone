const express = require('express');
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');

const router = express.Router();

// Test route
router.post('/test', (req, res) => {
  res.json({ message: 'Webmail routes working' });
});

// Webmail auth middleware
const webmailAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[WEBMAIL AUTH] Authorization header: ${authHeader}`);
  
  const token = authHeader?.replace('Bearer ', '');
  console.log(`[WEBMAIL AUTH] Token extracted: ${token ? 'YES' : 'NO'}`);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'webmail-secret');
    console.log(`[WEBMAIL AUTH] Token valid for user: ${decoded.email}`);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(`[WEBMAIL AUTH] Token verification failed: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Verify authentication
router.get('/auth/verify', webmailAuth, async (req, res) => {
  try {
    console.log(`[WEBMAIL VERIFY] Verifying user: ${req.user.userId}`);
    // Get user details from database
    const user = await UserService.findById(req.user.userId);
    
    if (!user) {
      console.log(`[WEBMAIL VERIFY] User not found in database`);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`[WEBMAIL VERIFY] User verified: ${user.email}`);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.log(`[WEBMAIL VERIFY] Error: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Webmail authentication
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[WEBMAIL] Login attempt for: ${email}`);
    
    const user = await UserService.authenticate(email, password);
    console.log(`[WEBMAIL] Authentication result: ${user ? 'SUCCESS' : 'FAILED'}`);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'webmail-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout
router.post('/auth/logout', webmailAuth, async (req, res) => {
  try {
    // In a production system, you might want to blacklist the token
    // For now, we'll just return success as the frontend removes the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages
router.get('/messages', webmailAuth, async (req, res) => {
  try {
    const { folder = 'INBOX', limit = 50, offset = 0 } = req.query;
    
    // Mock messages for demo
    const messages = [
      {
        id: 1,
        subject: 'Welcome to SSGhub Mail',
        sender: 'admin@ssghub.com',
        recipients: [req.user.email],
        received_at: new Date().toISOString(),
        flags: ['\\\\Recent']
      }
    ];

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific message
router.get('/messages/:id', webmailAuth, async (req, res) => {
  try {
    const message = {
      id: req.params.id,
      subject: 'Welcome to SSGhub Mail',
      sender: 'admin@ssghub.com',
      recipients: [req.user.email],
      body_text: 'Welcome to your new email account!',
      body_html: '<p>Welcome to your new email account!</p>',
      received_at: new Date().toISOString(),
      flags: ['\\\\Seen']
    };

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message
router.post('/messages/send', webmailAuth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    // In production, integrate with mail server
    console.log(`Sending email from ${req.user.email} to ${to}: ${subject}`);
    
    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;