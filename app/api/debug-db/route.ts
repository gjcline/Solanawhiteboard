import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Starting database debug...")

    // Check connection
    const connectionTest = await sql`SELECT NOW() as now, current_database() as db_name`
    console.log("✅ Database connection:", connectionTest[0])

    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log("📋 Existing tables:", tables)

    // Check users table structure if it exists
    let userTableStructure = null
    try {
      userTableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      console.log("👥 Users table structure:", userTableStructure)
    } catch (error) {
      console.log("❌ Users table doesn't exist or error:", error)
    }

    // Try a simple query on users table
    let userCount = null
    try {
      const countResult = await sql`SELECT COUNT(*) as count FROM users`
      userCount = countResult[0].count
      console.log("👥 User count:", userCount)
    } catch (error) {
      console.log("❌ Error counting users:", error)
    }

    return NextResponse.json({
      success: true,
      connection: connectionTest[0],
      tables: tables.map((t) => t.table_name),
      userTableStructure,
      userCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Debug failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
