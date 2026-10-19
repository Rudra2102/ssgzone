-- Add PEMS-specific features to feature_definitions
INSERT INTO feature_definitions (feature_key, feature_name, description, category) VALUES
  ('announcements',         'Announcements',          'Company-wide broadcast announcements',         'communication'),
  ('meetings',              'Meetings',               'Meeting scheduling and management',            'productivity'),
  ('chat_reactions',        'Chat Reactions',         'Emoji reactions on chat messages',             'communication'),
  ('chat_file_attachments', 'Chat File Attachments',  'File sharing in chat messages',                'communication'),
  ('chat_mentions',         'Chat Mentions',          '@mention users in chat',                       'communication')
ON CONFLICT (feature_key) DO NOTHING;

-- Auto-assign all features as enabled defaults for PEMS saas app
-- (runs only if PEMS saas app exists; safe to run multiple times)
INSERT INTO saas_feature_permissions (saas_id, feature_key, is_enabled)
SELECT sa.id, fd.feature_key, true
FROM saas_applications sa
CROSS JOIN feature_definitions fd
WHERE sa.saas_slug = 'pems'
ON CONFLICT (saas_id, feature_key) DO NOTHING;
