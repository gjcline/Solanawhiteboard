import { type NextRequest, NextResponse } from "next/server"
import { SessionService } from "@/lib/services/sessions"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await SessionService.getWithStats(params.sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const success = await SessionService.delete(params.sessionId)

    if (!success) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Session deleted successfully" })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
