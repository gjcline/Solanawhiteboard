-- Create escrow_transactions table for purchase tracking
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_wallet VARCHAR(255) NOT NULL,
  total_tokens_purchased INTEGER NOT NULL,
  total_amount_paid DECIMAL(12, 9) NOT NULL,
  escrow_wallet VARCHAR(255) NOT NULL,
  purchase_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_session ON escrow_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_user ON escrow_transactions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_session_user ON escrow_transactions(session_id, user_wallet);
