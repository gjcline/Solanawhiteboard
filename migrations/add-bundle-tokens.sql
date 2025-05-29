-- Add bundle_tokens column to user_tokens table
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS bundle_tokens INTEGER DEFAULT 0;

-- Add purchase_type to track how tokens were acquired
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS last_purchase_type VARCHAR(20) DEFAULT 'single';

-- Update existing records to have bundle_tokens column
UPDATE user_tokens SET bundle_tokens = 0 WHERE bundle_tokens IS NULL;
