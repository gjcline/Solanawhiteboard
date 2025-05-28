import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/users"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, wallet_address } = await request.json()

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if email already exists
    if (await UserService.emailExists(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Check if username already exists
    if (await UserService.usernameExists(username)) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    // Create user
    const user = await UserService.create({
      username,
      email,
      password,
      wallet_address,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
