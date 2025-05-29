import { executeSQL } from "../lib/database"

export async function runMigrations() {
  console.log("🚀 Starting database migrations...")
  const results = []

  try {
    // Test basic connection first
    console.log("📡 Testing database connection...")
    await executeSQL(async (sql) => {
      return await sql`SELECT 1 as test`
    })
    console.log("✅ Database connection successful")
    results.push("Database connection tested successfully")

    // Create users table
    console.log("👥 Creating users table...")
    await executeSQL(async (sql) => {
      return await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          wallet_address VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })
    console.log("✅ Users table created")
    results.push("Users table created")

    // Create sessions table
    console.log("📋 Creating sessions table...")
    await executeSQL(async (sql) => {
      return await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          owner_id VARCHAR(255) NOT NULL,
          streamer_wallet VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          canvas_data TEXT,
          total_earnings DECIMAL(12, 6) DEFAULT 0,
          viewer_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })
    console.log("✅ Sessions table created")
    results.push("Sessions table created")

    // Create session_stats table
    console.log("📊 Creating session_stats table...")
    await executeSQL(async (sql) => {
      return await sql`
        CREATE TABLE IF NOT EXISTS session_stats (
          session_id VARCHAR(255) PRIMARY KEY,
          lines_drawn INTEGER DEFAULT 0,
          nukes_used INTEGER DEFAULT 0,
          total_tokens_sold INTEGER DEFAULT 0,
          unique_participants INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    })
    console.log("✅ Session stats table created")
    results.push("Session stats table created")

    // Create user_tokens table
    console.log("🪙 Creating user_tokens table...")
    await executeSQL(async (sql) => {
      return await sql`
        CREATE TABLE IF NOT EXISTS user_tokens (
          session_id VARCHAR(255) NOT NULL,
          user_wallet VARCHAR(255) NOT NULL,
          line_tokens INTEGER DEFAULT 0,
          nuke_tokens INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (session_id, user_wallet)
        )
      `
    })
    console.log("✅ User tokens table created")
    results.push("User tokens table created")

    // Create escrow_transactions table
    console.log("🏦 Creating escrow_transactions table...")
    await executeSQL(async (sql) => {
      return await sql`
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
    })
    console.log("✅ Escrow transactions table created")
    results.push("Escrow transactions table created")

    // Add indexes
    console.log("🔍 Creating indexes...")
    const indexes = [
      {
        name: "idx_users_email",
        fn: async (sql: any) => sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      },
      {
        name: "idx_users_username",
        fn: async (sql: any) => sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      },
      {
        name: "idx_sessions_owner",
        fn: async (sql: any) => sql`CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id)`,
      },
      {
        name: "idx_user_tokens_session",
        fn: async (sql: any) => sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_session ON user_tokens(session_id)`,
      },
      {
        name: "idx_user_tokens_wallet",
        fn: async (sql: any) => sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_wallet ON user_tokens(user_wallet)`,
      },
      {
        name: "idx_escrow_transactions_session",
        fn: async (sql: any) =>
          sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_session ON escrow_transactions(session_id)`,
      },
      {
        name: "idx_escrow_transactions_user",
        fn: async (sql: any) =>
          sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_user ON escrow_transactions(user_wallet)`,
      },
      {
        name: "idx_escrow_transactions_status",
        fn: async (sql: any) =>
          sql`CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status)`,
      },
    ]

    for (const index of indexes) {
      try {
        await executeSQL(index.fn)
        console.log(`✅ Index ${index.name} created`)
        results.push(`Index ${index.name} created`)
      } catch (error) {
        console.error(`❌ Failed to create index ${index.name}:`, error)
        results.push(`Index ${index.name} failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    console.log("🎉 All migrations completed successfully!")
    results.push("All migrations completed successfully")

    return {
      success: true,
      steps: results,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("❌ Migration failed:", error)
    results.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`)

    throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
