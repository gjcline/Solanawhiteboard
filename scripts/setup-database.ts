import { sql } from "@/lib/database"

export async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup in production...")

    // Test connection
    const testResult = await sql`SELECT NOW() as now, current_database() as db_name`
    console.log("✅ Connected to database:", testResult[0])

    // Check existing tables first
    console.log("🔍 Checking existing tables...")
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log(
      "Existing tables:",
      existingTables.map((t) => t.table_name),
    )

    // Check if users table exists and its structure
    try {
      const userTableStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      console.log("Users table structure:", userTableStructure)
    } catch (error) {
      console.log("Users table doesn't exist or error checking structure:", error)
    }

    // Drop existing tables if they exist (for clean setup)
    console.log("🧹 Cleaning up existing tables...")
    await sql`DROP TABLE IF EXISTS user_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS sessions CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table with correct structure
    console.log("👥 Creating users table...")
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

    // Verify users table was created correctly
    console.log("🔍 Verifying users table structure...")
    const newUserTableStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("New users table structure:", newUserTableStructure)

    // Create sessions table
    console.log("📋 Creating sessions table...")
    await sql`
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        canvas_data JSONB,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_tokens table
    console.log("🪙 Creating user_tokens table...")
    await sql`
      CREATE TABLE user_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id VARCHAR(255) REFERENCES sessions(session_id),
        line_tokens INTEGER DEFAULT 0,
        nuke_tokens INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Verify all tables were created
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log(
      "🎉 Database setup complete! Tables created:",
      finalTables.map((t) => t.table_name),
    )

    // Test inserting a user to make sure everything works
    console.log("🧪 Testing user creation...")
    const testUser = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES ('testuser', 'test@example.com', 'testhash')
      RETURNING id, username, email
    `
    console.log("✅ Test user created:", testUser[0])

    // Clean up test user
    await sql`DELETE FROM users WHERE email = 'test@example.com'`
    console.log("🧹 Test user cleaned up")

    return {
      success: true,
      message: "Database setup completed successfully in production",
      database: testResult[0].db_name,
      tables: finalTables.map((t) => t.table_name),
      userTableStructure: newUserTableStructure,
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
