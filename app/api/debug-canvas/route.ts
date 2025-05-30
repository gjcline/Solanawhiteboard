import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Debug Canvas] Checking all sessions with canvas data")

    const sessions = await sql`
      SELECT 
        session_id, 
        name, 
        is_active,
        CASE 
          WHEN canvas_data IS NULL THEN 'NULL'
          WHEN canvas_data = '' THEN 'EMPTY'
          ELSE CONCAT('LENGTH:', LENGTH(canvas_data))
        END as canvas_status,
        created_at,
        updated_at
      FROM sessions 
      ORDER BY updated_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      sessions: sessions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Debug Canvas] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to debug canvas data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, testData } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    console.log(`[Debug Canvas] Testing save for session: ${sessionId}`)

    const testCanvasData =
      testData ||
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${testCanvasData}, updated_at = NOW()
      WHERE session_id = ${sessionId}
      RETURNING session_id, updated_at, LENGTH(canvas_data) as data_length
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      result: result[0],
      message: "Test canvas data saved successfully",
    })
  } catch (error) {
    console.error("[Debug Canvas] Save test error:", error)
    return NextResponse.json(
      {
        error: "Failed to save test data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
