import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner_id = searchParams.get("owner_id")

    if (!owner_id) {
      return NextResponse.json({ error: "Owner ID required" }, { status: 400 })
    }

    console.log("Fetching sessions for owner_id:", owner_id)

    // First, check if the sessions table exists and has the right structure
    try {
      const tableCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' AND table_schema = 'public'
      `
      console.log(
        "Sessions table columns:",
        tableCheck.map((c) => c.column_name),
      )

      // Check if owner_id column exists
      const hasOwnerIdColumn = tableCheck.some((col) => col.column_name === "owner_id")

      if (!hasOwnerIdColumn) {
        console.log("Adding missing owner_id column...")
        await sql`ALTER TABLE sessions ADD COLUMN owner_id INTEGER REFERENCES users(id)`
        console.log("owner_id column added successfully")
      }
    } catch (error) {
      console.error("Error checking/fixing sessions table:", error)
      return NextResponse.json({ error: "Database table issue" }, { status: 500 })
    }

    // Now try to fetch sessions
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE owner_id = ${Number.parseInt(owner_id)} 
      ORDER BY created_at DESC
    `

    console.log("Found sessions:", sessions.length)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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

    console.log("Creating session:", { id, name, owner_id, streamer_wallet })

    const session = await sql`
      INSERT INTO sessions (id, name, owner_id, streamer_wallet)
      VALUES (${id}, ${name}, ${Number.parseInt(owner_id)}, ${streamer_wallet})
      RETURNING *
    `

    console.log("Session created:", session[0])
    return NextResponse.json({ session: session[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
