import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Simple registration started")

    const { username, email, password } = await request.json()
    console.log("📝 Registration data:", { username, email, hasPassword: !!password })

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Hash password
    console.log("🔐 Hashing password...")
    const password_hash = await bcrypt.hash(password, 12)

    // Try to insert user directly
    console.log("💾 Inserting user...")
    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${password_hash})
      RETURNING id, username, email, created_at
    `

    console.log("✅ User created:", result[0])

    return NextResponse.json({
      success: true,
      user: result[0],
    })
  } catch (error) {
    console.error("❌ Registration failed:", error)

    // Check if it's a duplicate key error
    if (error instanceof Error && error.message.includes("duplicate key")) {
      if (error.message.includes("username")) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
      if (error.message.includes("email")) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      }
    }

    return NextResponse.json(
      {
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
