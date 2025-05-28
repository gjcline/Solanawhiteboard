import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

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

    // FIRST: Check if users table exists and create it if it doesn't
    try {
      console.log("Checking if users table exists...")
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `

      if (!tableExists[0].exists) {
        console.log("Users table doesn't exist, creating it...")
        await sql`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `
        console.log("Users table created successfully")
      } else {
        console.log("Users table exists")

        // Check if username column exists
        const usernameColumnExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
            AND column_name = 'username'
          )
        `

        if (!usernameColumnExists[0].exists) {
          console.log("Username column missing, adding it...")
          await sql`ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE`
          console.log("Username column added")
        }
      }
    } catch (tableError) {
      console.error("Error with users table:", tableError)
      return NextResponse.json({ error: "Database setup error" }, { status: 500 })
    }

    // Check if email already exists
    console.log("Checking if email exists:", email)
    try {
      const emailCheck = await sql`SELECT 1 FROM users WHERE email = ${email}`
      if (emailCheck.length > 0) {
        console.log("Email already exists")
        return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      }
    } catch (emailError) {
      console.error("Error checking email:", emailError)
    }

    // Check if username already exists
    console.log("Checking if username exists:", username)
    try {
      const usernameCheck = await sql`SELECT 1 FROM users WHERE username = ${username}`
      if (usernameCheck.length > 0) {
        console.log("Username already exists")
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
    } catch (usernameError) {
      console.error("Error checking username:", usernameError)
    }

    // Hash password
    console.log("Hashing password...")
    const saltRounds = 12
    const password_hash = await bcrypt.hash(password, saltRounds)
    console.log("Password hashed successfully")

    // Create user using template literal syntax
    console.log("Creating user...")
    const result = await sql`
      INSERT INTO users (username, email, password_hash, wallet_address)
      VALUES (${username}, ${email}, ${password_hash}, ${wallet_address || null})
      RETURNING id, username, email, wallet_address, created_at, updated_at
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create user - no user returned from database")
    }

    const user = result[0]
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
