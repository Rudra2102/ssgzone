const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// OAuth 2.0 Authorization endpoint for integrating SaaS apps
router.get('/authorize', authenticate, async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state } = req.query;
    
    // Validate client_id matches authenticated SaaS
    if (client_id !== req.saas.saas_slug) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client_id'
      });
    }

    // Generate authorization code
    const authCode = jwt.sign(
      { 
        saas_id: req.saas.id,
        saas_slug: req.saas.saas_slug,
        scope: scope || 'read:emails write:emails'
      },
      process.env.JWT_SECRET || 'oauth-secret',
      { expiresIn: '10m' }
    );

    // Redirect with authorization code
    const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// OAuth 2.0 Token endpoint
router.post('/token', async (req, res) => {
  try {
    const { grant_type, code, client_id, client_secret } = req.body;
    
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type'
      });
    }

    // Verify authorization code
    const decoded = jwt.verify(code, process.env.JWT_SECRET || 'oauth-secret');
    
    if (decoded.saas_slug !== client_id) {
      return res.status(400).json({
        error: 'invalid_client'
      });
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        saas_id: decoded.saas_id,
        saas_slug: decoded.saas_slug,
        scope: decoded.scope
      },
      process.env.JWT_SECRET || 'oauth-secret',
      { expiresIn: '1h' }
    );

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: decoded.scope
    });
  } catch (error) {
    res.status(400).json({
      error: 'invalid_grant'
    });
  }
});

module.exports = router;