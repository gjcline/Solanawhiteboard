import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("🔧 Fixing user_tokens table...")

    // Drop existing table if it exists
    await sql`DROP TABLE IF EXISTS user_tokens`
    console.log("✅ Dropped existing user_tokens table")

    // Create new table with proper constraints
    await sql`
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
      )
    `
    console.log("✅ Created user_tokens table with unique constraint")

    // Create index for faster lookups
    await sql`
      CREATE INDEX idx_user_tokens_session_wallet ON user_tokens(session_id, user_wallet)
    `
    console.log("✅ Created index on session_id, user_wallet")

    return NextResponse.json({
      success: true,
      message: "user_tokens table fixed successfully",
    })
  } catch (error) {
    console.error("❌ Error fixing user_tokens table:", error)
    return NextResponse.json(
      {
        error: "Failed to fix user_tokens table",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
