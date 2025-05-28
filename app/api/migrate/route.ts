import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("=== Migration Starting ===")

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json(
        {
          success: false,
          message: "DATABASE_URL environment variable is not configured",
          error: "Missing DATABASE_URL",
        },
        { status: 500 },
      )
    }

    console.log("DATABASE_URL is configured")

    // Import neon
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL)

    console.log("Starting database migrations...")

    // Create users table
    console.log("Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sessions table
    console.log("Creating sessions table...")
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        canvas_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_public BOOLEAN DEFAULT false,
        title VARCHAR(255),
        description TEXT
      )
    `

    // Create session_stats table
    console.log("Creating session_stats table...")
    await sql`
      CREATE TABLE IF NOT EXISTS session_stats (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_tokens table
    console.log("Creating user_tokens table...")
    await sql`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
        tokens_earned INTEGER DEFAULT 0,
        tokens_spent INTEGER DEFAULT 0,
        transaction_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    console.log("Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_session_stats_session_id ON session_stats(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_session_id ON user_tokens(session_id)`

    console.log("All migrations completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
      details: {
        tables: ["users", "sessions", "session_stats", "user_tokens"],
        indexes: [
          "idx_sessions_user_id",
          "idx_sessions_created_at",
          "idx_session_stats_session_id",
          "idx_user_tokens_user_id",
          "idx_user_tokens_session_id",
        ],
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("=== Migration Failed ===")
    console.error("Migration error:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        message: "Database migration failed",
        error: errorMessage,
        stack: process.env.NODE_ENV !== "production" ? errorStack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
