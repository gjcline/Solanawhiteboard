import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/users"

export async function POST(request: NextRequest) {
  try {
    console.log("Registration request received")

    const body = await request.json()
    console.log("Request body:", { ...body, password: "[REDACTED]" })

    const { username, email, password, wallet_address } = body

    // Validation
    if (!username || !email || !password) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if email already exists
    console.log("Checking if email exists:", email)
    const emailExists = await UserService.emailExists(email)
    if (emailExists) {
      console.log("Email already exists")
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Check if username already exists
    console.log("Checking if username exists:", username)
    const usernameExists = await UserService.usernameExists(username)
    if (usernameExists) {
      console.log("Username already exists")
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    // Create user
    console.log("Creating user...")
    const user = await UserService.create({
      username,
      email,
      password,
      wallet_address,
    })

    console.log("User created successfully:", user.id)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)

    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: "Registration failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
