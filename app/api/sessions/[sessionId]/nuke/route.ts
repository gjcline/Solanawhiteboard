import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params

    console.log(`[Nuke API GET] Checking nuke effect for session: ${sessionId}`)

    // Check for active nuke effects in the last 10 seconds
    // Use sessionId as string, not integer
    const result = await sql`
      SELECT nuke_user, nuke_start_time 
      FROM sessions 
      WHERE id = ${sessionId} 
      AND nuke_start_time IS NOT NULL 
      AND nuke_start_time > NOW() - INTERVAL '10 seconds'
    `

    if (result.length > 0) {
      const nukeData = result[0]
      const startTime = new Date(nukeData.nuke_start_time).getTime()
      const timeElapsed = Date.now() - startTime
      const isActive = timeElapsed < 10000 // 10 seconds

      console.log(`[Nuke API GET] Found nuke effect - active: ${isActive}, elapsed: ${timeElapsed}ms`)

      return NextResponse.json({
        nukeEffect: {
          isActive,
          user: nukeData.nuke_user,
          startTime,
        },
      })
    }

    console.log(`[Nuke API GET] No active nuke effect found`)
    return NextResponse.json({
      nukeEffect: {
        isActive: false,
        user: "",
        startTime: 0,
      },
    })
  } catch (error) {
    console.error("[Nuke API GET] Error:", error)
    return NextResponse.json({ error: "Failed to check nuke effect" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const { user, startTime } = await request.json()

    console.log(`[Nuke API POST] Storing nuke effect for session: ${sessionId}, user: ${user}`)

    // Store the nuke effect in the database
    // Use sessionId as string, not integer
    await sql`
      UPDATE sessions 
      SET nuke_user = ${user}, nuke_start_time = ${new Date(startTime).toISOString()}
      WHERE id = ${sessionId}
    `

    console.log(`[Nuke API POST] Successfully stored nuke effect`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Nuke API POST] Error:", error)
    return NextResponse.json({ error: "Failed to store nuke effect" }, { status: 500 })
  }
}
