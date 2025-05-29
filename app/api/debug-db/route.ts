import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Starting enhanced database debug...")

    // Test basic connection first
    let connectionTest
    try {
      connectionTest = await sql`SELECT NOW() as now, version() as version`
      console.log("✅ Database connection successful:", connectionTest[0])
    } catch (error) {
      console.error("❌ Connection failed:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Check what tables exist
    let tables = []
    try {
      const tableResult = await sql`
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      tables = tableResult
      console.log("📋 Existing tables:", tables)
    } catch (error) {
      console.error("❌ Error fetching tables:", error)
    }

    // Check users table
    const usersInfo = { exists: false, structure: null, count: null, sample: null }
    try {
      const usersStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      usersInfo.exists = usersStructure.length > 0
      usersInfo.structure = usersStructure

      if (usersInfo.exists) {
        const countResult = await sql`SELECT COUNT(*) as count FROM users`
        usersInfo.count = countResult[0].count

        // Try to get sample data with common columns
        try {
          const sampleResult = await sql`SELECT * FROM users LIMIT 3`
          usersInfo.sample = sampleResult
        } catch (error) {
          console.log("Could not get users sample data:", error)
          usersInfo.sample = []
        }
      }
    } catch (error) {
      console.error("❌ Error checking users table:", error)
      usersInfo.error = error instanceof Error ? error.message : String(error)
    }

    // Check sessions table
    const sessionsInfo = { exists: false, structure: null, count: null, sample: null }
    try {
      const sessionsStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'sessions' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      sessionsInfo.exists = sessionsStructure.length > 0
      sessionsInfo.structure = sessionsStructure

      if (sessionsInfo.exists) {
        const countResult = await sql`SELECT COUNT(*) as count FROM sessions`
        sessionsInfo.count = countResult[0].count

        // Try to get sample data
        try {
          const sampleResult = await sql`SELECT * FROM sessions LIMIT 3`
          sessionsInfo.sample = sampleResult
        } catch (error) {
          console.log("Could not get sessions sample data:", error)
          sessionsInfo.sample = []
        }
      }
    } catch (error) {
      console.error("❌ Error checking sessions table:", error)
      sessionsInfo.error = error instanceof Error ? error.message : String(error)
    }

    // Check user_tokens table
    const userTokensInfo = { exists: false, structure: null, count: null, sample: null }
    try {
      const userTokensStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_tokens' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      userTokensInfo.exists = userTokensStructure.length > 0
      userTokensInfo.structure = userTokensStructure

      if (userTokensInfo.exists) {
        const countResult = await sql`SELECT COUNT(*) as count FROM user_tokens`
        userTokensInfo.count = countResult[0].count

        // Try to get sample data
        try {
          const sampleResult = await sql`SELECT * FROM user_tokens LIMIT 3`
          userTokensInfo.sample = sampleResult
        } catch (error) {
          console.log("Could not get user_tokens sample data:", error)
          userTokensInfo.sample = []
        }
      }
    } catch (error) {
      console.error("❌ Error checking user_tokens table:", error)
      userTokensInfo.error = error instanceof Error ? error.message : String(error)
    }

    // Environment check
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_UNPOOLED: !!process.env.DATABASE_URL_UNPOOLED,
      NODE_ENV: process.env.NODE_ENV,
    }

    const result = {
      success: true,
      connection: connectionTest[0],
      environment: envCheck,
      tables: tables.map((t) => ({ name: t.table_name, schema: t.table_schema })),
      tableDetails: {
        users: usersInfo,
        sessions: sessionsInfo,
        user_tokens: userTokensInfo,
      },
      timestamp: new Date().toISOString(),
    }

    console.log("✅ Debug complete:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Debug failed with error:", error)

    // More detailed error information
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    }

    return NextResponse.json(
      {
        success: false,
        error: "Database debug failed",
        errorDetails: errorInfo,
        environment: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
