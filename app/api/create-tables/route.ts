import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("🔧 Starting table creation...")

    // Check if tables exist first
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    const existingTables = tables.map((t) => t.table_name)
    console.log("📋 Existing tables:", existingTables)

    // Create users table if it doesn't exist
    if (!existingTables.includes("users")) {
      console.log("👤 Creating users table...")
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          wallet_address VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
      console.log("✅ Users table created")
    } else {
      console.log("✓ Users table already exists")
    }

    // Create sessions table if it doesn't exist
    if (!existingTables.includes("sessions")) {
      console.log("🖼️ Creating sessions table...")
      await sql`
        CREATE TABLE sessions (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          owner_id INTEGER REFERENCES users(id),
          streamer_wallet VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          canvas_data TEXT,
          total_earnings DECIMAL(10,4) DEFAULT 0,
          viewer_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      console.log("✅ Sessions table created")
    } else {
      console.log("✓ Sessions table already exists")
    }

    // Create user_tokens table if it doesn't exist
    if (!existingTables.includes("user_tokens")) {
      console.log("🪙 Creating user_tokens table...")
      await sql`
        CREATE TABLE user_tokens (
          session_id VARCHAR(255) REFERENCES sessions(id),
          user_wallet VARCHAR(255) NOT NULL,
          line_tokens INTEGER DEFAULT 0,
          nuke_tokens INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (session_id, user_wallet)
        )
      `
      console.log("✅ User_tokens table created")
    } else {
      console.log("✓ User_tokens table already exists")
    }

    // Check if sessions table has session_id column or id column
    let sessionIdColumnName = "id"
    if (existingTables.includes("sessions")) {
      const sessionColumns = await sql`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'sessions' AND table_schema = 'public'
      `
      const columnNames = sessionColumns.map((col) => col.column_name)

      if (columnNames.includes("session_id")) {
        sessionIdColumnName = "session_id"
        console.log("📝 Sessions table uses 'session_id' as primary key")
      } else {
        console.log("📝 Sessions table uses 'id' as primary key")
      }
    }

    // Check if user_tokens table references the correct column
    if (existingTables.includes("user_tokens") && existingTables.includes("sessions")) {
      const userTokensColumns = await sql`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'user_tokens' AND table_schema = 'public'
      `
      const columnNames = userTokensColumns.map((col) => col.column_name)

      if (columnNames.includes("session_id") && sessionIdColumnName === "id") {
        console.log("⚠️ Mismatch: user_tokens uses 'session_id' but sessions uses 'id'")
        // This would require a migration to fix
      } else if (columnNames.includes("id") && sessionIdColumnName === "session_id") {
        console.log("⚠️ Mismatch: user_tokens uses 'id' but sessions uses 'session_id'")
        // This would require a migration to fix
      } else {
        console.log("✓ Foreign key relationship is consistent")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tables created or verified successfully",
      tablesCreated: existingTables,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Table creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create tables",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
