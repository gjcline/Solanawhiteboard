import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("[Test Canvas Sync] Starting test...")

    // Get all active sessions
    const sessions = await sql`
      SELECT session_id, name, canvas_data, updated_at, is_active
      FROM sessions 
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT 10
    `

    console.log(`[Test Canvas Sync] Found ${sessions.length} active sessions`)

    const testResults = sessions.map((session) => ({
      sessionId: session.session_id,
      name: session.name,
      hasCanvasData: !!session.canvas_data,
      canvasDataLength: session.canvas_data?.length || 0,
      lastUpdated: session.updated_at,
      isActive: session.is_active,
    }))

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeSessions: sessions.length,
      sessions: testResults,
    })
  } catch (error) {
    console.error("[Test Canvas Sync] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, testData } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    console.log(`[Test Canvas Sync] Testing session: ${sessionId}`)

    // Test canvas data save
    const testCanvasData =
      testData ||
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${testCanvasData}, updated_at = NOW()
      WHERE session_id = ${sessionId} AND is_active = true
      RETURNING session_id, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    console.log(`[Test Canvas Sync] Test data saved for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      sessionId,
      updatedAt: result[0].updated_at,
      message: "Test canvas data saved successfully",
    })
  } catch (error) {
    console.error("[Test Canvas Sync] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
