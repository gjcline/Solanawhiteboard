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

    // Parse the request body safely
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[Canvas API POST] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { canvasData } = body

    if (!canvasData || typeof canvasData !== "string") {
      console.error("[Canvas API POST] Invalid canvas data:", typeof canvasData)
      return NextResponse.json({ error: "Canvas data must be a valid string" }, { status: 400 })
    }

    // Validate that it's a data URL
    if (!canvasData.startsWith("data:image/")) {
      console.error("[Canvas API POST] Invalid data URL format")
      return NextResponse.json({ error: "Canvas data must be a valid data URL" }, { status: 400 })
    }

    console.log(`[Canvas API POST] Saving canvas data - Length: ${canvasData.length}`)

    // First check if session exists and is active
    const sessionCheck = await sql`
      SELECT session_id, is_active FROM sessions 
      WHERE session_id = ${params.sessionId}
    `

    if (sessionCheck.length === 0) {
      console.log(`[Canvas API POST] Session not found: ${params.sessionId}`)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (!sessionCheck[0].is_active) {
      console.log(`[Canvas API POST] Session inactive: ${params.sessionId}`)
      return NextResponse.json({ error: "Session inactive" }, { status: 404 })
    }

    // Use parameterized query to safely store the canvas data as text
    try {
      const updateResult = await sql.query(
        `
        UPDATE sessions 
        SET canvas_data = $1, updated_at = NOW()
        WHERE session_id = $2 AND is_active = true
        RETURNING session_id, updated_at
      `,
        [canvasData, params.sessionId],
      )

      console.log(`[Canvas API POST] Update result:`, updateResult)

      if (!updateResult || updateResult.length === 0) {
        console.log(`[Canvas API POST] Update failed - no rows returned`)
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
      }

      console.log(`[Canvas API POST] SUCCESS - Canvas saved for session: ${params.sessionId}`)

      return NextResponse.json({
        success: true,
        sessionId: params.sessionId,
        updatedAt: updateResult[0].updated_at,
        dataLength: canvasData.length,
      })
    } catch (sqlError) {
      console.error("[Canvas API POST] SQL Error:", sqlError)
      return NextResponse.json(
        {
          error: "Database error",
          details: sqlError instanceof Error ? sqlError.message : "Unknown SQL error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[Canvas API POST] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
