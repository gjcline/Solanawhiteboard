import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Schema Fix] Starting comprehensive schema check and fix")

    // Step 1: Check current schema
    const currentSchema = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `

    console.log("[Schema Fix] Current sessions table schema:", currentSchema)

    // Step 2: Check if canvas_data exists and its type
    const canvasColumn = currentSchema.find((col) => col.column_name === "canvas_data")

    if (!canvasColumn) {
      // Add the column as TEXT
      await sql`ALTER TABLE sessions ADD COLUMN canvas_data TEXT`
      console.log("[Schema Fix] Added canvas_data column as TEXT")
    } else if (canvasColumn.data_type === "json") {
      // Convert from JSON to TEXT
      console.log("[Schema Fix] Converting canvas_data from JSON to TEXT...")

      // First, let's see what data exists
      const existingData = await sql`
        SELECT session_id, canvas_data 
        FROM sessions 
        WHERE canvas_data IS NOT NULL 
        LIMIT 5
      `
      console.log("[Schema Fix] Existing canvas data:", existingData)

      // Convert the column type
      await sql`ALTER TABLE sessions ALTER COLUMN canvas_data TYPE TEXT`
      console.log("[Schema Fix] Successfully converted canvas_data to TEXT")
    }

    // Step 3: Verify the fix
    const updatedSchema = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    // Step 4: Test writing canvas data
    const testSessionId = "test-" + Date.now()
    const testCanvasData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

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
      SELECT session_id, LENGTH(canvas_data) as data_length
      FROM sessions 
      WHERE session_id = ${testSessionId}
    `

    // Clean up test session
    await sql`DELETE FROM sessions WHERE session_id = ${testSessionId}`

    return NextResponse.json({
      success: true,
      message: "Schema fix completed successfully",
      before: canvasColumn || "Column did not exist",
      after: updatedSchema[0],
      testResult: testResult[0],
      fullSchema: currentSchema,
    })
  } catch (error) {
    console.error("[Schema Fix] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Schema fix failed",
        details: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}
