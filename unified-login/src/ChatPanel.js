import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_BASE = window.location.origin.replace(':4001', ':4000') + '/api/v1/communication';
const WS_URL = window.location.origin.replace(':4001', ':4000');
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const S = {
  container: { display: 'flex', height: '100%', background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' },
  sidebar: { width: 260, background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sidebarTitle: { fontSize: 14, fontWeight: 700, color: '#1f2937' },
  newBtn: { background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  roomList: { flex: 1, overflowY: 'auto' },
  roomItem: (active) => ({ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', background: active ? '#eff6ff' : 'white', borderLeft: active ? '3px solid #6366f1' : '3px solid transparent' }),
  roomName: (active) => ({ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#4338ca' : '#1f2937', marginBottom: 2 }),
  roomMeta: { fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  unreadBadge: { background: '#6366f1', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  emptyMain: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af' },
  threadHeader: { padding: '12px 16px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 },
  avatar: (color) => ({ width: 32, height: 32, borderRadius: '50%', background: color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }),
  messages: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  dateSep: { textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: '8px 0', display: 'flex', alignItems: 'center', gap: 8 },
  dateLine: { flex: 1, height: 1, background: '#f3f4f6' },
  msgRow: (isOwn) => ({ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, marginBottom: 2 }),
  bubble: (isOwn, deleted) => ({ maxWidth: '65%', padding: '8px 12px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isOwn ? '#6366f1' : 'white', color: isOwn ? 'white' : '#1f2937', fontSize: 13, lineHeight: 1.5, border: isOwn ? 'none' : '1px solid #e5e7eb', opacity: deleted ? 0.5 : 1, fontStyle: deleted ? 'italic' : 'normal', wordBreak: 'break-word', position: 'relative' }),
  msgTime: { fontSize: 10, color: '#9ca3af', marginTop: 2, textAlign: 'right' },
  replyBar: { background: '#eff6ff', borderLeft: '3px solid #6366f1', padding: '4px 8px', fontSize: 11, color: '#4338ca', marginBottom: 4, borderRadius: '0 4px 4px 0' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 },
  reactionChip: { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1px 6px', fontSize: 11, cursor: 'pointer' },
  typingBar: { padding: '4px 16px', fontSize: 11, color: '#9ca3af', fontStyle: 'italic', minHeight: 20 },
  replyIndicator: { background: '#eff6ff', borderLeft: '3px solid #6366f1', padding: '6px 12px', fontSize: 12, color: '#4338ca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  composer: { padding: '10px 16px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'flex-end' },
  textarea: { flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto' },
  sendBtn: (disabled) => ({ background: disabled ? '#e5e7eb' : '#6366f1', color: disabled ? '#9ca3af' : 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' }),
  onlineDot: { width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'white', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  modalBtns: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: '7px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 },
  confirmBtn: { padding: '7px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};

function getAvatarColor(str) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatPanel({ userData, tenantId }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [emojiTarget, setEmojiTarget] = useState(null);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeRoomRef = useRef(null);
  const userId = userData?.id;
  const userName = userData?.full_name || userData?.email || 'User';

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Socket setup
  useEffect(() => {
    if (!userId || !tenantId) return;
    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join', { userId, tenantId, userName });

    socket.on('user_online', ({ userId: uid }) => setOnlineUsers(p => [...new Set([...p, uid])]));
    socket.on('user_offline', ({ userId: uid }) => setOnlineUsers(p => p.filter(id => id !== uid)));
    socket.on('new_message', (msg) => {
      setMessages(p => p.find(m => m.id === msg.id) ? p : [...p, msg]);
      setRooms(p => p.map(r => r.id === msg.roomId
        ? { ...r, last_message: msg.message, unread_count: r.id === activeRoomRef.current?.id ? 0 : (r.unread_count || 0) + 1 }
        : r));
    });
    socket.on('message_edited', ({ messageId, newMessage, editedAt }) => {
      setMessages(p => p.map(m => m.id === messageId ? { ...m, message: newMessage, edited_at: editedAt } : m));
    });
    socket.on('message_deleted', ({ messageId }) => {
      setMessages(p => p.map(m => m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m));
    });
    socket.on('user_typing', ({ userId: uid, userName: uName }) => {
      setTypingUsers(p => p.find(u => u.userId === uid) ? p : [...p, { userId: uid, userName: uName }]);
    });
    socket.on('user_stopped_typing', ({ userId: uid }) => {
      setTypingUsers(p => p.filter(u => u.userId !== uid));
    });
    socket.on('reaction_updated', ({ messageId, emoji, userId: uid, action }) => {
      setMessages(p => p.map(m => {
        if (m.id !== messageId) return m;
        const reactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
        if (action === 'added') return { ...m, reactions: [...reactions, { emoji, user_id: uid }] };
        return { ...m, reactions: reactions.filter(r => !(r.emoji === emoji && r.user_id === uid)) };
      }));
    });
    socket.on('room_read', ({ roomId, userId: uid }) => {
      if (uid !== userId) return;
      setRooms(p => p.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [userId, tenantId, userName]);

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!tenantId || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/chat/rooms/${tenantId}/my-rooms?user_id=${userId}`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {}
  }, [tenantId, userId]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  // Open room
  const openRoom = useCallback(async (room) => {
    setActiveRoom(room);
    setMessages([]);
    setLoading(true);
    if (socketRef.current) {
      if (activeRoomRef.current) socketRef.current.emit('leave_room', { roomId: activeRoomRef.current.id });
      socketRef.current.emit('join_room', { roomId: room.id });
      socketRef.current.emit('mark_read', { roomId: room.id });
    }
    try {
      const res = await fetch(`${API_BASE}/chat/messages?room_id=${room.id}&limit=50`);
      const data = await res.json();
      setMessages(data.messages || []);
      setRooms(p => p.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Send / Edit
  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || !activeRoom || !socketRef.current) return;
    if (editingId) {
      socketRef.current.emit('edit_message', { messageId: editingId, newMessage: trimmed, roomId: activeRoom.id });
      setMessages(p => p.map(m => m.id === editingId ? { ...m, message: trimmed, edited_at: new Date().toISOString() } : m));
      setEditingId(null);
    } else {
      socketRef.current.emit('send_message', { roomId: activeRoom.id, message: trimmed, replyTo: replyTo?.id || null });
      setReplyTo(null);
    }
    setBody('');
    socketRef.current.emit('typing_stop', { roomId: activeRoom.id });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Typing
  const handleTyping = (e) => {
    setBody(e.target.value);
    if (!activeRoom || !socketRef.current) return;
    socketRef.current.emit('typing_start', { roomId: activeRoom.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing_stop', { roomId: activeRoom.id }), 1500);
  };

  // Create room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, name: newRoomName.trim(), type: 'group', created_by: userId })
      });
      const data = await res.json();
      if (data.success) {
        await fetch(`${API_BASE}/chat/rooms/${data.room.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, user_name: userName, role: 'admin' })
        });
        setShowNewRoom(false); setNewRoomName('');
        loadRooms();
      }
    } catch (e) {}
  };

  // Reaction
  const handleReaction = (messageId, emoji) => {
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('toggle_reaction', { messageId, emoji, roomId: activeRoom.id });
    setEmojiTarget(null);
  };

  const getReactionSummary = (reactions) => {
    if (!Array.isArray(reactions)) return {};
    return reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});
  };

  return (
    <div style={S.container}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <span style={S.sidebarTitle}>Messages</span>
          <button style={S.newBtn} onClick={() => setShowNewRoom(true)}>+ New</button>
        </div>
        <div style={S.roomList}>
          {rooms.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              No conversations yet.<br />Create one to get started.
            </div>
          )}
          {rooms.map(room => (
            <div key={room.id} style={S.roomItem(activeRoom?.id === room.id)} onClick={() => openRoom(room)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={S.avatar(getAvatarColor(room.name))}>
                  {room.type === 'direct' ? '💬' : room.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.roomName(activeRoom?.id === room.id)}>{room.name}</div>
                  <div style={S.roomMeta}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                      {room.last_message || 'No messages yet'}
                    </span>
                    {room.unread_count > 0 && <span style={S.unreadBadge}>{room.unread_count}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main thread */}
      <div style={S.main}>
        {!activeRoom ? (
          <div style={S.emptyMain}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>Select a conversation</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Choose from the list or create a new one</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={S.threadHeader}>
              <div style={S.avatar(getAvatarColor(activeRoom.name))}>
                {activeRoom.type === 'direct' ? '💬' : activeRoom.name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{activeRoom.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {activeRoom.member_count} members
                  {onlineUsers.length > 0 && <span> · <span style={S.onlineDot} />{onlineUsers.length} online</span>}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={S.messages}>
              {loading && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 20 }}>Loading...</div>}
              {messages.map((msg, idx) => {
                const isOwn = msg.user_id === userId;
                const showDate = idx === 0 || !isSameDay(messages[idx - 1].created_at, msg.created_at);
                const showName = !isOwn && (idx === 0 || messages[idx - 1].user_id !== msg.user_id || showDate);
                const replyMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
                const reactionSummary = getReactionSummary(msg.reactions);
                const isDeleted = !!msg.deleted_at;

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={S.dateSep}>
                        <div style={S.dateLine} />
                        <span>{formatDate(msg.created_at)}</span>
                        <div style={S.dateLine} />
                      </div>
                    )}
                    <div style={S.msgRow(isOwn)}>
                      {!isOwn && (
                        <div style={S.avatar(getAvatarColor(msg.user_name))}>
                          {showName ? (msg.user_name?.[0]?.toUpperCase() || '?') : ''}
                        </div>
                      )}
                      <div style={{ maxWidth: '65%' }}>
                        {showName && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2, marginLeft: 4 }}>{msg.user_name}</div>}
                        {replyMsg && (
                          <div style={S.replyBar}>↩ {replyMsg.user_name}: {replyMsg.message?.slice(0, 60)}{replyMsg.message?.length > 60 ? '…' : ''}</div>
                        )}
                        <div
                          style={S.bubble(isOwn, isDeleted)}
                          onDoubleClick={() => !isDeleted && setEmojiTarget(emojiTarget === msg.id ? null : msg.id)}
                        >
                          {isDeleted ? 'This message was deleted' : msg.message}
                          {msg.edited_at && !isDeleted && (
                            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>(edited)</span>
                          )}
                        </div>
                        {/* Inline actions */}
                        {!isDeleted && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 2, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                            <button onClick={() => setReplyTo(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }} title="Reply">↩</button>
                            <button onClick={() => setEmojiTarget(emojiTarget === msg.id ? null : msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }} title="React">😊</button>
                            {isOwn && <button onClick={() => { setEditingId(msg.id); setBody(msg.message); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }} title="Edit">✏️</button>}
                            {isOwn && <button onClick={() => socketRef.current?.emit('delete_message', { messageId: msg.id, roomId: activeRoom.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }} title="Delete">🗑</button>}
                          </div>
                        )}
                        {/* Reactions */}
                        {Object.keys(reactionSummary).length > 0 && (
                          <div style={S.reactionsRow}>
                            {Object.entries(reactionSummary).map(([emoji, count]) => (
                              <button key={emoji} style={S.reactionChip} onClick={() => handleReaction(msg.id, emoji)}>
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Emoji picker */}
                        {emojiTarget === msg.id && (
                          <div style={{ display: 'flex', gap: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '4px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 4 }}>
                            {EMOJIS.map(e => (
                              <button key={e} onClick={() => handleReaction(msg.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>{e}</button>
                            ))}
                          </div>
                        )}
                        <div style={S.msgTime}>{formatTime(msg.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Typing indicator */}
            <div style={S.typingBar}>
              {typingUsers.filter(u => u.userId !== userId).length > 0 && (
                <span>{typingUsers.filter(u => u.userId !== userId).map(u => u.userName).join(', ')} is typing...</span>
              )}
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div style={S.replyIndicator}>
                <span>↩ Replying to <strong>{replyTo.user_name}</strong>: {replyTo.message?.slice(0, 50)}</span>
                <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>×</button>
              </div>
            )}

            {/* Edit indicator */}
            {editingId && (
              <div style={{ ...S.replyIndicator, background: '#fefce8', borderLeftColor: '#f59e0b', color: '#92400e' }}>
                <span>✏️ Editing message</span>
                <button onClick={() => { setEditingId(null); setBody(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>×</button>
              </div>
            )}

            {/* Composer */}
            <div style={S.composer}>
              <textarea
                style={S.textarea}
                rows={1}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                value={body}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
              />
              <button style={S.sendBtn(!body.trim())} onClick={handleSend} disabled={!body.trim()}>
                {editingId ? 'Save' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* New Room Modal */}
      {showNewRoom && (
        <div style={S.modalOverlay} onClick={() => setShowNewRoom(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>New Group Chat</div>
            <input
              style={S.input}
              placeholder="Room name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
              autoFocus
            />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => { setShowNewRoom(false); setNewRoomName(''); }}>Cancel</button>
              <button style={S.confirmBtn} onClick={handleCreateRoom}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
