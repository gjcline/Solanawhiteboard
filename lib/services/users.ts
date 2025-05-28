import { query } from "../database"
import bcrypt from "bcryptjs"

export interface User {
  id: string
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
    // Hash the password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(data.password, saltRounds)

    // Generate user ID
    const id = Math.random().toString(36).substring(2, 14)

    const result = await query(
      `INSERT INTO users (id, username, email, password_hash, wallet_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, wallet_address, created_at, updated_at`,
      [id, data.username, data.email, password_hash, data.wallet_address],
    )
    return result.rows[0]
  }

  // Get user by email
  static async getByEmail(email: string): Promise<User | null> {
    const result = await query(
      "SELECT id, username, email, wallet_address, created_at, updated_at FROM users WHERE email = $1",
      [email],
    )
    return result.rows[0] || null
  }

  // Get user by ID
  static async getById(id: string): Promise<User | null> {
    const result = await query(
      "SELECT id, username, email, wallet_address, created_at, updated_at FROM users WHERE id = $1",
      [id],
    )
    return result.rows[0] || null
  }

  // Verify password
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const result = await query(
      "SELECT id, username, email, password_hash, wallet_address, created_at, updated_at FROM users WHERE email = $1",
      [email],
    )

    const user = result.rows[0]
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return null

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Update user
  static async update(id: string, data: Partial<CreateUserData>): Promise<User | null> {
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
    return result.rows[0] || null
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    const result = await query("SELECT 1 FROM users WHERE email = $1", [email])
    return result.rows.length > 0
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    const result = await query("SELECT 1 FROM users WHERE username = $1", [username])
    return result.rows.length > 0
  }
}
