import { type NextRequest, NextResponse } from "next/server"
import { SessionService } from "@/lib/services/sessions"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await SessionService.getById(params.sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ canvas_data: session.canvas_data })
  } catch (error) {
    console.error("Error fetching canvas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { canvas_data } = await request.json()

    if (!canvas_data) {
      return NextResponse.json({ error: "Canvas data required" }, { status: 400 })
    }

    await SessionService.updateCanvas(params.sessionId, canvas_data)

    return NextResponse.json({ message: "Canvas updated successfully" })
  } catch (error) {
    console.error("Error updating canvas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
