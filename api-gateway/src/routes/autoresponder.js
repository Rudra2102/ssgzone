const express = require('express');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken } = require('../middleware/auth');

// Create/Update auto-responder
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { subject, message, start_date, end_date, is_active } = req.body;
    const userId = req.user.id;

    const query = `
      INSERT INTO auto_responders (user_id, subject, message, start_date, end_date, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        subject = $2,
        message = $3,
        start_date = $4,
        end_date = $5,
        is_active = $6,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [
      userId, subject, message, start_date, end_date, is_active
    ]);

    res.json({ success: true, autoresponder: result.rows[0] });
  } catch (error) {
    console.error('Error setting up auto-responder:', error);
    res.status(500).json({ error: 'Failed to setup auto-responder' });
  }
});

// Get user's auto-responder
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT * FROM auto_responders 
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ autoresponder: null });
    }

    res.json({ autoresponder: result.rows[0] });
  } catch (error) {
    console.error('Error fetching auto-responder:', error);
    res.status(500).json({ error: 'Failed to fetch auto-responder' });
  }
});

// Disable auto-responder
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      UPDATE auto_responders 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    res.json({ success: true, autoresponder: result.rows[0] });
  } catch (error) {
    console.error('Error disabling auto-responder:', error);
    res.status(500).json({ error: 'Failed to disable auto-responder' });
  }
});

// Check if auto-responder should be sent
async function shouldSendAutoResponse(userId, senderEmail) {
  const query = `
    SELECT ar.*, 
           CASE WHEN ars.sender_email IS NOT NULL THEN true ELSE false END as already_sent
    FROM auto_responders ar
    LEFT JOIN auto_responder_sent ars ON ar.user_id = ars.user_id AND ars.sender_email = $2
    WHERE ar.user_id = $1 
      AND ar.is_active = true
      AND (ar.start_date IS NULL OR ar.start_date <= NOW())
      AND (ar.end_date IS NULL OR ar.end_date >= NOW())
  `;

  const result = await db.query(query, [userId, senderEmail]);
  
  if (result.rows.length === 0) {
    return { shouldSend: false };
  }

  const autoresponder = result.rows[0];
  
  // Don't send if already sent to this sender
  if (autoresponder.already_sent) {
    return { shouldSend: false };
  }

  return { 
    shouldSend: true, 
    subject: autoresponder.subject,
    message: autoresponder.message
  };
}

// Mark auto-response as sent
async function markAutoResponseSent(userId, senderEmail) {
  const query = `
    INSERT INTO auto_responder_sent (user_id, sender_email, sent_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id, sender_email) DO NOTHING
  `;

  await db.query(query, [userId, senderEmail]);
}

module.exports = {
  router,
  shouldSendAutoResponse,
  markAutoResponseSent
};