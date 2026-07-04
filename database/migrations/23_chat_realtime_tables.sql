-- Chat Reactions Table
CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);

-- Chat Read Receipts Table
CREATE TABLE IF NOT EXISTS chat_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_read_room ON chat_read_receipts(room_id);

-- Add reply_to and edited_at to chat_messages if not present
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT '';
