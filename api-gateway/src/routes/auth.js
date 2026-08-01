const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redis = require('../services/RedisService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

function parseExpiryToSeconds(expiry) {
  const match = String(expiry).match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const n = parseInt(match[1]);
  const unit = match[2];
  return unit === 's' ? n : unit === 'm' ? n * 60 : unit === 'h' ? n * 3600 : n * 86400;
}

function issueAccessToken(payload) {
  const jti = crypto.randomUUID();
  return {
    token: jwt.sign({ ...payload, jti }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY }),
    jti,
  };
}

// POST /api/v1/auth/refresh
// Body: { refresh_token: "<token>" }
// Issues a new access token + rotates the refresh token.
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid token type' });
  }

  // Verify stored hash matches
  const storedHash = await redis.getRefreshToken(decoded.id);
  const incomingHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
  if (!storedHash || storedHash !== incomingHash) {
    return res.status(401).json({ error: 'Refresh token reuse detected or session expired' });
  }

  // Rotate: delete old, issue new
  await redis.deleteRefreshToken(decoded.id);

  const userPayload = {
    type: decoded.user_type,
    id: decoded.id,
    email: decoded.email,
    tenant_id: decoded.tenant_id,
    role: decoded.role,
  };

  const { token: accessToken } = issueAccessToken(userPayload);

  const newRefreshToken = jwt.sign(
    { type: 'refresh', user_type: decoded.user_type, id: decoded.id, email: decoded.email, tenant_id: decoded.tenant_id, role: decoded.role },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY_SECONDS }
  );
  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  await redis.setRefreshToken(decoded.id, newHash, REFRESH_EXPIRY_SECONDS);

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_EXPIRY_SECONDS * 1000,
    path: '/api/v1/auth',
  });

  res.json({ success: true, data: { access_token: accessToken } });
});

// POST /api/v1/auth/logout
// Requires valid access token. Blacklists it and clears refresh token.
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { jti, id, exp } = req.user;

    if (jti) {
      const ttl = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 1) : parseExpiryToSeconds(ACCESS_EXPIRY);
      await redis.blacklistToken(jti, ttl);
    }

    if (id) {
      await redis.deleteRefreshToken(id);
    }

    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed', message: err.message });
  }
});

module.exports = { router, issueAccessToken, REFRESH_EXPIRY_SECONDS };
