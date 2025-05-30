import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Store nuke effect data temporarily (could be moved to database if needed for persistence)
const nukeEffects = new Map<string, { user: string; startTime: number }>()

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Check if there's an active nuke effect
    const nukeEffect = nukeEffects.get(sessionId)

    if (nukeEffect) {
      const timeElapsed = Date.now() - nukeEffect.startTime
      const isActive = timeElapsed < 10000 // 10 second duration

      if (isActive) {
        return NextResponse.json({
          nukeEffect: {
            isActive: true,
            user: nukeEffect.user,
            startTime: nukeEffect.startTime,
          },
        })
      } else {
        // Clean up expired effect
        nukeEffects.delete(sessionId)
      }
    }

    return NextResponse.json({
      nukeEffect: {
        isActive: false,
        user: "",
        startTime: 0,
      },
    })
  } catch (error) {
    console.error("Error checking nuke effect:", error)
    return NextResponse.json({ error: "Failed to check nuke effect" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const body = await request.json()
    const { user, startTime } = body

    if (!sessionId || !user || !startTime) {
      return NextResponse.json({ error: "Session ID, user, and startTime required" }, { status: 400 })
    }

    // Verify session exists
    const sessionResult = await query("SELECT id FROM sessions WHERE id = $1 AND is_active = true", [sessionId])

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 })
    }

    // Store nuke effect
    nukeEffects.set(sessionId, { user, startTime })

    console.log(`[Nuke API] Stored nuke effect for session ${sessionId} by user ${user}`)

    return NextResponse.json({
      success: true,
      message: "Nuke effect stored successfully",
    })
  } catch (error) {
    console.error("Error storing nuke effect:", error)
    return NextResponse.json({ error: "Failed to store nuke effect" }, { status: 500 })
  }
}
