import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: Request) {
  try {
    console.log("[Test DB Write] Starting database write test")

    // Get the session ID from the query string if provided
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sessionId")

    // If no session ID provided, list recent sessions
    if (!sessionId) {
      const sessions = await sql`
        SELECT session_id, name, is_active, updated_at
        FROM sessions
        ORDER BY updated_at DESC
        LIMIT 5
      `

      return NextResponse.json({
        message: "Please provide a sessionId query parameter to test writing to that session",
        availableSessions: sessions,
      })
    }

    // Check if session exists
    const sessionCheck = await sql`
      SELECT session_id, name, is_active, 
        CASE WHEN canvas_data IS NULL THEN 'NULL' 
             WHEN canvas_data = '' THEN 'EMPTY'
             ELSE 'DATA_EXISTS' 
        END as canvas_status
      FROM sessions
      WHERE session_id = ${sessionId}
    `

    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Generate a simple test image
    const testData = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAA70lEQVR4nO3bQQ0AIRAEwcMJfhYPWEHIV0MqYOGbGQXdcq+Z2QFP3OsB+MYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQGUNkDJExRMYQmQ+1DQRNyd676QAAAABJRU5ErkJggg==`

    // Try to write to the database - Use text type instead of JSON
    try {
      const result = await sql.query(
        `
        UPDATE sessions
        SET canvas_data = $1, updated_at = NOW()
        WHERE session_id = $2
        RETURNING session_id, updated_at
      `,
        [testData, sessionId],
      )

      console.log(`[Test DB Write] Update result:`, result)

      if (!result || result.length === 0) {
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
      }

      // Try to read it back
      const verification = await sql`
        SELECT session_id, 
          CASE WHEN canvas_data IS NULL THEN 'NULL' 
               WHEN canvas_data = '' THEN 'EMPTY'
               ELSE 'DATA_SAVED_SUCCESSFULLY' 
          END as canvas_status,
          updated_at
        FROM sessions
        WHERE session_id = ${sessionId}
      `

      return NextResponse.json({
        success: true,
        message: "Database write test completed",
        beforeWrite: sessionCheck[0],
        writeResult: result[0],
        verification: verification[0],
        testImageUrl: "/api/test-db-image?sessionId=" + sessionId,
      })
    } catch (error) {
      console.error("[Test DB Write] SQL Error:", error)
      return NextResponse.json(
        {
          error: "SQL error",
          details: error instanceof Error ? error.message : "Unknown SQL error",
          sessionInfo: sessionCheck[0],
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[Test DB Write] Error:", error)
    return NextResponse.json(
      {
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
