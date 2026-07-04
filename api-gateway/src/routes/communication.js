const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Email Management Routes
router.post('/email/send', async (req, res) => {
  try {
    const { tenant_id, from, to, subject, html, text, template, data } = req.body;
    
    // Validate required fields
    if (!tenant_id || !to || !subject) {
      return res.status(400).json({ error: 'Missing required fields: tenant_id, to, subject' });
    }

    // Insert email into queue
    const result = await pool.query(`
      INSERT INTO email_queue (tenant_id, from_email, to_email, subject, html_content, text_content, template_name, template_data, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING id, status
    `, [tenant_id, from, to, subject, html, text, template, JSON.stringify(data)]);

    res.json({
      success: true,
      message_id: result.rows[0].id,
      status: result.rows[0].status
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.get('/email/inbox/:tenant_id/:user_email', async (req, res) => {
  try {
    const { tenant_id, user_email } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT id, from_email, subject, html_content, text_content, created_at, read_status
      FROM emails 
      WHERE tenant_id = $1 AND to_email = $2 
      ORDER BY created_at DESC 
      LIMIT $3 OFFSET $4
    `, [tenant_id, user_email, limit, offset]);

    res.json({
      success: true,
      emails: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Inbox fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

router.get('/email/stats/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as emails_today,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced_count,
        COUNT(*) FILTER (WHERE read_status = false) as unread_count
      FROM emails 
      WHERE tenant_id = $1
    `, [tenant_id]);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Email stats error:', error);
    res.status(500).json({ error: 'Failed to fetch email stats' });
  }
});

// Chat Management Routes
router.post('/chat/rooms', async (req, res) => {
  try {
    const { tenant_id, name, description, type = 'group', created_by } = req.body;

    const result = await pool.query(`
      INSERT INTO chat_rooms (tenant_id, name, description, type, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, type
    `, [tenant_id, name, description, type, created_by]);

    res.json({
      success: true,
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Chat room creation error:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

router.get('/chat/rooms/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const result = await pool.query(`
      SELECT cr.id, cr.name, cr.description, cr.type, cr.created_at,
             COUNT(cp.user_id) as member_count,
             COUNT(cm.id) FILTER (WHERE cm.created_at >= NOW() - INTERVAL '24 hours') as messages_today
      FROM chat_rooms cr
      LEFT JOIN chat_participants cp ON cr.id = cp.room_id
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.tenant_id = $1
      GROUP BY cr.id, cr.name, cr.description, cr.type, cr.created_at
      ORDER BY cr.created_at DESC
    `, [tenant_id]);

    res.json({
      success: true,
      rooms: result.rows
    });
  } catch (error) {
    console.error('Chat rooms fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

router.post('/chat/messages', async (req, res) => {
  try {
    const { room_id, user_id, message, message_type = 'text' } = req.body;

    const result = await pool.query(`
      INSERT INTO chat_messages (room_id, user_id, message, message_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, message, created_at
    `, [room_id, user_id, message, message_type]);

    res.json({
      success: true,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// WhatsApp Business Routes
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { tenant_id, to, template, data, message_type = 'template' } = req.body;

    if (!tenant_id || !to || !template) {
      return res.status(400).json({ error: 'Missing required fields: tenant_id, to, template' });
    }

    const result = await pool.query(`
      INSERT INTO whatsapp_messages (tenant_id, to_number, template_name, template_data, message_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id, status
    `, [tenant_id, to, template, JSON.stringify(data), message_type]);

    res.json({
      success: true,
      message_id: result.rows[0].id,
      status: result.rows[0].status
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

router.get('/whatsapp/templates/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const result = await pool.query(`
      SELECT id, name, content, variables, category, status
      FROM whatsapp_templates 
      WHERE tenant_id = $1 AND status = 'approved'
      ORDER BY name
    `, [tenant_id]);

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('WhatsApp templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/whatsapp/stats/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_today,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
        COUNT(*) FILTER (WHERE status = 'read') as read_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM whatsapp_messages 
      WHERE tenant_id = $1
    `, [tenant_id]);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('WhatsApp stats error:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp stats' });
  }
});

// Notifications Routes
router.post('/notifications', async (req, res) => {
  try {
    const { tenant_id, user_id, title, message, type = 'info', priority = 'normal' } = req.body;

    const result = await pool.query(`
      INSERT INTO notifications (tenant_id, user_id, title, message, type, priority, read_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      RETURNING id, title, type, priority
    `, [tenant_id, user_id, title, message, type, priority]);

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.get('/notifications/:tenant_id/:user_id', async (req, res) => {
  try {
    const { tenant_id, user_id } = req.params;
    const { limit = 20, unread_only = false } = req.query;

    let query = `
      SELECT id, title, message, type, priority, read_status, created_at
      FROM notifications 
      WHERE tenant_id = $1 AND user_id = $2
    `;
    
    if (unread_only === 'true') {
      query += ' AND read_status = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $3';

    const result = await pool.query(query, [tenant_id, user_id, limit]);

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Communication Dashboard Stats
router.get('/dashboard/stats/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Get comprehensive communication stats
    const emailStats = await pool.query(`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as emails_today,
        COUNT(*) FILTER (WHERE read_status = false) as unread_emails
      FROM emails WHERE tenant_id = $1
    `, [tenant_id]);

    const chatStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT cr.id) as total_rooms,
        COUNT(cm.id) FILTER (WHERE cm.created_at >= NOW() - INTERVAL '24 hours') as messages_today
      FROM chat_rooms cr
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.tenant_id = $1
    `, [tenant_id]);

    const whatsappStats = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_today
      FROM whatsapp_messages WHERE tenant_id = $1
    `, [tenant_id]);

    const notificationStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE read_status = false) as unread_notifications
      FROM notifications WHERE tenant_id = $1
    `, [tenant_id]);

    res.json({
      success: true,
      stats: {
        email: emailStats.rows[0],
        chat: chatStats.rows[0],
        whatsapp: whatsappStats.rows[0],
        notifications: notificationStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;