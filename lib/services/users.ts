import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  username: string
  email: string
  wallet_address?: string
  created_at: string
  updated_at: string
}

export class UserService {
  // Verify password and return user
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      console.log("🔍 Verifying password for email:", email)

      const result = await sql`
        SELECT id, username, email, password_hash, wallet_address, created_at, updated_at
        FROM users
        WHERE email = ${email}
      `

      if (result.length === 0) {
        console.log("❌ User not found for email:", email)
        return null
      }

      const user = result[0]
      console.log("👤 User found:", { id: user.id, username: user.username, email: user.email })

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash)
      console.log("🔐 Password verification result:", isValid)

      if (!isValid) {
        return null
      }

      // Return user without password hash
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet_address: user.wallet_address,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      throw error
    }
  }

  // Update user
  static async update(id: number, data: Partial<User>): Promise<User | null> {
    try {
      console.log(`Updating user ${id} with data:`, data)

      // Handle wallet address update specifically
      if (data.wallet_address !== undefined) {
        console.log(`Updating wallet address for user ${id} to:`, data.wallet_address)
        const result = await sql`
          UPDATE users 
          SET wallet_address = ${data.wallet_address}, updated_at = NOW() 
          WHERE id = ${id}
          RETURNING id, username, email, wallet_address, created_at, updated_at
        `
        console.log("Wallet address update result:", result[0] || "No result")
        return result[0] || null
      }

      // Handle username update
      if (data.username) {
        const result = await sql`
          UPDATE users 
          SET username = ${data.username}, updated_at = NOW() 
          WHERE id = ${id}
          RETURNING id, username, email, wallet_address, created_at, updated_at
        `
        return result[0] || null
      }

      // Handle email update
      if (data.email) {
        const result = await sql`
          UPDATE users 
          SET email = ${data.email}, updated_at = NOW() 
          WHERE id = ${id}
          RETURNING id, username, email, wallet_address, created_at, updated_at
        `
        return result[0] || null
      }

      return null
    } catch (error) {
      console.error(`Error updating user ${id}:`, error)
      throw error
    }
  }

  // Get user by ID
  static async getById(id: number): Promise<User | null> {
    try {
      const result = await sql`
        SELECT id, username, email, wallet_address, created_at, updated_at
        FROM users
        WHERE id = ${id}
      `
      return result[0] || null
    } catch (error) {
      console.error(`Error getting user by id ${id}:`, error)
      throw error
    }
  }
}
