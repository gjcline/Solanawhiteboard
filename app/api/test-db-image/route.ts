import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Get the canvas data
    const result = await sql`
      SELECT canvas_data
      FROM sessions
      WHERE session_id = ${sessionId}
    `

    if (result.length === 0 || !result[0].canvas_data) {
      return NextResponse.json({ error: "No canvas data found" }, { status: 404 })
    }

    // Extract the base64 data
    const canvasData = result[0].canvas_data

    // Return the image directly
    return new Response(canvasData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[Test DB Image] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
