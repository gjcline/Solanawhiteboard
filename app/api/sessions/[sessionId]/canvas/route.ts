import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

// GET handler to retrieve canvas data
export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    console.log(`[Canvas API GET] Retrieving canvas data for session: ${sessionId}`)

    const result = await sql`
      SELECT canvas_data 
      FROM sessions 
      WHERE session_id = ${sessionId}
    `

    if (result.length === 0) {
      console.log(`[Canvas API GET] Session not found: ${sessionId}`)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const canvasData = result[0].canvas_data
    console.log(`[Canvas API GET] Success - Canvas data length: ${canvasData?.length || 0}`)

    return NextResponse.json({ canvasData })
  } catch (error) {
    console.error("[Canvas API GET] Error:", error)
    return NextResponse.json({ error: "Failed to retrieve canvas data" }, { status: 500 })
  }
}

// PUT handler to update canvas data
export async function PUT(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const { canvasData } = await request.json()

    console.log(`[Canvas API PUT] Updating canvas for session: ${sessionId}`)
    console.log(`[Canvas API PUT] Canvas data length: ${canvasData?.length || 0}`)

    if (!canvasData) {
      console.log("[Canvas API PUT] No canvas data provided")
      return NextResponse.json({ error: "Canvas data is required" }, { status: 400 })
    }

    // First check if session exists
    const sessionCheck = await sql`
      SELECT session_id FROM sessions WHERE session_id = ${sessionId}
    `

    if (sessionCheck.length === 0) {
      console.log(`[Canvas API PUT] Session not found: ${sessionId}`)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Update the canvas data using parameterized query
    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, updated_at = NOW()
      WHERE session_id = ${sessionId}
      RETURNING session_id, updated_at
    `

    console.log(`[Canvas API PUT] Canvas updated successfully for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      sessionId: result[0].session_id,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("[Canvas API PUT] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update canvas data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
