const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

// Track online users: { userId: { socketId, tenantId, userName } }
const onlineUsers = new Map();

function initChatSocket(io) {

  io.on('connection', (socket) => {

    // ── Join ──────────────────────────────────────────────────────
    socket.on('join', ({ userId, tenantId, userName }) => {
      if (!userId || !tenantId) return;
      socket.userId = userId;
      socket.tenantId = tenantId;
      socket.userName = userName || 'Unknown';
      socket.join(`tenant:${tenantId}`);
      onlineUsers.set(userId, { socketId: socket.id, tenantId, userName: socket.userName });
      io.to(`tenant:${tenantId}`).emit('user_online', { userId, userName: socket.userName });
    });

    // ── Join Room ─────────────────────────────────────────────────
    socket.on('join_room', ({ roomId }) => {
      if (!roomId) return;
      socket.join(`room:${roomId}`);
    });

    // ── Leave Room ────────────────────────────────────────────────
    socket.on('leave_room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(`room:${roomId}`);
    });

    // ── Send Message ──────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, message, messageType = 'text', replyTo = null }) => {
      if (!socket.userId || !roomId || !message) return;
      try {
        const result = await pool.query(
          `INSERT INTO chat_messages 
           (room_id, user_id, user_email, user_name, message, message_type, reply_to, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING id, room_id, user_id, user_name, message, message_type, reply_to, created_at`,
          [roomId, socket.userId, '', socket.userName, message, messageType, replyTo]
        );
        const saved = result.rows[0];
        io.to(`room:${roomId}`).emit('new_message', {
          id: saved.id,
          roomId: saved.room_id,
          userId: saved.user_id,
          userName: saved.user_name,
          message: saved.message,
          messageType: saved.message_type,
          replyTo: saved.reply_to,
          createdAt: saved.created_at
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Edit Message ──────────────────────────────────────────────
    socket.on('edit_message', async ({ messageId, newMessage, roomId }) => {
      if (!socket.userId || !messageId || !newMessage) return;
      try {
        const result = await pool.query(
          `UPDATE chat_messages SET message = $1, edited_at = NOW()
           WHERE id = $2 AND user_id = $3 RETURNING id, room_id, message, edited_at`,
          [newMessage, messageId, socket.userId]
        );
        if (result.rows.length === 0) return;
        io.to(`room:${roomId}`).emit('message_edited', {
          messageId,
          newMessage,
          editedAt: result.rows[0].edited_at
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // ── Delete Message ────────────────────────────────────────────
    socket.on('delete_message', async ({ messageId, roomId }) => {
      if (!socket.userId || !messageId) return;
      try {
        const result = await pool.query(
          `UPDATE chat_messages SET deleted_at = NOW()
           WHERE id = $1 AND user_id = $2 RETURNING id`,
          [messageId, socket.userId]
        );
        if (result.rows.length === 0) return;
        io.to(`room:${roomId}`).emit('message_deleted', { messageId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ── Typing Indicators ─────────────────────────────────────────
    socket.on('typing_start', ({ roomId }) => {
      if (!socket.userId || !roomId) return;
      socket.to(`room:${roomId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        roomId
      });
    });

    socket.on('typing_stop', ({ roomId }) => {
      if (!socket.userId || !roomId) return;
      socket.to(`room:${roomId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        roomId
      });
    });

    // ── Reactions ─────────────────────────────────────────────────
    socket.on('toggle_reaction', async ({ messageId, emoji, roomId }) => {
      if (!socket.userId || !messageId || !emoji) return;
      try {
        const existing = await pool.query(
          `SELECT id FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
          [messageId, socket.userId, emoji]
        );
        let action;
        if (existing.rows.length > 0) {
          await pool.query(`DELETE FROM chat_reactions WHERE id = $1`, [existing.rows[0].id]);
          action = 'removed';
        } else {
          await pool.query(
            `INSERT INTO chat_reactions (message_id, user_id, emoji, created_at) VALUES ($1, $2, $3, NOW())`,
            [messageId, socket.userId, emoji]
          );
          action = 'added';
        }
        io.to(`room:${roomId}`).emit('reaction_updated', {
          messageId, emoji, userId: socket.userId, action
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to toggle reaction' });
      }
    });

    // ── Read Receipt ──────────────────────────────────────────────
    socket.on('mark_read', async ({ roomId }) => {
      if (!socket.userId || !roomId) return;
      try {
        await pool.query(
          `INSERT INTO chat_read_receipts (room_id, user_id, last_read_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (room_id, user_id) DO UPDATE SET last_read_at = NOW()`,
          [roomId, socket.userId]
        );
        socket.to(`room:${roomId}`).emit('room_read', {
          roomId, userId: socket.userId, readAt: new Date()
        });
      } catch (err) {
        // silent — non-critical
      }
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        if (socket.tenantId) {
          io.to(`tenant:${socket.tenantId}`).emit('user_offline', {
            userId: socket.userId
          });
        }
      }
    });

  });
}

function getOnlineUsers(tenantId) {
  const result = [];
  onlineUsers.forEach((data, userId) => {
    if (data.tenantId === tenantId) result.push(userId);
  });
  return result;
}

module.exports = { initChatSocket, getOnlineUsers };
