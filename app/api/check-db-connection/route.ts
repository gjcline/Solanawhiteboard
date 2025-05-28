import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { dbUrl } = await request.json()

    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Database URL is required",
        },
        { status: 400 },
      )
    }

    // Test connection with provided URL
    const { neon } = await import("@neondatabase/serverless")
    const testSql = neon(dbUrl)

    const result = await testSql`SELECT NOW() as now, version() as version`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: result[0].now,
      version: result[0].version,
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
