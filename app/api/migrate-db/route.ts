import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { dbUrl } = await request.json()

    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Database URL is required",
        },
        { status: 400 },
      )
    }

    // Import and run migrations
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(dbUrl)

    console.log("Running database migrations...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        streamer_wallet VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        canvas_data TEXT,
        total_earnings DECIMAL(10,2) DEFAULT 0,
        viewer_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS user_tokens (
        session_id VARCHAR(255) NOT NULL,
        user_wallet VARCHAR(255) NOT NULL,
        line_tokens INTEGER DEFAULT 0,
        nuke_tokens INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, user_wallet)
      )
    `

    // Create session_stats table
    await sql`
      CREATE TABLE IF NOT EXISTS session_stats (
        session_id VARCHAR(255) PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
        lines_drawn INTEGER DEFAULT 0,
        nukes_used INTEGER DEFAULT 0,
        total_tokens_sold INTEGER DEFAULT 0,
        unique_participants INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_session ON user_tokens(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_wallet ON user_tokens(user_wallet)`

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
      tables: ["users", "sessions", "user_tokens", "session_stats"],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database migration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
