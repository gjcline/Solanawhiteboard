import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== Health Check Starting ===")

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json({
        status: "unhealthy",
        error: "DATABASE_URL environment variable is not configured",
        timestamp: new Date().toISOString(),
      })
    }

    // Try to connect to database
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL)

    const result = await sql`SELECT NOW() as now`

    console.log("Health check successful")

    return NextResponse.json({
      status: "healthy",
      timestamp: result[0].now,
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Health check failed:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json({
      status: "unhealthy",
      error: errorMessage,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
  }
}
