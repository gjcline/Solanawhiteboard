import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("test_")) {
      return NextResponse.json({ error: "Invalid test user email" }, { status: 400 })
    }

    // Delete test user
    await sql`DELETE FROM users WHERE email = ${email}`

    return NextResponse.json({ success: true, message: "Test user cleaned up" })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
