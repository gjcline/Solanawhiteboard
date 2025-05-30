import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("🔄 Starting earnings system migration...")

    // Create streamer_earnings table
    await sql`
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
    `

    // Add unique constraint separately (safer for existing tables)
    await sql`
      ALTER TABLE streamer_earnings 
      ADD CONSTRAINT IF NOT EXISTS unique_session_wallet 
      UNIQUE (session_id, streamer_wallet);
    `

    // Add earnings columns to sessions table (one at a time for safety)
    try {
      await sql`ALTER TABLE sessions ADD COLUMN total_earnings NUMERIC(12, 9) DEFAULT 0;`
    } catch (e) {
      console.log("total_earnings column may already exist")
    }

    try {
      await sql`ALTER TABLE sessions ADD COLUMN pending_earnings NUMERIC(12, 9) DEFAULT 0;`
    } catch (e) {
      console.log("pending_earnings column may already exist")
    }

    try {
      await sql`ALTER TABLE sessions ADD COLUMN last_claim_at TIMESTAMPTZ;`
    } catch (e) {
      console.log("last_claim_at column may already exist")
    }

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_streamer_earnings_wallet 
      ON streamer_earnings(streamer_wallet);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_streamer_earnings_session 
      ON streamer_earnings(session_id);
    `

    // Verify tables were created
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('streamer_earnings', 'sessions');
    `

    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      AND column_name IN ('total_earnings', 'pending_earnings', 'last_claim_at');
    `

    console.log("✅ Migration completed successfully")
    console.log(
      "📊 Tables found:",
      tablesCheck.map((t) => t.table_name),
    )
    console.log(
      "📊 New columns added:",
      columnsCheck.map((c) => c.column_name),
    )

    return NextResponse.json({
      success: true,
      message: "Earnings system migration completed successfully",
      tables_created: tablesCheck.length,
      columns_added: columnsCheck.length,
    })
  } catch (error) {
    console.error("❌ Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check current database state
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('streamer_earnings', 'sessions', 'user_tokens');
    `

    const earningsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'streamer_earnings'
      ORDER BY ordinal_position;
    `

    const sessionsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      AND column_name IN ('total_earnings', 'pending_earnings', 'last_claim_at');
    `

    const earningsCount = await sql`
      SELECT COUNT(*) as count FROM streamer_earnings;
    `

    return NextResponse.json({
      tables_exist: tablesCheck.map((t) => t.table_name),
      earnings_table_columns: earningsColumns,
      sessions_new_columns: sessionsColumns,
      earnings_records: earningsCount[0]?.count || 0,
      migration_needed: !tablesCheck.some((t) => t.table_name === "streamer_earnings") || sessionsColumns.length < 3,
    })
  } catch (error) {
    console.error("❌ Database check failed:", error)
    return NextResponse.json(
      {
        error: "Database check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
