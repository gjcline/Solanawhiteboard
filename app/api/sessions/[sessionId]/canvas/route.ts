import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log(`[Canvas API GET] Session: ${params.sessionId}`)

    // Simple query to get canvas data
    const result = await sql`
      SELECT canvas_data, updated_at, is_active 
      FROM sessions 
      WHERE session_id = ${params.sessionId}
    `

    if (result.length === 0) {
      console.log(`[Canvas API GET] Session not found: ${params.sessionId}`)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = result[0]

    if (!session.is_active) {
      console.log(`[Canvas API GET] Session inactive: ${params.sessionId}`)
      return NextResponse.json({ error: "Session inactive" }, { status: 404 })
    }

    console.log(`[Canvas API GET] Success - Canvas data length: ${session.canvas_data?.length || 0}`)

    return NextResponse.json({
      canvasData: session.canvas_data || null,
      lastUpdated: session.updated_at,
      sessionId: params.sessionId,
    })
  } catch (error) {
    console.error("[Canvas API GET] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log(`[Canvas API POST] Session: ${params.sessionId}`)

    const { canvasData } = await request.json()

    if (!canvasData) {
      return NextResponse.json({ error: "Canvas data required" }, { status: 400 })
    }

    console.log(`[Canvas API POST] Saving canvas data length: ${canvasData.length}`)

    // Update canvas data
    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, updated_at = NOW()
      WHERE session_id = ${params.sessionId} AND is_active = true
      RETURNING session_id, updated_at
    `

    if (result.length === 0) {
      console.log(`[Canvas API POST] Session not found or inactive: ${params.sessionId}`)
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    console.log(`[Canvas API POST] Success - Canvas saved for session: ${params.sessionId}`)

    return NextResponse.json({
      success: true,
      sessionId: params.sessionId,
      updatedAt: result[0].updated_at,
    })
  } catch (error) {
    console.error("[Canvas API POST] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
