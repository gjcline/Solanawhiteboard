import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Simple database check...")

    // Basic connection test
    const connectionTest = await sql`SELECT NOW() as current_time`
    console.log("✅ Connection successful")

    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log(
      "📋 Tables found:",
      tables.map((t) => t.table_name),
    )

    // Check each table individually
    const tableStatus = {}

    // Users table
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      tableStatus.users = { exists: true, count: userCount[0].count }
    } catch (error) {
      tableStatus.users = { exists: false, error: error.message }
    }

    // Sessions table
    try {
      const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`
      tableStatus.sessions = { exists: true, count: sessionCount[0].count }
    } catch (error) {
      tableStatus.sessions = { exists: false, error: error.message }
    }

    // User tokens table
    try {
      const tokenCount = await sql`SELECT COUNT(*) as count FROM user_tokens`
      tableStatus.user_tokens = { exists: true, count: tokenCount[0].count }
    } catch (error) {
      tableStatus.user_tokens = { exists: false, error: error.message }
    }

    return NextResponse.json({
      success: true,
      connection: connectionTest[0],
      tables: tables.map((t) => t.table_name),
      tableStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Simple check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
