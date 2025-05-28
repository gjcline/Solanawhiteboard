-- Add escrow tables to your database

CREATE TABLE IF NOT EXISTS token_escrows (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_wallet VARCHAR(255) NOT NULL,
  total_tokens_purchased INTEGER NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  tokens_remaining INTEGER NOT NULL,
  total_amount_paid DECIMAL(12, 9) NOT NULL,
  amount_released DECIMAL(12, 9) DEFAULT 0,
  escrow_wallet VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_releases (
  id VARCHAR(255) PRIMARY KEY,
  escrow_id VARCHAR(255) NOT NULL REFERENCES token_escrows(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  user_wallet VARCHAR(255) NOT NULL,
  token_type VARCHAR(10) NOT NULL,
  amount_streamer DECIMAL(12, 9) NOT NULL,
  amount_devcave DECIMAL(12, 9) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_escrows_session_user ON token_escrows(session_id, user_wallet);
CREATE INDEX IF NOT EXISTS idx_token_escrows_status ON token_escrows(status);
CREATE INDEX IF NOT EXISTS idx_pending_releases_created ON pending_releases(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_releases_session ON pending_releases(session_id);
