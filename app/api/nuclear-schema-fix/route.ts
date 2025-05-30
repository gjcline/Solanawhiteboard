import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Nuclear Schema Fix] Starting nuclear approach to fix canvas_data column")

    // Step 1: Check if canvas_data column exists
    const columnCheck = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions' AND column_name = 'canvas_data'
    `

    console.log("[Nuclear Schema Fix] Current column info:", columnCheck)

    // Step 2: If column exists, drop it completely (nuclear option)
    if (columnCheck.length > 0) {
      console.log("[Nuclear Schema Fix] Dropping existing canvas_data column")
      await sql`ALTER TABLE sessions DROP COLUMN IF EXISTS canvas_data`
      console.log("[Nuclear Schema Fix] Column dropped successfully")
    }

    // Step 3: Add new TEXT column
    console.log("[Nuclear Schema Fix] Adding new canvas_data column as TEXT")
    await sql`ALTER TABLE sessions ADD COLUMN canvas_data TEXT`
    console.log("[Nuclear Schema Fix] New TEXT column added")

    // Step 4: Verify the new column
    const newColumnCheck = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions' AND column_name = 'canvas_data'
    `

    console.log("[Nuclear Schema Fix] New column info:", newColumnCheck)

    // Step 5: Test writing to the new column
    const testSessionId = "test-nuclear-" + Date.now()
    const testCanvasData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    // Create test session
    await sql`
      INSERT INTO sessions (session_id, name, streamer_wallet, is_active, created_at, updated_at)
      VALUES (${testSessionId}, 'Nuclear Test', 'test-wallet', true, NOW(), NOW())
    `

    // Test saving canvas data
    await sql`
      UPDATE sessions 
      SET canvas_data = ${testCanvasData}
      WHERE session_id = ${testSessionId}
    `

    // Verify it was saved
    const testResult = await sql`
      SELECT session_id, canvas_data, LENGTH(canvas_data) as data_length
      FROM sessions 
      WHERE session_id = ${testSessionId}
    `

    // Clean up test session
    await sql`DELETE FROM sessions WHERE session_id = ${testSessionId}`

    console.log("[Nuclear Schema Fix] Test result:", testResult[0])

    return NextResponse.json({
      success: true,
      message: "Nuclear schema fix completed successfully",
      oldColumn: columnCheck[0] || "Column did not exist",
      newColumn: newColumnCheck[0],
      testResult: {
        sessionId: testResult[0].session_id,
        dataLength: testResult[0].data_length,
        canSaveData: true,
      },
    })
  } catch (error) {
    console.error("[Nuclear Schema Fix] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Nuclear schema fix failed",
        details: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
