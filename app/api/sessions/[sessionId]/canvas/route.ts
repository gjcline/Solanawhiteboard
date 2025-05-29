import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log(`[Canvas API] GET request for session: ${params.sessionId}`)

    const result = await sql`
      SELECT canvas_data, updated_at FROM sessions 
      WHERE session_id = ${params.sessionId} AND is_active = true
    `

    const session = result[0]
    console.log(`[Canvas API] Found session:`, !!session, session?.updated_at)

    return NextResponse.json({
      canvasData: session?.canvas_data || null,
      timestamp: Date.now(),
      lastUpdated: session?.updated_at || null,
      sessionId: params.sessionId,
    })
  } catch (error) {
    console.error("[Canvas API] Error fetching canvas data:", error)
    return NextResponse.json({ error: "Failed to fetch canvas data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { canvasData } = await request.json()
    console.log(`[Canvas API] POST request for session: ${params.sessionId}`)
    console.log(`[Canvas API] Canvas data length:`, canvasData?.length || 0)

    if (!canvasData) {
      return NextResponse.json({ error: "Canvas data is required" }, { status: 400 })
    }

    // Update canvas data in database
    const result = await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, updated_at = NOW()
      WHERE session_id = ${params.sessionId} AND is_active = true
      RETURNING updated_at
    `

    console.log(`[Canvas API] Canvas saved successfully:`, !!result[0])

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      updated: !!result[0],
      sessionId: params.sessionId,
    })
  } catch (error) {
    console.error("[Canvas API] Error saving canvas data:", error)
    return NextResponse.json({ error: "Failed to save canvas data" }, { status: 500 })
  }
}
