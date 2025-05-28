import { sql } from "../database"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  username: string
  email: string
  wallet_address?: string
  created_at: Date
  updated_at: Date
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  wallet_address?: string
}

export class UserService {
  // Create a new user
  static async create(data: CreateUserData): Promise<User> {
    try {
      console.log("UserService.create called with:", {
        username: data.username,
        email: data.email,
        hasPassword: !!data.password,
        wallet_address: data.wallet_address,
      })

      // Hash the password
      console.log("Hashing password...")
      const saltRounds = 12
      const password_hash = await bcrypt.hash(data.password, saltRounds)
      console.log("Password hashed successfully")

      console.log("Inserting user into database...")
      const result = await sql`
        INSERT INTO users (username, email, password_hash, wallet_address)
        VALUES (${data.username}, ${data.email}, ${password_hash}, ${data.wallet_address || null})
        RETURNING id, username, email, wallet_address, created_at, updated_at
      `

      console.log("User created successfully:", result[0] || "No result returned")
      return result[0]
    } catch (error) {
      console.error("Error in UserService.create:", error)
      throw error
    }
  }

  // Get user by email
  static async getByEmail(email: string): Promise<User | null> {
    try {
      console.log("Getting user by email:", email)
      const result = await sql`
        SELECT id, username, email, wallet_address, created_at, updated_at 
        FROM users 
        WHERE email = ${email}
      `
      console.log("Query result:", result.length > 0 ? "User found" : "User not found")
      return result[0] || null
    } catch (error) {
      console.error("Error getting user by email:", error)
      throw error
    }
  }

  // Get user by ID
  static async getById(id: number): Promise<User | null> {
    try {
      console.log("Getting user by ID:", id)
      const result = await sql`
        SELECT id, username, email, wallet_address, created_at, updated_at 
        FROM users 
        WHERE id = ${id}
      `
      return result[0] || null
    } catch (error) {
      console.error("Error getting user by ID:", error)
      throw error
    }
  }

  // Verify password
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      console.log("=== PASSWORD VERIFICATION START ===")
      console.log("Verifying password for email:", email)
      console.log("Password provided:", password ? "Yes" : "No")
      console.log("Password length:", password?.length || 0)

      const result = await sql`
        SELECT id, username, email, password_hash, wallet_address, created_at, updated_at 
        FROM users 
        WHERE email = ${email}
      `

      console.log("Database query completed")
      console.log("Users found:", result.length)

      if (result.length === 0) {
        console.log("❌ No user found with email:", email)
        return null
      }

      const user = result[0]
      console.log("✅ User found:", {
        id: user.id,
        username: user.username,
        email: user.email,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0,
      })

      if (!user.password_hash) {
        console.log("❌ User has no password hash stored")
        return null
      }

      console.log("Comparing passwords...")
      console.log("Input password:", password)
      console.log("Stored hash:", user.password_hash.substring(0, 20) + "...")

      const isValid = await bcrypt.compare(password, user.password_hash)
      console.log("Password comparison result:", isValid ? "✅ VALID" : "❌ INVALID")

      if (!isValid) {
        console.log("❌ Password verification failed")
        return null
      }

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user
      console.log("✅ Password verification successful for user:", userWithoutPassword.id)
      console.log("=== PASSWORD VERIFICATION END ===")
      return userWithoutPassword
    } catch (error) {
      console.error("❌ Error verifying password:", error)
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error")
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
      throw error
    }
  }

  // Update user
  static async update(id: number, data: Partial<CreateUserData>): Promise<User | null> {
    try {
      const updates = []
      const values = []

      if (data.username) {
        updates.push("username")
        values.push(data.username)
      }
      if (data.email) {
        updates.push("email")
        values.push(data.email)
      }
      if (data.wallet_address !== undefined) {
        updates.push("wallet_address")
        values.push(data.wallet_address)
      }
      if (data.password) {
        const password_hash = await bcrypt.hash(data.password, 12)
        updates.push("password_hash")
        values.push(password_hash)
      }

      if (updates.length === 0) return null

      // For now, let's use a simpler approach for updates
      if (data.username) {
        const result = await sql`
          UPDATE users 
          SET username = ${data.username}, updated_at = NOW() 
          WHERE id = ${id}
          RETURNING id, username, email, wallet_address, created_at, updated_at
        `
        return result[0] || null
      }

      return null
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      console.log("Checking if email exists:", email)

      const result = await sql`SELECT 1 FROM users WHERE email = ${email}`
      console.log("Email exists check result:", result.length > 0)
      return result.length > 0
    } catch (error) {
      console.error("Error checking email exists:", error)
      return false
    }
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    try {
      console.log("Checking if username exists:", username)

      const result = await sql`SELECT 1 FROM users WHERE username = ${username}`
      console.log("Username exists check result:", result.length > 0)
      return result.length > 0
    } catch (error) {
      console.error("Error checking username exists:", error)
      return false
    }
  }
}
