import { NextResponse } from "next/server"
import { SessionService } from "@/lib/services/sessions"

export async function POST(request: Request) {
  try {
    const { sessions, userId } = await request.json()

    if (!sessions || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const migratedSessions = []

    for (const session of sessions) {
      try {
        // Check if session already exists
        const existing = await SessionService.getById(session.id)
        if (existing) {
          migratedSessions.push(existing)
          continue
        }

        // Create new session in database
        const newSession = await SessionService.create({
          id: session.id,
          name: session.name,
          owner_id: userId,
          streamer_wallet: session.streamerWallet,
        })

        migratedSessions.push(newSession)
      } catch (error) {
        console.error(`Failed to migrate session ${session.id}:`, error)
      }
    }

    return NextResponse.json({
      message: "Migration completed",
      migrated: migratedSessions.length,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
