import { sql } from "@/lib/database"

export async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup...")

    // Test connection first
    const testResult = await sql`SELECT NOW() as now, current_database() as db_name`
    console.log("✅ Connected to database:", testResult[0])

    // COMPLETELY DROP AND RECREATE ALL TABLES
    console.log("🧹 Dropping all existing tables...")
    await sql`DROP TABLE IF EXISTS user_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS sessions CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    console.log("👥 Creating USERS table...")
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("📋 Creating SESSIONS table...")
    await sql`
      CREATE TABLE sessions (
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

    console.log("📊 Creating SESSION_STATS table...")
    await sql`
      CREATE TABLE session_stats (
        session_id VARCHAR(255) PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
        lines_drawn INTEGER DEFAULT 0,
        nukes_used INTEGER DEFAULT 0,
        total_tokens_sold INTEGER DEFAULT 0,
        unique_participants INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("🪙 Creating USER_TOKENS table...")
    await sql`
      CREATE TABLE user_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
        line_tokens INTEGER DEFAULT 0,
        nuke_tokens INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // VERIFY EACH TABLE WAS CREATED CORRECTLY
    console.log("🔍 Verifying table creation...")

    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("👥 USERS table columns:", usersColumns)

    const sessionsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("📋 SESSIONS table columns:", sessionsColumns)

    const sessionStatsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'session_stats' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("📊 SESSION_STATS table columns:", sessionStatsColumns)

    const tokensColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_tokens' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("🪙 USER_TOKENS table columns:", tokensColumns)

    // TEST INSERTING A USER AND SESSION
    console.log("🧪 Testing user and session insertion...")
    const testUser = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES ('testuser123', 'test123@example.com', 'hashedpassword123')
      RETURNING id, username, email
    `
    console.log("✅ Test user created:", testUser[0])

    const testSession = await sql`
      INSERT INTO sessions (id, name, owner_id, streamer_wallet)
      VALUES ('test123', 'Test Session', ${testUser[0].id}, 'test-wallet-address')
      RETURNING id, name, owner_id
    `
    console.log("✅ Test session created:", testSession[0])

    // CLEAN UP TEST DATA
    await sql`DELETE FROM sessions WHERE id = 'test123'`
    await sql`DELETE FROM users WHERE email = 'test123@example.com'`
    console.log("🧹 Test data cleaned up")

    // FINAL TABLE LIST
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    return {
      success: true,
      message: "Database setup completed successfully!",
      database: testResult[0].db_name,
      tables: finalTables.map((t) => t.table_name),
      usersColumns: usersColumns,
      sessionsColumns: sessionsColumns,
      sessionStatsColumns: sessionStatsColumns,
      tokensColumns: tokensColumns,
      timestamp: testResult[0].now,
    }
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}
