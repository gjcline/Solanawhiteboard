-- Add is_active column to sessions table for session management

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add total_earnings and viewer_count if they don't exist
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 9) DEFAULT 0;

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0;

-- Update existing sessions to be active by default
UPDATE sessions SET is_active = true WHERE is_active IS NULL;

-- Add index for performance on active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_active ON sessions(owner_id, is_active);
