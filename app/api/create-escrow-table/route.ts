import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("🏗️ Creating escrow_transactions table...")

    // Create escrow_transactions table
    await sql`
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
      )
    `

    console.log("✅ escrow_transactions table created")

    // Add indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_session ON escrow_transactions(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_user ON escrow_transactions(user_wallet)`
    await sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_session_user ON escrow_transactions(session_id, user_wallet)`

    console.log("✅ Indexes created")

    // Verify table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'escrow_transactions'
    `

    return NextResponse.json({
      success: true,
      message: "escrow_transactions table created successfully",
      tableExists: tableCheck.length > 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error creating escrow_transactions table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
