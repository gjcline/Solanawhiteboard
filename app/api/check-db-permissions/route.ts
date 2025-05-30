import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Check DB Permissions] Testing database permissions")

    // Test 1: Can we read from the database?
    console.log("[Check DB Permissions] Test 1: Reading from database")
    const readResult = await sql`
      SELECT COUNT(*) as session_count FROM sessions
    `

    // Test 2: Can we create a temporary table?
    console.log("[Check DB Permissions] Test 2: Creating temporary table")
    await sql`
      CREATE TEMPORARY TABLE IF NOT EXISTS permission_test (
        id SERIAL PRIMARY KEY,
        test_data TEXT
      )
    `

    // Test 3: Can we write to the temporary table?
    console.log("[Check DB Permissions] Test 3: Writing to temporary table")
    const writeResult = await sql`
      INSERT INTO permission_test (test_data)
      VALUES ('Test data at ${new Date().toISOString()}')
      RETURNING id
    `

    // Test 4: Can we update an existing session?
    console.log("[Check DB Permissions] Test 4: Updating a session")
    const updateResult = await sql`
      UPDATE sessions
      SET updated_at = NOW()
      WHERE session_id = (
        SELECT session_id FROM sessions ORDER BY created_at DESC LIMIT 1
      )
      RETURNING session_id
    `

    return NextResponse.json({
      success: true,
      tests: {
        read: {
          success: true,
          sessionCount: readResult[0].session_count,
        },
        createTable: {
          success: true,
        },
        write: {
          success: true,
          insertedId: writeResult[0]?.id,
        },
        update: {
          success: updateResult.length > 0,
          updatedSession: updateResult[0]?.session_id,
        },
      },
      message: "Database permissions check completed successfully",
    })
  } catch (error) {
    console.error("[Check DB Permissions] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database permissions check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
