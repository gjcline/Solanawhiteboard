import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, streamerWallet, userId } = await request.json()

    if (!name || !streamerWallet) {
      return NextResponse.json({ error: "Name and streamer wallet are required" }, { status: 400 })
    }

    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15)

    // Create session in database
    const result = await sql`
      INSERT INTO sessions (session_id, name, owner_id, streamer_wallet, is_active, total_earnings, viewer_count, created_at, updated_at)
      VALUES (${sessionId}, ${name}, ${userId || 1}, ${streamerWallet}, true, 0, 0, NOW(), NOW())
      RETURNING *
    `

    const session = result[0]

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://v0-solana-whiteboard-app.vercel.app"

    return NextResponse.json({
      session,
      sessionId: session.session_id,
      viewUrl: `${baseUrl}/view/${session.session_id}`,
      drawUrl: `${baseUrl}/draw/${session.session_id}`,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
