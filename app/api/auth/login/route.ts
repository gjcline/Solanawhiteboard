import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/users"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 LOGIN ATTEMPT STARTED")

    const body = await request.json()
    console.log("📨 Request body received:", {
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length || 0,
    })

    const { email, password } = body

    // Validation
    if (!email || !password) {
      console.log("❌ Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("🔍 Attempting to verify password for email:", email)

    // Verify credentials
    const user = await UserService.verifyPassword(email, password)
    console.log("🔐 Password verification result:", user ? "✅ SUCCESS" : "❌ FAILED")

    if (!user) {
      console.log("❌ Invalid credentials for email:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("✅ Login successful for user:", user.id)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("💥 Login error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
