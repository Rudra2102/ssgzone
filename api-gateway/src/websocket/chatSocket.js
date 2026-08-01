const jwt = require('jsonwebtoken');
const db = require('../services/DatabaseService');
const redis = require('../services/RedisService');

// Track online users: { userId: { socketId, tenantId, userName } }
const onlineUsers = new Map();

function initChatSocket(io) {

  // ── JWT Authentication on every connection ────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check Redis blacklist
      if (decoded.jti) {
        const blacklisted = await redis.isBlacklisted(decoded.jti);
        if (blacklisted) return next(new Error('Token revoked'));
      }

      socket.userId = decoded.id;
      socket.tenantId = String(decoded.tenant_id);
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {

    // ── Join ──────────────────────────────────────────────────────
    // userName comes from client for display only; identity is from JWT
    socket.on('join', ({ userName } = {}) => {
      socket.userName = userName || socket.userEmail || 'Unknown';
      socket.join(`tenant:${socket.tenantId}`);
      onlineUsers.set(socket.userId, { socketId: socket.id, tenantId: socket.tenantId, userName: socket.userName });
      io.to(`tenant:${socket.tenantId}`).emit('user_online', { userId: socket.userId, userName: socket.userName });
    });

    // ── Join Room ─────────────────────────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      if (!roomId) return;
      try {
        // Verify room belongs to socket's tenant
        const result = await db.query(
          `SELECT id FROM chat_rooms WHERE id = $1 AND tenant_id = $2`,
          [roomId, socket.tenantId]
        );
        if (!result.rows.length) {
          return socket.emit('error', { message: 'Room not found or access denied' });
        }
        socket.join(`room:${roomId}`);
      } catch {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── Leave Room ────────────────────────────────────────────────
    socket.on('leave_room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(`room:${roomId}`);
    });

    // ── Send Message ──────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, message, messageType = 'text', replyTo = null }) => {
      if (!roomId || !message) return;
      try {
        const result = await db.query(
          `INSERT INTO chat_messages 
           (room_id, user_id, user_email, user_name, message, message_type, reply_to, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING id, room_id, user_id, user_name, message, message_type, reply_to, created_at`,
          [roomId, socket.userId, socket.userEmail, socket.userName, message, messageType, replyTo]
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
          createdAt: saved.created_at,
        });
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Edit Message ──────────────────────────────────────────────
    socket.on('edit_message', async ({ messageId, newMessage, roomId }) => {
      if (!messageId || !newMessage) return;
      try {
        const result = await db.query(
          `UPDATE chat_messages SET message = $1, edited_at = NOW()
           WHERE id = $2 AND user_id = $3 RETURNING id, room_id, message, edited_at`,
          [newMessage, messageId, socket.userId]
        );
        if (!result.rows.length) return;
        io.to(`room:${roomId}`).emit('message_edited', {
          messageId,
          newMessage,
          editedAt: result.rows[0].edited_at,
        });
      } catch {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // ── Delete Message ────────────────────────────────────────────
    socket.on('delete_message', async ({ messageId, roomId }) => {
      if (!messageId) return;
      try {
        const result = await db.query(
          `UPDATE chat_messages SET deleted_at = NOW()
           WHERE id = $1 AND user_id = $2 RETURNING id`,
          [messageId, socket.userId]
        );
        if (!result.rows.length) return;
        io.to(`room:${roomId}`).emit('message_deleted', { messageId });
      } catch {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ── Typing Indicators ─────────────────────────────────────────
    socket.on('typing_start', ({ roomId }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        roomId,
      });
    });

    socket.on('typing_stop', ({ roomId }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('user_stopped_typing', { userId: socket.userId, roomId });
    });

    // ── Reactions ─────────────────────────────────────────────────
    socket.on('toggle_reaction', async ({ messageId, emoji, roomId }) => {
      if (!messageId || !emoji) return;
      try {
        const existing = await db.query(
          `SELECT id FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
          [messageId, socket.userId, emoji]
        );
        let action;
        if (existing.rows.length > 0) {
          await db.query(`DELETE FROM chat_reactions WHERE id = $1`, [existing.rows[0].id]);
          action = 'removed';
        } else {
          await db.query(
            `INSERT INTO chat_reactions (message_id, user_id, emoji, created_at) VALUES ($1, $2, $3, NOW())`,
            [messageId, socket.userId, emoji]
          );
          action = 'added';
        }
        io.to(`room:${roomId}`).emit('reaction_updated', { messageId, emoji, userId: socket.userId, action });
      } catch {
        socket.emit('error', { message: 'Failed to toggle reaction' });
      }
    });

    // ── Pin Message ───────────────────────────────────────────────
    socket.on('pin_message', async ({ messageId, roomId }) => {
      if (!messageId || !roomId) return;
      try {
        await db.query(
          `INSERT INTO chat_pinned_messages (room_id, message_id, pinned_by)
           VALUES ($1,$2,$3) ON CONFLICT (room_id, message_id) DO NOTHING`,
          [roomId, messageId, socket.userId]
        );
        io.to(`room:${roomId}`).emit('message_pinned', { messageId, roomId, pinnedBy: socket.userId });
      } catch {
        socket.emit('error', { message: 'Failed to pin message' });
      }
    });

    socket.on('unpin_message', async ({ messageId, roomId }) => {
      if (!messageId || !roomId) return;
      try {
        await db.query(
          `DELETE FROM chat_pinned_messages WHERE room_id=$1 AND message_id=$2`,
          [roomId, messageId]
        );
        io.to(`room:${roomId}`).emit('message_unpinned', { messageId, roomId });
      } catch {
        socket.emit('error', { message: 'Failed to unpin message' });
      }
    });

    // ── Read Receipt ──────────────────────────────────────────────
    socket.on('mark_read', async ({ roomId }) => {
      if (!roomId) return;
      try {
        await db.query(
          `INSERT INTO chat_read_receipts (room_id, user_id, last_read_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (room_id, user_id) DO UPDATE SET last_read_at = NOW()`,
          [roomId, socket.userId]
        );
        socket.to(`room:${roomId}`).emit('room_read', { roomId, userId: socket.userId, readAt: new Date() });
      } catch {
        // silent — non-critical
      }
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        if (socket.tenantId) {
          io.to(`tenant:${socket.tenantId}`).emit('user_offline', { userId: socket.userId });
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
