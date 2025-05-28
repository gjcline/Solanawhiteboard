import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== Database Test Starting ===")

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      return NextResponse.json(
        {
          success: false,
          message: "DATABASE_URL environment variable is not configured",
          error: "Missing DATABASE_URL",
        },
        { status: 500 },
      )
    }

    // Log a sanitized version of the connection string for debugging
    const dbUrlSafe = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, "//[username]:[password]@")
    console.log("Using database URL:", dbUrlSafe)

    // Try to import neon
    try {
      console.log("Importing @neondatabase/serverless...")
      const neonModule = await import("@neondatabase/serverless")
      console.log("Neon import successful:", Object.keys(neonModule))

      if (!neonModule.neon) {
        throw new Error("neon function not found in imported module")
      }
    } catch (importError) {
      console.error("Failed to import @neondatabase/serverless:", importError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to import database driver",
          error: importError instanceof Error ? importError.message : String(importError),
        },
        { status: 500 },
      )
    }

    // Create a simple test function that doesn't rely on our database.ts
    const testDatabaseConnection = async () => {
      const { neon } = await import("@neondatabase/serverless")

      try {
        console.log("Creating SQL connection...")
        const sql = neon(process.env.DATABASE_URL!)
        console.log("SQL connection created")

        console.log("Executing test query...")
        const result = await sql`SELECT 1 as test, NOW() as timestamp`
        console.log("Query executed successfully:", result)

        return {
          success: true,
          result: result[0],
        }
      } catch (dbError) {
        console.error("Database connection error:", dbError)
        throw dbError
      }
    }

    // Execute the test
    const testResult = await testDatabaseConnection()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      result: testResult.result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Database Test Failed ===")
    console.error("Error details:", error)

    // Try to extract as much information as possible
    let errorInfo = {
      message: "Unknown error",
      name: "UnknownError",
      stack: undefined as string | undefined,
    }

    if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      }
    } else if (typeof error === "string") {
      errorInfo.message = error
    } else if (error && typeof error === "object") {
      errorInfo.message = JSON.stringify(error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: errorInfo.message,
        errorName: errorInfo.name,
        stack: process.env.NODE_ENV !== "production" ? errorInfo.stack : undefined,
        environment: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlFormat: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, "//[username]:[password]@").substring(0, 30) +
            "..."
          : "not set",
      },
      { status: 500 },
    )
  }
}
