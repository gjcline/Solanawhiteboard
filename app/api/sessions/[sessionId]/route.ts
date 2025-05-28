import { type NextRequest, NextResponse } from "next/server"
import { SessionService } from "@/lib/services/sessions"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log("API: Getting session:", params.sessionId)
    const session = await SessionService.getWithStats(params.sessionId)

    if (!session) {
      console.log("API: Session not found:", params.sessionId)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("API: Session found:", session)
    return NextResponse.json({ session })
  } catch (error) {
    console.error("API: Error fetching session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const updates = await request.json()
    console.log("API: Updating session:", params.sessionId, "with:", updates)

    const session = await SessionService.update(params.sessionId, updates)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("API: Session updated successfully:", session)
    return NextResponse.json({ session })
  } catch (error) {
    console.error("API: Error updating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log("API: Permanently deleting session:", params.sessionId)
    const success = await SessionService.permanentDelete(params.sessionId)

    if (!success) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("API: Session permanently deleted:", params.sessionId)
    return NextResponse.json({ message: "Session permanently deleted" })
  } catch (error) {
    console.error("API: Error deleting session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
