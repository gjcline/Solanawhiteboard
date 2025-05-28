import { query } from "../lib/database"

async function runMigrations() {
  console.log("Running database migrations...")

  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("✅ Users table created")

    // Create sessions table
    await query(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `)
    console.log("✅ Sessions table created")

    // Create session_stats table
    await query(`
      CREATE TABLE IF NOT EXISTS session_stats (
        session_id VARCHAR(255) PRIMARY KEY,
        lines_drawn INTEGER DEFAULT 0,
        nukes_used INTEGER DEFAULT 0,
        total_tokens_sold INTEGER DEFAULT 0,
        unique_participants INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `)
    console.log("✅ Session stats table created")

    // Create user_tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS user_tokens (
        session_id VARCHAR(255) NOT NULL,
        user_wallet VARCHAR(255) NOT NULL,
        line_tokens INTEGER DEFAULT 0,
        nuke_tokens INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, user_wallet)
      )
    `)
    console.log("✅ User tokens table created")

    // Add indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_tokens_session ON user_tokens(session_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_tokens_wallet ON user_tokens(user_wallet)
    `)
    console.log("✅ Indexes created")

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
}

export { runMigrations }
