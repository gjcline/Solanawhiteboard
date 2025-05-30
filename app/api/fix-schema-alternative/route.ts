import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Schema Fix Alt] Starting alternative schema fix approach")

    // Step 1: Check current schema
    const currentSchema = await sql`
      SELECT 
        column_name, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    console.log("[Schema Fix Alt] Current canvas_data column:", currentSchema)

    // If column doesn't exist, create it as TEXT
    if (currentSchema.length === 0) {
      await sql`ALTER TABLE sessions ADD COLUMN canvas_data TEXT`
      console.log("[Schema Fix Alt] Added canvas_data column as TEXT")

      return NextResponse.json({
        success: true,
        message: "Added canvas_data column as TEXT",
      })
    }

    // If column exists but is JSON type, we need to use a different approach
    if (currentSchema[0].data_type === "json") {
      console.log("[Schema Fix Alt] Found JSON column, using alternative approach")

      // Step 2: Create a new temporary column
      try {
        await sql`ALTER TABLE sessions ADD COLUMN canvas_data_new TEXT`
        console.log("[Schema Fix Alt] Added temporary TEXT column")
      } catch (e) {
        console.log("[Schema Fix Alt] Temporary column may already exist:", e)
        // If it fails, the column might already exist from a previous attempt
      }

      // Step 3: Try to copy any valid data (this might fail for some rows)
      try {
        await sql`
          UPDATE sessions 
          SET canvas_data_new = canvas_data::TEXT 
          WHERE canvas_data IS NOT NULL
        `
        console.log("[Schema Fix Alt] Copied valid data to new column")
      } catch (e) {
        console.log("[Schema Fix Alt] No valid data to copy or conversion failed:", e)
        // This is expected to fail if the data isn't valid JSON
      }

      // Step 4: Drop the old column
      await sql`ALTER TABLE sessions DROP COLUMN canvas_data`
      console.log("[Schema Fix Alt] Dropped old JSON column")

      // Step 5: Rename the new column
      await sql`ALTER TABLE sessions RENAME COLUMN canvas_data_new TO canvas_data`
      console.log("[Schema Fix Alt] Renamed new column to canvas_data")
    }

    // Step 6: Verify the fix
    const updatedSchema = await sql`
      SELECT 
        column_name, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    // Step 7: Test writing canvas data
    const testSessionId = "test-" + Date.now()
    const testCanvasData = "data:image/png;base64,test123"

    // Create a test session
    await sql`
      INSERT INTO sessions (session_id, name, streamer_wallet, is_active, created_at, updated_at)
      VALUES (${testSessionId}, 'Test Session', 'test-wallet', true, NOW(), NOW())
    `

    // Test saving canvas data
    await sql`
      UPDATE sessions 
      SET canvas_data = ${testCanvasData}
      WHERE session_id = ${testSessionId}
    `

    // Verify it was saved
    const testResult = await sql`
      SELECT session_id, canvas_data
      FROM sessions 
      WHERE session_id = ${testSessionId}
    `

    // Clean up test session
    await sql`DELETE FROM sessions WHERE session_id = ${testSessionId}`

    return NextResponse.json({
      success: true,
      message: "Alternative schema fix completed successfully",
      before: currentSchema[0],
      after: updatedSchema[0],
      testResult: testResult[0],
    })
  } catch (error) {
    console.error("[Schema Fix Alt] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Alternative schema fix failed",
        details: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
