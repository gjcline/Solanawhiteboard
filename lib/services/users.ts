import { query } from "../database"
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
      const result = await query(
        `INSERT INTO users (username, email, password_hash, wallet_address)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, wallet_address, created_at, updated_at`,
        [data.username, data.email, password_hash, data.wallet_address || null],
      )

      console.log("User created successfully:", result.rows?.[0] || "No result returned")
      return result.rows?.[0]
    } catch (error) {
      console.error("Error in UserService.create:", error)
      throw error
    }
  }

  // Get user by email
  static async getByEmail(email: string): Promise<User | null> {
    try {
      console.log("Getting user by email:", email)
      const result = await query(
        "SELECT id, username, email, wallet_address, created_at, updated_at FROM users WHERE email = $1",
        [email],
      )
      console.log("Query result:", result.rows?.length > 0 ? "User found" : "User not found")
      return result.rows?.[0] || null
    } catch (error) {
      console.error("Error getting user by email:", error)
      throw error
    }
  }

  // Get user by ID
  static async getById(id: number): Promise<User | null> {
    try {
      console.log("Getting user by ID:", id)
      const result = await query(
        "SELECT id, username, email, wallet_address, created_at, updated_at FROM users WHERE id = $1",
        [id],
      )
      return result.rows?.[0] || null
    } catch (error) {
      console.error("Error getting user by ID:", error)
      throw error
    }
  }

  // Verify password
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      console.log("Verifying password for email:", email)

      const result = await query(
        "SELECT id, username, email, password_hash, wallet_address, created_at, updated_at FROM users WHERE email = $1",
        [email],
      )

      console.log("User lookup result:", result.rows?.length > 0 ? "User found" : "User not found")

      const user = result.rows?.[0]
      if (!user) {
        console.log("No user found with email:", email)
        return null
      }

      console.log("Comparing password with hash...")
      const isValid = await bcrypt.compare(password, user.password_hash)
      console.log("Password comparison result:", isValid ? "Valid" : "Invalid")

      if (!isValid) return null

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user
      console.log("Password verification successful for user:", userWithoutPassword.id)
      return userWithoutPassword
    } catch (error) {
      console.error("Error verifying password:", error)
      throw error
    }
  }

  // Update user
  static async update(id: number, data: Partial<CreateUserData>): Promise<User | null> {
    try {
      const updates = []
      const values = []
      let paramCount = 1

      if (data.username) {
        updates.push(`username = $${paramCount++}`)
        values.push(data.username)
      }
      if (data.email) {
        updates.push(`email = $${paramCount++}`)
        values.push(data.email)
      }
      if (data.wallet_address !== undefined) {
        updates.push(`wallet_address = $${paramCount++}`)
        values.push(data.wallet_address)
      }
      if (data.password) {
        const password_hash = await bcrypt.hash(data.password, 12)
        updates.push(`password_hash = $${paramCount++}`)
        values.push(password_hash)
      }

      if (updates.length === 0) return null

      updates.push(`updated_at = NOW()`)
      values.push(id)

      const result = await query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} 
         RETURNING id, username, email, wallet_address, created_at, updated_at`,
        values,
      )
      return result.rows?.[0] || null
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      console.log("Checking if email exists:", email)

      // First check if the users table exists
      try {
        const tableCheck = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          )
        `)

        if (!tableCheck.rows?.[0]?.exists) {
          console.log("Users table does not exist")
          return false
        }
      } catch (tableError) {
        console.error("Error checking if users table exists:", tableError)
        return false
      }

      const result = await query("SELECT 1 FROM users WHERE email = $1", [email])

      if (result && result.rows && Array.isArray(result.rows)) {
        console.log("Email exists check result:", result.rows.length > 0)
        return result.rows.length > 0
      } else {
        console.log("Query returned unexpected format:", result)
        return false
      }
    } catch (error) {
      console.error("Error checking email exists:", error)
      return false
    }
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    try {
      console.log("Checking if username exists:", username)

      // First check if the users table exists
      try {
        const tableCheck = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          )
        `)

        if (!tableCheck.rows?.[0]?.exists) {
          console.log("Users table does not exist")
          return false
        }
      } catch (tableError) {
        console.error("Error checking if users table exists:", tableError)
        return false
      }

      const result = await query("SELECT 1 FROM users WHERE username = $1", [username])

      if (result && result.rows && Array.isArray(result.rows)) {
        console.log("Username exists check result:", result.rows.length > 0)
        return result.rows.length > 0
      } else {
        console.log("Query returned unexpected format:", result)
        return false
      }
    } catch (error) {
      console.error("Error checking username exists:", error)
      return false
    }
  }
}
