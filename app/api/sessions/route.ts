import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner_id = searchParams.get("owner_id")

    if (!owner_id) {
      return NextResponse.json({ error: "Owner ID required" }, { status: 400 })
    }

    // Validate that owner_id is a valid number
    const ownerIdNum = Number.parseInt(owner_id, 10)
    if (isNaN(ownerIdNum)) {
      console.error("Invalid owner_id provided:", owner_id)
      return NextResponse.json({ error: "Invalid owner ID format" }, { status: 400 })
    }

    console.log("Fetching sessions for owner_id:", ownerIdNum)

    // Now try to fetch sessions
    const sessions = await sql`
      SELECT s.*, 
             COALESCE(st.lines_drawn, 0) as lines_drawn,
             COALESCE(st.nukes_used, 0) as nukes_used,
             COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
             COALESCE(st.unique_participants, 0) as unique_participants,
             0 as active_viewers
      FROM sessions s
      LEFT JOIN session_stats st ON s.session_id = st.session_id
      WHERE s.owner_id = ${ownerIdNum} 
      ORDER BY s.created_at DESC
    `

    console.log("Found sessions:", sessions.length)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, owner_id, streamer_wallet } = body

    if (!name || !owner_id || !streamer_wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate owner_id is a number
    const ownerIdNum = Number.parseInt(owner_id, 10)
    if (isNaN(ownerIdNum)) {
      console.error("Invalid owner_id provided:", owner_id)
      return NextResponse.json({ error: "Invalid owner ID format" }, { status: 400 })
    }

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2, 14)

    console.log("Creating session:", { session_id: sessionId, name, owner_id: ownerIdNum, streamer_wallet })

    const session = await sql`
      INSERT INTO sessions (session_id, name, owner_id, streamer_wallet, is_active, total_earnings, viewer_count, user_id)
      VALUES (${sessionId}, ${name}, ${ownerIdNum}, ${streamer_wallet}, true, 0, 0, ${ownerIdNum})
      RETURNING *, session_id as id
    `

    console.log("Session created:", session[0])
    return NextResponse.json({ session: session[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
