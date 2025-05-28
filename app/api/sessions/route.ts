import { type NextRequest, NextResponse } from "next/server"
import { SessionService } from "@/lib/services/sessions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner_id = searchParams.get("owner_id")

    if (!owner_id) {
      return NextResponse.json({ error: "Owner ID required" }, { status: 400 })
    }

    const sessions = await SessionService.getByOwner(owner_id)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, owner_id, streamer_wallet } = body

    if (!name || !owner_id || !streamer_wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate session ID
    const id = Math.random().toString(36).substring(2, 14)

    const session = await SessionService.create({
      id,
      name,
      owner_id,
      streamer_wallet,
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
