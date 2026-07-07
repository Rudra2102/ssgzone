const express = require('express');
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');
const rateLimit = require('../middleware/rateLimit');
const inputValidation = require('../middleware/inputValidation');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

router.use(auth);
router.use(rateLimit);
router.use(inputValidation);

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

// ── Enhanced Chat Endpoints ──────────────────────────────────────────────────

// GET messages for a room (paginated, excludes deleted)
router.get('/chat/messages', async (req, res) => {
  try {
    const { room_id, limit = 50, before_id } = req.query;
    if (!room_id) return res.status(400).json({ error: 'room_id required' });

    let query = `
      SELECT cm.id, cm.room_id, cm.user_id, cm.user_name, cm.message,
             cm.message_type, cm.reply_to, cm.edited_at, cm.created_at,
             COALESCE(
               json_agg(json_build_object('emoji', cr.emoji, 'user_id', cr.user_id))
               FILTER (WHERE cr.id IS NOT NULL), '[]'
             ) AS reactions
      FROM chat_messages cm
      LEFT JOIN chat_reactions cr ON cm.id = cr.message_id
      WHERE cm.room_id = $1 AND cm.deleted_at IS NULL
    `;
    const params = [room_id];

    if (before_id) {
      params.push(before_id);
      query += ` AND cm.id < $${params.length}`;
    }

    query += ` GROUP BY cm.id ORDER BY cm.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ success: true, messages: result.rows.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// PUT edit a message (owner only)
router.put('/chat/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id, new_message } = req.body;
    if (!user_id || !new_message) return res.status(400).json({ error: 'user_id and new_message required' });

    const result = await pool.query(
      `UPDATE chat_messages SET message = $1, edited_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, message, edited_at`,
      [new_message, messageId, user_id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Not authorized or message not found' });
    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE a message (soft delete, owner only)
router.delete('/chat/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      `UPDATE chat_messages SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [messageId, user_id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Not authorized or message not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST toggle reaction on a message
router.post('/chat/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id, emoji } = req.body;
    if (!user_id || !emoji) return res.status(400).json({ error: 'user_id and emoji required' });

    const existing = await pool.query(
      `SELECT id FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
      [messageId, user_id, emoji]
    );
    let action;
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM chat_reactions WHERE id = $1`, [existing.rows[0].id]);
      action = 'removed';
    } else {
      await pool.query(
        `INSERT INTO chat_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
        [messageId, user_id, emoji]
      );
      action = 'added';
    }
    res.json({ success: true, action, messageId, emoji });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

// POST mark room as read for a user
router.post('/chat/rooms/:roomId/read', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    await pool.query(
      `INSERT INTO chat_read_receipts (room_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (room_id, user_id) DO UPDATE SET last_read_at = NOW()`,
      [roomId, user_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// GET unread count per room for a user
router.get('/chat/rooms/:roomId/unread', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM chat_messages cm
       WHERE cm.room_id = $1
         AND cm.deleted_at IS NULL
         AND cm.created_at > COALESCE(
           (SELECT last_read_at FROM chat_read_receipts WHERE room_id = $1 AND user_id = $2),
           '1970-01-01'
         )`,
      [roomId, user_id]
    );
    res.json({ success: true, unread_count: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// GET online users for a tenant
router.get('/chat/online/:tenant_id', async (req, res) => {
  try {
    const { getOnlineUsers } = require('../websocket/chatSocket');
    const onlineUserIds = getOnlineUsers(req.params.tenant_id);
    res.json({ success: true, online_users: onlineUserIds });
  } catch (error) {
    console.error('Online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

// GET chat rooms for a user (rooms they are participant of)
router.get('/chat/rooms/:tenant_id/my-rooms', async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      `SELECT cr.id, cr.name, cr.description, cr.type, cr.created_at,
              COUNT(DISTINCT cp2.user_id) as member_count,
              (SELECT COUNT(*) FROM chat_messages cm
               WHERE cm.room_id = cr.id AND cm.deleted_at IS NULL
               AND cm.created_at > COALESCE(
                 (SELECT last_read_at FROM chat_read_receipts
                  WHERE room_id = cr.id AND user_id = $2), '1970-01-01')
              ) as unread_count,
              (SELECT cm2.message FROM chat_messages cm2
               WHERE cm2.room_id = cr.id AND cm2.deleted_at IS NULL
               ORDER BY cm2.created_at DESC LIMIT 1
              ) as last_message
       FROM chat_rooms cr
       JOIN chat_participants cp ON cr.id = cp.room_id AND cp.user_id = $2 AND cp.is_active = true
       LEFT JOIN chat_participants cp2 ON cr.id = cp2.room_id AND cp2.is_active = true
       WHERE cr.tenant_id = $1
       GROUP BY cr.id
       ORDER BY cr.updated_at DESC`,
      [tenant_id, user_id]
    );
    res.json({ success: true, rooms: result.rows });
  } catch (error) {
    console.error('My rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST add participant to a room
router.post('/chat/rooms/:roomId/participants', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id, user_email, user_name, role = 'member' } = req.body;
    if (!user_id || !user_name) return res.status(400).json({ error: 'user_id and user_name required' });

    await pool.query(
      `INSERT INTO chat_participants (room_id, user_id, user_email, user_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, user_id) DO UPDATE SET is_active = true, role = $5`,
      [roomId, user_id, user_email || '', user_name, role]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// POST create a direct (1-on-1) room between two users
router.post('/chat/rooms/direct', async (req, res) => {
  try {
    const { tenant_id, user1_id, user1_name, user2_id, user2_name } = req.body;
    if (!tenant_id || !user1_id || !user2_id) {
      return res.status(400).json({ error: 'tenant_id, user1_id, user2_id required' });
    }

    const existing = await pool.query(
      `SELECT cr.id FROM chat_rooms cr
       JOIN chat_participants cp1 ON cr.id = cp1.room_id AND cp1.user_id = $2
       JOIN chat_participants cp2 ON cr.id = cp2.room_id AND cp2.user_id = $3
       WHERE cr.tenant_id = $1 AND cr.type = 'direct' LIMIT 1`,
      [tenant_id, user1_id, user2_id]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, room: existing.rows[0], existing: true });
    }

    const roomResult = await pool.query(
      `INSERT INTO chat_rooms (tenant_id, name, type, created_by)
       VALUES ($1, $2, 'direct', $3) RETURNING id, name, type, created_at`,
      [tenant_id, `${user1_name} & ${user2_name}`, user1_id]
    );
    const room = roomResult.rows[0];

    await pool.query(
      `INSERT INTO chat_participants (room_id, user_id, user_name, user_email, role)
       VALUES ($1, $2, $3, '', 'member'), ($1, $4, $5, '', 'member')`,
      [room.id, user1_id, user1_name || '', user2_id, user2_name || '']
    );

    res.json({ success: true, room, existing: false });
  } catch (error) {
    console.error('Create direct room error:', error);
    res.status(500).json({ error: 'Failed to create direct room' });
  }
});

module.exports = router;