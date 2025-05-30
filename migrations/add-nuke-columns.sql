-- Add nuke effect tracking columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS nuke_user TEXT,
ADD COLUMN IF NOT EXISTS nuke_start_time TIMESTAMP;
