-- Drop existing table if it exists (be careful in production!)
DROP TABLE IF EXISTS user_tokens;

-- Create user_tokens table with proper constraints
CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_wallet VARCHAR(255) NOT NULL,
  line_tokens INTEGER DEFAULT 0,
  bundle_tokens INTEGER DEFAULT 0,
  nuke_tokens INTEGER DEFAULT 0,
  last_purchase_type VARCHAR(20) DEFAULT 'single',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_wallet)
);

-- Create index for faster lookups
CREATE INDEX idx_user_tokens_session_wallet ON user_tokens(session_id, user_wallet);
