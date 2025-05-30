import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    console.log("[Test Canvas Save] Testing with session:", sessionId)

    // Create a simple test image (1x1 pixel red dot)
    const testCanvasData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

    // Check if session exists
    const sessionCheck = await sql`
      SELECT session_id, is_active FROM sessions 
      WHERE session_id = ${sessionId}
    `

    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Try to save canvas data
    const saveResult = await sql`
      UPDATE sessions 
      SET canvas_data = ${testCanvasData}, updated_at = NOW()
      WHERE session_id = ${sessionId}
      RETURNING session_id, updated_at
    `

    // Verify it was saved
    const verifyResult = await sql`
      SELECT 
        session_id, 
        LENGTH(canvas_data) as canvas_data_length,
        LEFT(canvas_data, 50) as canvas_data_preview
      FROM sessions 
      WHERE session_id = ${sessionId}
    `

    return NextResponse.json({
      success: true,
      message: "Canvas data saved and verified",
      sessionId,
      saveResult: saveResult[0],
      verification: verifyResult[0],
    })
  } catch (error) {
    console.error("[Test Canvas Save] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Canvas save test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
