-- Create streamer_earnings table for Neon PostgreSQL
CREATE TABLE IF NOT EXISTS streamer_earnings (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  streamer_wallet VARCHAR(255) NOT NULL,
  total_earned NUMERIC(12, 9) DEFAULT 0,
  total_claimed NUMERIC(12, 9) DEFAULT 0,
  pending_amount NUMERIC(12, 9) DEFAULT 0,
  last_claim_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint
ALTER TABLE streamer_earnings 
ADD CONSTRAINT IF NOT EXISTS unique_session_wallet 
UNIQUE (session_id, streamer_wallet);

-- Add earnings tracking columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(12, 9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_earnings NUMERIC(12, 9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_claim_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_streamer_earnings_wallet 
ON streamer_earnings(streamer_wallet);

CREATE INDEX IF NOT EXISTS idx_streamer_earnings_session 
ON streamer_earnings(session_id);

-- Create index on sessions for earnings queries
CREATE INDEX IF NOT EXISTS idx_sessions_earnings 
ON sessions(pending_earnings) WHERE pending_earnings > 0;
