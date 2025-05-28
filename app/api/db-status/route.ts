import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: "not_configured",
        message: "DATABASE_URL environment variable is not set",
      })
    }

    // Try to import neon
    try {
      const { neon } = await import("@neondatabase/serverless")
      const sql = neon(process.env.DATABASE_URL)

      // Simple query to test connection
      const result = await sql`SELECT 1 as connected`

      return NextResponse.json({
        status: "connected",
        message: "Successfully connected to database",
        details: {
          connected: result[0].connected === 1,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      return NextResponse.json({
        status: "error",
        message: "Failed to connect to database",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
