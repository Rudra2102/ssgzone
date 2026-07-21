CREATE TABLE IF NOT EXISTS chat_pinned_messages (
  id SERIAL PRIMARY KEY,
  room_id UUID NOT NULL,
  message_id UUID NOT NULL,
  pinned_by VARCHAR(100) NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_room ON chat_pinned_messages(room_id);
