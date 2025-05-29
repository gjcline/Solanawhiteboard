import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const result = await sql`
      SELECT canvas_data FROM sessions 
      WHERE session_id = ${params.sessionId} AND is_active = true
    `

    const session = result[0]

    return NextResponse.json({
      canvasData: session?.canvas_data || null,
    })
  } catch (error) {
    console.error("Error fetching canvas data:", error)
    return NextResponse.json({ error: "Failed to fetch canvas data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { canvasData } = await request.json()

    if (!canvasData) {
      return NextResponse.json({ error: "Canvas data is required" }, { status: 400 })
    }

    await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, updated_at = NOW()
      WHERE session_id = ${params.sessionId} AND is_active = true
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving canvas data:", error)
    return NextResponse.json({ error: "Failed to save canvas data" }, { status: 500 })
  }
}
