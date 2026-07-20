CREATE TABLE IF NOT EXISTS video_rooms (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES tenant_users(id),
  room_name VARCHAR(255) NOT NULL,
  room_slug VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  UNIQUE(tenant_id, room_slug)
);

CREATE INDEX IF NOT EXISTS idx_video_rooms_tenant ON video_rooms(tenant_id, is_active);
