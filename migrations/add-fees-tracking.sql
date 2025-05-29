-- Add fee tracking columns to existing tables

-- Add fees_deducted column to token_escrows table
ALTER TABLE token_escrows 
ADD COLUMN IF NOT EXISTS fees_deducted DECIMAL(10,6) DEFAULT 0;

-- Add estimated_fees column to pending_releases table  
ALTER TABLE pending_releases 
ADD COLUMN IF NOT EXISTS estimated_fees DECIMAL(10,6) DEFAULT 0;

-- Update any existing records to have 0 fees
UPDATE token_escrows SET fees_deducted = 0 WHERE fees_deducted IS NULL;
UPDATE pending_releases SET estimated_fees = 0 WHERE estimated_fees IS NULL;
