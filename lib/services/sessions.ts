import { sql } from "../database"

export interface Session {
  id: string
  name: string
  owner_id: number
  streamer_wallet: string
  is_active: boolean
  canvas_data?: string
  total_earnings: number
  viewer_count: number
  created_at: Date
  updated_at: Date
}

export interface SessionStats {
  lines_drawn: number
  nukes_used: number
  total_tokens_sold: number
  unique_participants: number
}

export class SessionService {
  // Create a new session
  static async create(data: {
    id: string
    name: string
    owner_id: number
    streamer_wallet: string
  }): Promise<Session> {
    console.log("Creating session with data:", data)
    console.log("Data types:", {
      id: typeof data.id,
      name: typeof data.name,
      owner_id: typeof data.owner_id,
      streamer_wallet: typeof data.streamer_wallet,
    })

    const result = await sql`
      INSERT INTO sessions (id, name, owner_id, streamer_wallet, is_active, total_earnings, viewer_count)
      VALUES (${data.id}, ${data.name}, ${data.owner_id}, ${data.streamer_wallet}, true, 0, 0)
      RETURNING *
    `
    console.log("Session created:", result[0])
    return result[0]
  }

  // Get session by ID (only active sessions)
  static async getById(id: string): Promise<Session | null> {
    const result = await sql`
      SELECT * FROM sessions 
      WHERE id = ${id} AND is_active = true
    `
    return result[0] || null
  }

  // Get sessions by owner (only active sessions by default)
  static async getByOwner(owner_id: number, includeInactive = false): Promise<Session[]> {
    console.log("Fetching sessions for owner_id:", owner_id, "includeInactive:", includeInactive)

    const result = includeInactive
      ? await sql`
          SELECT * FROM sessions 
          WHERE owner_id = ${owner_id} 
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT * FROM sessions 
          WHERE owner_id = ${owner_id} AND is_active = true
          ORDER BY created_at DESC
        `

    console.log("Found sessions:", result.length)
    return result
  }

  // Update session
  static async update(id: string, data: Partial<Session>): Promise<Session | null> {
    console.log("Updating session:", id, "with data:", data)

    try {
      // Handle different update fields
      if (data.name !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET name = ${data.name}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.streamer_wallet !== undefined) {
        console.log("Updating streamer wallet for session:", id, "to:", data.streamer_wallet)
        const result = await sql`
          UPDATE sessions 
          SET streamer_wallet = ${data.streamer_wallet}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        console.log("Wallet update result:", result[0] || "No result")
        return result[0] || null
      }

      if (data.canvas_data !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET canvas_data = ${data.canvas_data}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.total_earnings !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET total_earnings = ${data.total_earnings}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.viewer_count !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET viewer_count = ${data.viewer_count}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.is_active !== undefined) {
        console.log("Updating session active status:", id, "to:", data.is_active)
        const result = await sql`
          UPDATE sessions 
          SET is_active = ${data.is_active}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `
        return result[0] || null
      }

      return null
    } catch (error) {
      console.error("Error updating session:", error)
      throw error
    }
  }

  // Delete session (soft delete)
  static async delete(id: string): Promise<boolean> {
    console.log("Soft deleting session:", id)
    const result = await sql`
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
    `
    return result.length > 0
  }

  // Permanently delete session (hard delete)
  static async permanentDelete(id: string): Promise<boolean> {
    console.log("Permanently deleting session:", id)
    const result = await sql`
      DELETE FROM sessions 
      WHERE id = ${id}
    `
    return result.length > 0
  }

  // Reactivate session
  static async reactivate(id: string): Promise<Session | null> {
    console.log("Reactivating session:", id)
    const result = await sql`
      UPDATE sessions 
      SET is_active = true, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] || null
  }

  // Get session with stats (only active sessions)
  static async getWithStats(id: string): Promise<(Session & SessionStats) | null> {
    const result = await sql`
      SELECT s.*, 
             COALESCE(st.lines_drawn, 0) as lines_drawn,
             COALESCE(st.nukes_used, 0) as nukes_used,
             COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
             COALESCE(st.unique_participants, 0) as unique_participants
      FROM sessions s
      LEFT JOIN session_stats st ON s.id = st.session_id
      WHERE s.id = ${id} AND s.is_active = true
    `
    return result[0] || null
  }

  // Update canvas data
  static async updateCanvas(id: string, canvas_data: string): Promise<void> {
    await sql`
      UPDATE sessions 
      SET canvas_data = ${canvas_data}, updated_at = NOW() 
      WHERE id = ${id} AND is_active = true
    `
  }

  // Increment stats
  static async incrementStat(session_id: string, stat: "lines_drawn" | "nukes_used"): Promise<void> {
    if (stat === "lines_drawn") {
      await sql`
        INSERT INTO session_stats (session_id, lines_drawn)
        VALUES (${session_id}, 1)
        ON CONFLICT (session_id)
        DO UPDATE SET lines_drawn = session_stats.lines_drawn + 1
      `
    } else if (stat === "nukes_used") {
      await sql`
        INSERT INTO session_stats (session_id, nukes_used)
        VALUES (${session_id}, 1)
        ON CONFLICT (session_id)
        DO UPDATE SET nukes_used = session_stats.nukes_used + 1
      `
    }
  }
}
