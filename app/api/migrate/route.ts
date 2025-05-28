import { NextResponse } from "next/server"
import { runMigrations } from "@/scripts/migrate"

export async function POST() {
  try {
    // Only allow in development or with proper auth
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
    }

    await runMigrations()
    return NextResponse.json({ message: "Migrations completed successfully" })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
