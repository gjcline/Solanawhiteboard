import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

// GET canvas data
export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    console.log(`[Simple Canvas GET] Session: ${sessionId}`)

    const result = await sql`
      SELECT canvas_data, updated_at
      FROM sessions 
      WHERE session_id = ${sessionId} AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      canvasData: result[0].canvas_data,
      lastUpdated: result[0].updated_at,
    })
  } catch (error) {
    console.error("[Simple Canvas GET] Error:", error)
    return NextResponse.json({ error: "Failed to get canvas data" }, { status: 500 })
  }
}

// POST canvas data
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const { canvasData } = await request.json()

    console.log(`[Simple Canvas POST] Session: ${sessionId}, Data length: ${canvasData?.length || 0}`)

    if (!canvasData) {
      return NextResponse.json({ error: "Canvas data required" }, { status: 400 })
    }

    // Update canvas data
    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, updated_at = NOW()
      WHERE session_id = ${sessionId} AND is_active = true
      RETURNING session_id, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    console.log(`[Simple Canvas POST] Success for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      sessionId: result[0].session_id,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("[Simple Canvas POST] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to save canvas data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
