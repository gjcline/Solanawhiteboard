import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const result = await sql`
      SELECT s.*, 
             COALESCE(st.lines_drawn, 0) as lines_drawn,
             COALESCE(st.nukes_used, 0) as nukes_used,
             COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
             COALESCE(st.unique_participants, 0) as unique_participants
      FROM sessions s
      LEFT JOIN session_stats st ON s.session_id = st.session_id
      WHERE s.session_id = ${params.sessionId}
    `

    const session = result[0]

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      session,
      exists: true,
      isActive: session.is_active,
    })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const updates = await request.json()

    // Build dynamic update query based on provided fields
    const updateFields = []
    const values = []

    if (updates.name !== undefined) {
      updateFields.push("name = $" + (values.length + 1))
      values.push(updates.name)
    }

    if (updates.streamer_wallet !== undefined) {
      updateFields.push("streamer_wallet = $" + (values.length + 1))
      values.push(updates.streamer_wallet)
    }

    if (updates.is_active !== undefined) {
      updateFields.push("is_active = $" + (values.length + 1))
      values.push(updates.is_active)
    }

    if (updates.canvas_data !== undefined) {
      updateFields.push("canvas_data = $" + (values.length + 1))
      values.push(updates.canvas_data)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updateFields.push("updated_at = NOW()")
    values.push(params.sessionId)

    const result = await sql`
      UPDATE sessions 
      SET ${sql.raw(updateFields.join(", "))}
      WHERE session_id = ${params.sessionId}
      RETURNING *
    `

    const session = result[0]

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const result = await sql`
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE session_id = ${params.sessionId}
      RETURNING *
    `

    const session = result[0]

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
